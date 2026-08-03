import { Service } from '../models';
import { HttpError } from '../middlewares/errorHandler';
import { CreateServiceInput, UpdateServiceInput } from '../validation/serviceSchemas';

export async function list() {
  return Service.findAll({ where: { active: true }, order: [['name', 'ASC']] });
}

/** Incluye inactivos: uso exclusivo del panel admin. */
export async function listAll() {
  return Service.findAll({ order: [['name', 'ASC']] });
}

export async function getById(id: string) {
  const service = await Service.findByPk(id);
  if (!service) {
    throw new HttpError(404, 'Servicio no encontrado');
  }
  return service;
}

export async function create(data: CreateServiceInput) {
  return Service.create(data);
}

export async function update(id: string, data: UpdateServiceInput) {
  const service = await getById(id);
  await service.update(data);
  return service;
}

export async function remove(id: string) {
  const service = await getById(id);
  await service.update({ active: false });
}
