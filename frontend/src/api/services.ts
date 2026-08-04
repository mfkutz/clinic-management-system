import { apiClient } from './client';
import type { Service, ServiceCategory } from '../types';

export interface CreateServicePayload {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  category: ServiceCategory;
}

export interface UpdateServicePayload extends Partial<CreateServicePayload> {
  active?: boolean;
}

export async function list(): Promise<Service[]> {
  const res = await apiClient.get<Service[]>('/services');
  return res.data;
}

export async function listAll(): Promise<Service[]> {
  const res = await apiClient.get<Service[]>('/services/all');
  return res.data;
}

export async function create(data: CreateServicePayload): Promise<Service> {
  const res = await apiClient.post<Service>('/services', data);
  return res.data;
}

export async function update(id: string, data: UpdateServicePayload): Promise<Service> {
  const res = await apiClient.patch<Service>(`/services/${id}`, data);
  return res.data;
}
