import { Request, Response } from 'express';
import * as catalogService from '../services/catalogService';
import { createServiceSchema, updateServiceSchema } from '../validation/serviceSchemas';

export async function list(_req: Request, res: Response) {
  res.json(await catalogService.list());
}

export async function listAll(_req: Request, res: Response) {
  res.json(await catalogService.listAll());
}

export async function getById(req: Request, res: Response) {
  res.json(await catalogService.getById(req.params.id as string));
}

export async function create(req: Request, res: Response) {
  const data = createServiceSchema.parse(req.body);
  res.status(201).json(await catalogService.create(data));
}

export async function update(req: Request, res: Response) {
  const data = updateServiceSchema.parse(req.body);
  res.json(await catalogService.update(req.params.id as string, data));
}

export async function remove(req: Request, res: Response) {
  await catalogService.remove(req.params.id as string);
  res.status(204).send();
}
