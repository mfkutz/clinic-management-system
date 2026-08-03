import { apiClient } from './client';
import type { Professional, ProfessionalServiceLink } from '../types';

export interface CreateProfessionalPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  color?: string;
}

export interface UpdateProfessionalPayload {
  specialty?: string;
  bio?: string;
  color?: string;
  active?: boolean;
}

export interface AssignServicePayload {
  serviceId: string;
  priceOverride?: number;
  durationOverride?: number;
}

export async function list(): Promise<Professional[]> {
  const res = await apiClient.get<Professional[]>('/professionals');
  return res.data;
}

export async function getMe(): Promise<Professional> {
  const res = await apiClient.get<Professional>('/professionals/me');
  return res.data;
}

export async function listAll(): Promise<Professional[]> {
  const res = await apiClient.get<Professional[]>('/professionals/all');
  return res.data;
}

export async function create(data: CreateProfessionalPayload): Promise<Professional> {
  const res = await apiClient.post<Professional>('/professionals', data);
  return res.data;
}

export async function update(id: string, data: UpdateProfessionalPayload): Promise<Professional> {
  const res = await apiClient.patch<Professional>(`/professionals/${id}`, data);
  return res.data;
}

export async function addService(professionalId: string, data: AssignServicePayload): Promise<ProfessionalServiceLink> {
  const res = await apiClient.post<ProfessionalServiceLink>(`/professionals/${professionalId}/services`, data);
  return res.data;
}

export async function removeService(professionalId: string, serviceId: string): Promise<void> {
  await apiClient.delete(`/professionals/${professionalId}/services/${serviceId}`);
}
