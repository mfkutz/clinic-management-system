import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive('Duración inválida'),
  price: z.number().nonnegative('Precio inválido'),
});

export const createProfessionalSchema = z.object({
  name: z.string().min(2, 'El nombre es muy corto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

export type CreateServiceFormValues = z.infer<typeof createServiceSchema>;
export type CreateProfessionalFormValues = z.infer<typeof createProfessionalSchema>;
