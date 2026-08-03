import { z } from 'zod';

export const createClinicalRecordSchema = z.object({
  content: z.string().min(3, 'La nota es muy corta'),
});

export type CreateClinicalRecordInput = z.infer<typeof createClinicalRecordSchema>;
