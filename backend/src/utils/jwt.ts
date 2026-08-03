import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/User';

interface AuthTokenPayload {
  id: string;
  role: UserRole;
}

export function signAuthToken(user: AuthTokenPayload): string {
  return jwt.sign({ id: user.id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  } as SignOptions);
}
