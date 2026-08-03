import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const shortTimeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const availableSlotsQuerySchema = z.object({
  professionalId: z.string().uuid('professionalId inválido'),
  serviceId: z.string().uuid('serviceId inválido'),
  date: z.string().regex(dateRegex, 'Formato de fecha inválido (YYYY-MM-DD)'),
});

export const createAppointmentSchema = z.object({
  professionalId: z.string().uuid('professionalId inválido'),
  serviceId: z.string().uuid('serviceId inválido'),
  date: z.string().regex(dateRegex, 'Formato de fecha inválido (YYYY-MM-DD)'),
  startTime: z.string().regex(shortTimeRegex, 'Formato de hora inválido (HH:mm)'),
  notes: z.string().optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().optional(),
});

export const markAsPaidSchema = z.object({
  paymentMethod: z.string().optional(),
});

export type AvailableSlotsQuery = z.infer<typeof availableSlotsQuerySchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>;
