import { UniqueConstraintError } from 'sequelize';
import { Professional, ProfessionalService, Service, User, sequelize } from '../models';
import { HttpError } from '../middlewares/errorHandler';
import { hashPassword } from '../utils/password';
import {
  AssignServiceInput,
  CreateProfessionalInput,
  UpdateProfessionalInput,
} from '../validation/professionalSchemas';

const userSummaryAttributes = ['id', 'name', 'email', 'phone'] as const;
const withUserAndServices = {
  include: [
    { model: User, as: 'user', attributes: [...userSummaryAttributes] },
    { model: Service, as: 'services' },
  ],
};

export async function list() {
  return Professional.findAll({ where: { active: true }, ...withUserAndServices });
}

/** Incluye inactivos: uso exclusivo del panel admin. */
export async function listAll() {
  return Professional.findAll(withUserAndServices);
}

export async function getById(id: string) {
  const professional = await Professional.findByPk(id, withUserAndServices);
  if (!professional) {
    throw new HttpError(404, 'Profesional no encontrado');
  }
  return professional;
}

export async function create(data: CreateProfessionalInput) {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    throw new HttpError(409, 'Ya existe una cuenta con ese email');
  }

  const professional = await sequelize.transaction(async (transaction) => {
    const passwordHash = await hashPassword(data.password);
    const user = await User.create(
      {
        name: data.name,
        email: data.email,
        passwordHash,
        phone: data.phone ?? null,
        role: 'professional',
      },
      { transaction }
    );

    return Professional.create(
      {
        userId: user.id,
        specialty: data.specialty ?? null,
        bio: data.bio ?? null,
        color: data.color ?? '#4f46e5',
      },
      { transaction }
    );
  });

  return Professional.findByPk(professional.id, withUserAndServices);
}

export async function getByUserId(userId: string) {
  const professional = await Professional.findOne({ where: { userId }, ...withUserAndServices });
  if (!professional) {
    throw new HttpError(404, 'Perfil de profesional no encontrado');
  }
  return professional;
}

export async function getOrThrow(id: string): Promise<Professional> {
  const professional = await Professional.findByPk(id);
  if (!professional) {
    throw new HttpError(404, 'Profesional no encontrado');
  }
  return professional;
}

export async function update(id: string, data: UpdateProfessionalInput) {
  const professional = await getOrThrow(id);
  await professional.update(data);
  return professional;
}

export async function remove(id: string) {
  const professional = await getOrThrow(id);
  await professional.update({ active: false });
}

export async function addService(professionalId: string, data: AssignServiceInput) {
  await getOrThrow(professionalId);

  const service = await Service.findByPk(data.serviceId);
  if (!service || !service.active) {
    throw new HttpError(404, 'Servicio no encontrado');
  }

  try {
    return await ProfessionalService.create({
      professionalId,
      serviceId: data.serviceId,
      priceOverride: data.priceOverride ?? null,
      durationOverride: data.durationOverride ?? null,
    });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new HttpError(409, 'Ese servicio ya está asignado a este profesional');
    }
    throw err;
  }
}

export async function removeService(professionalId: string, serviceId: string) {
  const deleted = await ProfessionalService.destroy({ where: { professionalId, serviceId } });
  if (deleted === 0) {
    throw new HttpError(404, 'Ese servicio no está asignado a este profesional');
  }
}
