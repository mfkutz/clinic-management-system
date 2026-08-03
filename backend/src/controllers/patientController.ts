import { Request, Response } from 'express';
import * as patientService from '../services/patientService';

export async function list(req: Request, res: Response) {
  res.json(await patientService.listForRequester(req.user!));
}

export async function getById(req: Request, res: Response) {
  res.json(await patientService.getDetailForRequester(req.user!, req.params.id as string));
}
