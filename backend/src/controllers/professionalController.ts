import { Request, Response } from 'express';
import * as professionalService from '../services/professionalService';
import {
  assignServiceSchema,
  createProfessionalSchema,
  updateProfessionalSchema,
} from '../validation/professionalSchemas';

export async function list(_req: Request, res: Response) {
  res.json(await professionalService.list());
}

export async function listAll(_req: Request, res: Response) {
  res.json(await professionalService.listAll());
}

export async function me(req: Request, res: Response) {
  res.json(await professionalService.getByUserId(req.user!.id));
}

export async function getById(req: Request, res: Response) {
  res.json(await professionalService.getById(req.params.id as string));
}

export async function create(req: Request, res: Response) {
  const data = createProfessionalSchema.parse(req.body);
  res.status(201).json(await professionalService.create(data));
}

export async function update(req: Request, res: Response) {
  const data = updateProfessionalSchema.parse(req.body);
  res.json(await professionalService.update(req.params.id as string, data));
}

export async function remove(req: Request, res: Response) {
  await professionalService.remove(req.params.id as string);
  res.status(204).send();
}

export async function addService(req: Request, res: Response) {
  const data = assignServiceSchema.parse(req.body);
  const link = await professionalService.addService(req.params.id as string, data);
  res.status(201).json(link);
}

export async function removeService(req: Request, res: Response) {
  await professionalService.removeService(req.params.id as string, req.params.serviceId as string);
  res.status(204).send();
}
