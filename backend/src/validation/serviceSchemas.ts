import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive('La duración debe ser mayor a 0'),
  price: z.number().nonnegative('El precio no puede ser negativo'),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  active: z.boolean().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
