import { col, fn } from 'sequelize';
import { Appointment, Professional, Service, User } from '../models';
import { UserRole } from '../models/User';
import { HttpError } from '../middlewares/errorHandler';

interface Requester {
  id: string;
  role: UserRole;
}

interface AppointmentStatsRow {
  clientId: string;
  appointmentsCount: string;
  lastVisit: string | null;
}

async function getOwnProfessionalId(userId: string): Promise<string> {
  const professional = await Professional.findOne({ where: { userId } });
  if (!professional) {
    throw new HttpError(404, 'Perfil de profesional no encontrado');
  }
  return professional.id;
}

function mergeClientsWithStats(clients: User[], stats: AppointmentStatsRow[]) {
  const statsByClientId = new Map(stats.map((s) => [s.clientId, s]));

  return clients
    .map((client) => {
      const stat = statsByClientId.get(client.id);
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        active: client.active,
        appointmentsCount: stat ? Number(stat.appointmentsCount) : 0,
        lastVisit: stat?.lastVisit ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listForRequester(requester: Requester) {
  if (requester.role === 'professional') {
    const professionalId = await getOwnProfessionalId(requester.id);
    const stats = (await Appointment.findAll({
      where: { professionalId },
      attributes: ['clientId', [fn('COUNT', col('id')), 'appointmentsCount'], [fn('MAX', col('start_datetime')), 'lastVisit']],
      group: ['clientId'],
      raw: true,
    })) as unknown as AppointmentStatsRow[];

    if (stats.length === 0) return [];

    const clients = await User.findAll({
      where: { id: stats.map((s) => s.clientId) },
      attributes: ['id', 'name', 'email', 'phone', 'active'],
    });
    return mergeClientsWithStats(clients, stats);
  }

  const clients = await User.findAll({
    where: { role: 'client' },
    attributes: ['id', 'name', 'email', 'phone', 'active'],
  });
  const stats = (await Appointment.findAll({
    attributes: ['clientId', [fn('COUNT', col('id')), 'appointmentsCount'], [fn('MAX', col('start_datetime')), 'lastVisit']],
    group: ['clientId'],
    raw: true,
  })) as unknown as AppointmentStatsRow[];

  return mergeClientsWithStats(clients, stats);
}

export async function getDetailForRequester(requester: Requester, patientId: string) {
  const client = await User.findOne({ where: { id: patientId, role: 'client' } });
  if (!client) {
    throw new HttpError(404, 'Paciente no encontrado');
  }

  const where: Record<string, unknown> = { clientId: patientId };
  if (requester.role === 'professional') {
    where.professionalId = await getOwnProfessionalId(requester.id);
  }

  const appointments = await Appointment.findAll({
    where,
    include: [
      {
        model: Professional,
        as: 'professional',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      },
      { model: Service, as: 'service' },
    ],
    order: [['startDatetime', 'DESC']],
  });

  if (requester.role === 'professional' && appointments.length === 0) {
    throw new HttpError(404, 'Paciente no encontrado');
  }

  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    active: client.active,
    appointments,
  };
}
