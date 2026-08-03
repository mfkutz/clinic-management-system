import { z } from 'zod';

export const createSupportRequestSchema = z.object({
  subject: z.string().min(3, 'El asunto es muy corto'),
  message: z.string().min(10, 'Contanos un poco más para poder ayudarte'),
});

export type CreateSupportRequestInput = z.infer<typeof createSupportRequestSchema>;
