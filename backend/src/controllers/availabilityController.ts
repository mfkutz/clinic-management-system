import { Request, Response } from 'express';
import * as availabilityService from '../services/availabilityService';
import {
  createAvailabilityExceptionSchema,
  createAvailabilitySchema,
} from '../validation/availabilitySchemas';

export async function listAvailability(req: Request, res: Response) {
  res.json(await availabilityService.listAvailability(req.params.id as string));
}

export async function createAvailability(req: Request, res: Response) {
  const data = createAvailabilitySchema.parse(req.body);
  const availability = await availabilityService.createAvailability(req.params.id as string, req.user!, data);
  res.status(201).json(availability);
}

export async function removeAvailability(req: Request, res: Response) {
  await availabilityService.removeAvailability(req.params.id as string, req.user!, req.params.availabilityId as string);
  res.status(204).send();
}

export async function listExceptions(req: Request, res: Response) {
  const { from, to } = req.query as { from?: string; to?: string };
  res.json(await availabilityService.listExceptions(req.params.id as string, { from, to }));
}

export async function createException(req: Request, res: Response) {
  const data = createAvailabilityExceptionSchema.parse(req.body);
  const exception = await availabilityService.createException(req.params.id as string, req.user!, data);
  res.status(201).json(exception);
}

export async function removeException(req: Request, res: Response) {
  await availabilityService.removeException(req.params.id as string, req.user!, req.params.exceptionId as string);
  res.status(204).send();
}
