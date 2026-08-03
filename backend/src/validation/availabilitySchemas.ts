import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAvailabilitySchema = z
  .object({
    dayOfWeek: z.number().int().min(0, '0=domingo ... 6=sábado').max(6),
    startTime: z.string().regex(timeRegex, 'Formato de hora inválido (HH:mm)'),
    endTime: z.string().regex(timeRegex, 'Formato de hora inválido (HH:mm)'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'endTime debe ser posterior a startTime',
    path: ['endTime'],
  });

export const createAvailabilityExceptionSchema = z
  .object({
    date: z.string().regex(dateRegex, 'Formato de fecha inválido (YYYY-MM-DD)'),
    startTime: z.string().regex(timeRegex, 'Formato de hora inválido (HH:mm)').optional(),
    endTime: z.string().regex(timeRegex, 'Formato de hora inválido (HH:mm)').optional(),
    isBlocked: z.boolean().default(true),
  })
  .refine((data) => (data.startTime && data.endTime ? data.startTime < data.endTime : true), {
    message: 'endTime debe ser posterior a startTime',
    path: ['endTime'],
  })
  .refine((data) => (data.isBlocked ? true : Boolean(data.startTime && data.endTime)), {
    message: 'Una excepción de disponibilidad extra (isBlocked=false) requiere startTime y endTime',
    path: ['startTime'],
  });

export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type CreateAvailabilityExceptionInput = z.infer<typeof createAvailabilityExceptionSchema>;
