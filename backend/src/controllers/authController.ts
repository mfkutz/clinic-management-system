import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { loginSchema, registerSchema } from '../validation/authSchemas';

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.id);
  res.json(user);
}
