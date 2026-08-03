import { Appointment, ClinicalRecord, Professional, User } from '../models';
import { UserRole } from '../models/User';
import { HttpError } from '../middlewares/errorHandler';
import * as professionalService from './professionalService';

interface Requester {
  id: string;
  role: UserRole;
}

const withAuthorIncludes = {
  include: [{ model: Professional, as: 'professional', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] }],
  order: [['createdAt', 'DESC']] as [[string, string]],
};

async function assertProfessionalTreatedPatient(professionalId: string, patientId: string) {
  const count = await Appointment.count({ where: { professionalId, clientId: patientId } });
  if (count === 0) {
    throw new HttpError(403, 'No podés acceder a la historia clínica de un paciente que no atendiste');
  }
}

export async function listForPatient(requester: Requester, patientId: string) {
  const patient = await User.findOne({ where: { id: patientId, role: 'client' } });
  if (!patient) {
    throw new HttpError(404, 'Paciente no encontrado');
  }

  if (requester.role === 'professional') {
    const professional = await professionalService.getByUserId(requester.id);
    await assertProfessionalTreatedPatient(professional.id, patientId);
  }

  return ClinicalRecord.findAll({ where: { patientId }, ...withAuthorIncludes });
}

export async function createForPatient(requester: Requester, patientId: string, content: string) {
  const patient = await User.findOne({ where: { id: patientId, role: 'client' } });
  if (!patient) {
    throw new HttpError(404, 'Paciente no encontrado');
  }

  const professional = await professionalService.getByUserId(requester.id);
  await assertProfessionalTreatedPatient(professional.id, patientId);

  const record = await ClinicalRecord.create({ patientId, professionalId: professional.id, content });
  return ClinicalRecord.findByPk(record.id, withAuthorIncludes);
}

export async function listRecentForRequester(requester: Requester) {
  const where: Record<string, unknown> = {};
  if (requester.role === 'professional') {
    const professional = await professionalService.getByUserId(requester.id);
    where.professionalId = professional.id;
  }

  return ClinicalRecord.findAll({
    where,
    limit: 50,
    include: [
      { model: User, as: 'patient', attributes: ['id', 'name'] },
      { model: Professional, as: 'professional', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
    ],
    order: [['createdAt', 'DESC']],
  });
}
