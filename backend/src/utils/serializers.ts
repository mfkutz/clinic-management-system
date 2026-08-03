import { User } from '../models/User';

export function toPublicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone };
}
