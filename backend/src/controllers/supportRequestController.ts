import { Request, Response } from 'express';
import * as supportRequestService from '../services/supportRequestService';
import { createSupportRequestSchema } from '../validation/supportRequestSchemas';

export async function create(req: Request, res: Response) {
  const data = createSupportRequestSchema.parse(req.body);
  const request = await supportRequestService.create(req.user!.id, data);
  res.status(201).json(request);
}

export async function list(req: Request, res: Response) {
  res.json(await supportRequestService.listForRequester(req.user!));
}

export async function resolve(req: Request, res: Response) {
  res.json(await supportRequestService.resolve(req.params.id as string));
}
