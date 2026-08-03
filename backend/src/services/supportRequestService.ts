import { SupportRequest, User } from '../models';
import { UserRole } from '../models/User';
import { HttpError } from '../middlewares/errorHandler';
import { CreateSupportRequestInput } from '../validation/supportRequestSchemas';

interface Requester {
  id: string;
  role: UserRole;
}

export async function create(userId: string, data: CreateSupportRequestInput) {
  return SupportRequest.create({ userId, subject: data.subject, message: data.message });
}

export async function listForRequester(requester: Requester) {
  const where = requester.role === 'admin' ? {} : { userId: requester.id };
  return SupportRequest.findAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
    order: [['createdAt', 'DESC']],
  });
}

export async function resolve(id: string) {
  const request = await SupportRequest.findByPk(id);
  if (!request) {
    throw new HttpError(404, 'Solicitud no encontrada');
  }
  await request.update({ status: 'closed' });
  return request;
}
