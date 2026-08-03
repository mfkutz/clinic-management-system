import { Op } from 'sequelize';
import { Availability, AvailabilityException } from '../models';
import { UserRole } from '../models/User';
import { HttpError } from '../middlewares/errorHandler';
import { CreateAvailabilityExceptionInput, CreateAvailabilityInput } from '../validation/availabilitySchemas';
import * as professionalService from './professionalService';

interface Requester {
  id: string;
  role: UserRole;
}

async function assertOwnerOrAdmin(professionalId: string, requester: Requester) {
  const professional = await professionalService.getOrThrow(professionalId);
  if (requester.role !== 'admin' && professional.userId !== requester.id) {
    throw new HttpError(403, 'No tenés permisos para gestionar la disponibilidad de este profesional');
  }
  return professional;
}

export async function listAvailability(professionalId: string) {
  return Availability.findAll({
    where: { professionalId },
    order: [
      ['dayOfWeek', 'ASC'],
      ['startTime', 'ASC'],
    ],
  });
}

export async function createAvailability(professionalId: string, requester: Requester, data: CreateAvailabilityInput) {
  const professional = await assertOwnerOrAdmin(professionalId, requester);

  const sameDay = await Availability.findAll({
    where: { professionalId: professional.id, dayOfWeek: data.dayOfWeek },
  });
  const overlaps = sameDay.some((a) => data.startTime < a.endTime && a.startTime < data.endTime);
  if (overlaps) {
    throw new HttpError(409, 'Ese horario se superpone con una disponibilidad ya cargada para ese día');
  }

  return Availability.create({ professionalId: professional.id, ...data });
}

export async function removeAvailability(professionalId: string, requester: Requester, availabilityId: string) {
  const professional = await assertOwnerOrAdmin(professionalId, requester);

  const deleted = await Availability.destroy({
    where: { id: availabilityId, professionalId: professional.id },
  });
  if (deleted === 0) {
    throw new HttpError(404, 'Disponibilidad no encontrada');
  }
}

export async function listExceptions(professionalId: string, range: { from?: string; to?: string }) {
  const where: Record<string, unknown> = { professionalId };

  if (range.from || range.to) {
    where.date = {
      ...(range.from ? { [Op.gte]: range.from } : {}),
      ...(range.to ? { [Op.lte]: range.to } : {}),
    };
  }

  return AvailabilityException.findAll({ where, order: [['date', 'ASC']] });
}

export async function createException(
  professionalId: string,
  requester: Requester,
  data: CreateAvailabilityExceptionInput
) {
  const professional = await assertOwnerOrAdmin(professionalId, requester);

  return AvailabilityException.create({
    professionalId: professional.id,
    date: data.date,
    startTime: data.startTime ?? null,
    endTime: data.endTime ?? null,
    isBlocked: data.isBlocked,
  });
}

export async function removeException(professionalId: string, requester: Requester, exceptionId: string) {
  const professional = await assertOwnerOrAdmin(professionalId, requester);

  const deleted = await AvailabilityException.destroy({
    where: { id: exceptionId, professionalId: professional.id },
  });
  if (deleted === 0) {
    throw new HttpError(404, 'Excepción no encontrada');
  }
}
