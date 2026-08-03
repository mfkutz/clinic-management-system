import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAvailabilitySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(timeRegex, 'Formato de hora inválido'),
    endTime: z.string().regex(timeRegex, 'Formato de hora inválido'),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'La hora de fin debe ser posterior a la de inicio',
    path: ['endTime'],
  });

export const createExceptionSchema = z
  .object({
    date: z.string().regex(dateRegex, 'Formato de fecha inválido'),
    isBlocked: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isBlocked) {
      if (!data.startTime || !timeRegex.test(data.startTime)) {
        ctx.addIssue({ code: 'custom', message: 'Requerido para horario extra', path: ['startTime'] });
      }
      if (!data.endTime || !timeRegex.test(data.endTime)) {
        ctx.addIssue({ code: 'custom', message: 'Requerido para horario extra', path: ['endTime'] });
      }
    } else if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      ctx.addIssue({ code: 'custom', message: 'La hora de fin debe ser posterior a la de inicio', path: ['endTime'] });
    }
  });

export type CreateAvailabilityFormValues = z.infer<typeof createAvailabilitySchema>;
export type CreateExceptionFormValues = z.infer<typeof createExceptionSchema>;
