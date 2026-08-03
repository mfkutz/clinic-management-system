import { User } from '../models';
import { HttpError } from '../middlewares/errorHandler';
import { comparePassword, hashPassword } from '../utils/password';
import { signAuthToken } from '../utils/jwt';
import { toPublicUser } from '../utils/serializers';
import { LoginInput, RegisterInput } from '../validation/authSchemas';

export async function register(data: RegisterInput) {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    throw new HttpError(409, 'Ya existe una cuenta con ese email');
  }

  const passwordHash = await hashPassword(data.password);
  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash,
    phone: data.phone ?? null,
    role: 'client',
  });

  return { token: signAuthToken(user), user: toPublicUser(user) };
}

export async function login(data: LoginInput) {
  const user = await User.findOne({ where: { email: data.email } });
  if (!user || !user.active) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  const valid = await comparePassword(data.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, 'Credenciales inválidas');
  }

  return { token: signAuthToken(user), user: toPublicUser(user) };
}

export async function getCurrentUser(userId: string) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  return toPublicUser(user);
}
