import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/User';

interface JwtPayload {
  id: string;
  role: UserRole;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tenés permisos para esta acción' });
    }
    next();
  };
}
