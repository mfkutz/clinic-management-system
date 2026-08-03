import { Op, Transaction } from 'sequelize';
import {
  Appointment,
  Availability,
  AvailabilityException,
  Professional,
  ProfessionalService,
  Service,
  User,
  sequelize,
} from '../models';
import { UserRole } from '../models/User';
import { HttpError } from '../middlewares/errorHandler';
import { computeAvailableSlots, timeToMinutes } from './scheduleService';

interface Requester {
  id: string;
  role: UserRole;
}

const appointmentDetailIncludes = [
  {
    model: Professional,
    as: 'professional',
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
  },
  { model: Service, as: 'service' },
  { model: User, as: 'client', attributes: ['id', 'name', 'email', 'phone'] },
];

interface CreateAppointmentInput {
  professionalId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  notes?: string;
}

function dayOfWeekFromDate(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

async function resolveServiceDetails(
  professionalId: string,
  serviceId: string
): Promise<{ durationMinutes: number; price: number }> {
  const service = await Service.findByPk(serviceId);
  if (!service || !service.active) {
    throw new HttpError(404, 'Servicio no encontrado');
  }

  const link = await ProfessionalService.findOne({ where: { professionalId, serviceId } });
  if (!link) {
    throw new HttpError(400, 'Este profesional no ofrece ese servicio');
  }

  return {
    durationMinutes: link.durationOverride ?? service.durationMinutes,
    price: link.priceOverride ?? Number(service.price),
  };
}

async function loadDayContext(professionalId: string, date: string) {
  const dayOfWeek = dayOfWeekFromDate(date);
  const [availabilities, exceptions, appointments] = await Promise.all([
    Availability.findAll({ where: { professionalId, dayOfWeek } }),
    AvailabilityException.findAll({ where: { professionalId, date } }),
    Appointment.findAll({
      where: {
        professionalId,
        status: 'confirmed',
        startDatetime: { [Op.between]: [new Date(`${date}T00:00:00Z`), new Date(`${date}T23:59:59Z`)] },
      },
    }),
  ]);

  const busyRanges = appointments.map((a) => ({
    start: a.startDatetime.getUTCHours() * 60 + a.startDatetime.getUTCMinutes(),
    end: a.endDatetime.getUTCHours() * 60 + a.endDatetime.getUTCMinutes(),
  }));

  return {
    availabilities: availabilities.map((a) => ({ startTime: a.startTime, endTime: a.endTime })),
    exceptions: exceptions.map((e) => ({
      startTime: e.startTime ?? undefined,
      endTime: e.endTime ?? undefined,
      isBlocked: e.isBlocked,
    })),
    busyRanges,
  };
}

export async function getFreeSlots(professionalId: string, serviceId: string, date: string) {
  const professional = await Professional.findByPk(professionalId);
  if (!professional || !professional.active) {
    throw new HttpError(404, 'Profesional no encontrado');
  }

  const { durationMinutes } = await resolveServiceDetails(professionalId, serviceId);
  const context = await loadDayContext(professionalId, date);

  let slots = computeAvailableSlots({ ...context, durationMinutes });

  const now = new Date();
  if (date === now.toISOString().slice(0, 10)) {
    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    slots = slots.filter((s) => s.startMinutes > nowMinutes);
  }

  return slots.map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
}

export async function createAppointment(clientId: string, input: CreateAppointmentInput) {
  const professional = await Professional.findByPk(input.professionalId);
  if (!professional || !professional.active) {
    throw new HttpError(404, 'Profesional no encontrado');
  }

  const { durationMinutes, price } = await resolveServiceDetails(input.professionalId, input.serviceId);

  const startDatetime = new Date(`${input.date}T${input.startTime}:00Z`);
  const endDatetime = new Date(startDatetime.getTime() + durationMinutes * 60_000);

  if (startDatetime.getTime() <= Date.now()) {
    throw new HttpError(400, 'No se puede reservar un turno en el pasado');
  }

  const context = await loadDayContext(input.professionalId, input.date);
  const slots = computeAvailableSlots({ ...context, durationMinutes });
  const requestedStart = timeToMinutes(input.startTime);
  const isSlotFree = slots.some((s) => s.startMinutes === requestedStart);
  if (!isSlotFree) {
    throw new HttpError(409, 'Ese horario ya no está disponible, elegí otro');
  }

  try {
    return await sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, async (transaction) => {
      const overlapping = await Appointment.findOne({
        where: {
          professionalId: input.professionalId,
          status: 'confirmed',
          startDatetime: { [Op.lt]: endDatetime },
          endDatetime: { [Op.gt]: startDatetime },
        },
        transaction,
      });
      if (overlapping) {
        throw new HttpError(409, 'Ese horario ya no está disponible, elegí otro');
      }

      const appointment = await Appointment.create(
        {
          clientId,
          professionalId: input.professionalId,
          serviceId: input.serviceId,
          startDatetime,
          endDatetime,
          notes: input.notes ?? null,
          amount: price,
        },
        { transaction }
      );

      return Appointment.findByPk(appointment.id, { include: appointmentDetailIncludes, transaction });
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    const dbErr = err as { original?: { code?: string } };
    if (dbErr.original?.code === '40001') {
      throw new HttpError(409, 'Ese horario ya no está disponible, elegí otro');
    }
    throw err;
  }
}

export async function listForRequester(requester: Requester) {
  const baseOptions = { include: appointmentDetailIncludes, order: [['startDatetime', 'DESC']] as [[string, string]] };

  if (requester.role === 'client') {
    return Appointment.findAll({ where: { clientId: requester.id }, ...baseOptions });
  }

  if (requester.role === 'professional') {
    const professional = await Professional.findOne({ where: { userId: requester.id } });
    if (!professional) return [];
    return Appointment.findAll({ where: { professionalId: professional.id }, ...baseOptions });
  }

  return Appointment.findAll(baseOptions);
}

export async function cancelAppointment(requester: Requester, appointmentId: string, reason?: string) {
  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) {
    throw new HttpError(404, 'Turno no encontrado');
  }

  if (appointment.status !== 'confirmed') {
    throw new HttpError(400, `Este turno no se puede cancelar (estado actual: ${appointment.status})`);
  }

  if (requester.role === 'client') {
    if (appointment.clientId !== requester.id) {
      throw new HttpError(403, 'No podés cancelar un turno que no es tuyo');
    }
    const hoursUntilStart = (appointment.startDatetime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilStart < 24) {
      throw new HttpError(400, 'Solo se puede cancelar un turno con al menos 24hs de anticipación');
    }
  } else if (requester.role === 'professional') {
    const professional = await Professional.findOne({ where: { userId: requester.id } });
    if (!professional || professional.id !== appointment.professionalId) {
      throw new HttpError(403, 'No podés cancelar un turno que no es tuyo');
    }
  }
  // admin: sin restricciones

  await appointment.update({ status: 'cancelled', cancellationReason: reason ?? null });
  return Appointment.findByPk(appointment.id, { include: appointmentDetailIncludes });
}

export async function markAsPaid(appointmentId: string, paymentMethod?: string) {
  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) {
    throw new HttpError(404, 'Turno no encontrado');
  }

  if (appointment.paymentStatus === 'paid') {
    throw new HttpError(400, 'Este turno ya está marcado como cobrado');
  }

  await appointment.update({
    paymentStatus: 'paid',
    paymentMethod: paymentMethod ?? null,
    paidAt: new Date(),
  });

  return Appointment.findByPk(appointment.id, { include: appointmentDetailIncludes });
}
