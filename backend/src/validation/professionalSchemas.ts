import { z } from 'zod';

export const createProfessionalSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  color: z.string().optional(),
});

export const updateProfessionalSchema = z.object({
  specialty: z.string().optional(),
  bio: z.string().optional(),
  color: z.string().optional(),
  active: z.boolean().optional(),
});

export const assignServiceSchema = z.object({
  serviceId: z.string().uuid('serviceId inválido'),
  priceOverride: z.number().nonnegative().optional(),
  durationOverride: z.number().int().positive().optional(),
});

export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;
export type AssignServiceInput = z.infer<typeof assignServiceSchema>;
