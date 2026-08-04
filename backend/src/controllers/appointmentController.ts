import { Request, Response } from 'express';
import * as appointmentService from '../services/appointmentService';
import {
  availableSlotsQuerySchema,
  cancelAppointmentSchema,
  createAppointmentSchema,
  markAsPaidSchema,
} from '../validation/appointmentSchemas';

export async function availableSlots(req: Request, res: Response) {
  const query = availableSlotsQuerySchema.parse(req.query);
  const slots = await appointmentService.getFreeSlots(query.professionalId, query.serviceId, query.date);
  res.json(slots);
}

export async function create(req: Request, res: Response) {
  const data = createAppointmentSchema.parse(req.body);
  const appointment = await appointmentService.createAppointment(req.user!.id, data);
  res.status(201).json(appointment);
}

export async function listMine(req: Request, res: Response) {
  const appointments = await appointmentService.listForRequester(req.user!);
  res.json(appointments);
}

export async function cancel(req: Request, res: Response) {
  const data = cancelAppointmentSchema.parse(req.body ?? {});
  const appointment = await appointmentService.cancelAppointment(req.user!, req.params.id as string, data.reason);
  res.json(appointment);
}

export async function confirmAttendance(req: Request, res: Response) {
  const appointment = await appointmentService.confirmAttendance(req.user!, req.params.id as string);
  res.json(appointment);
}

export async function markAsPaid(req: Request, res: Response) {
  const data = markAsPaidSchema.parse(req.body ?? {});
  const appointment = await appointmentService.markAsPaid(req.params.id as string, data.paymentMethod);
  res.json(appointment);
}

export async function complete(req: Request, res: Response) {
  const appointment = await appointmentService.completeAppointment(req.user!, req.params.id as string);
  res.json(appointment);
}

export async function markNoShow(req: Request, res: Response) {
  const appointment = await appointmentService.markNoShow(req.user!, req.params.id as string);
  res.json(appointment);
}
