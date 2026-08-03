import { Request, Response } from 'express';
import * as clinicalRecordService from '../services/clinicalRecordService';
import { createClinicalRecordSchema } from '../validation/clinicalRecordSchemas';

export async function listForPatient(req: Request, res: Response) {
  res.json(await clinicalRecordService.listForPatient(req.user!, req.params.id as string));
}

export async function createForPatient(req: Request, res: Response) {
  const data = createClinicalRecordSchema.parse(req.body);
  const record = await clinicalRecordService.createForPatient(req.user!, req.params.id as string, data.content);
  res.status(201).json(record);
}

export async function listRecent(req: Request, res: Response) {
  res.json(await clinicalRecordService.listRecentForRequester(req.user!));
}
