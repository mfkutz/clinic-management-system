import { apiClient } from './client';
import type { SupportRequest } from '../types';

export interface CreateSupportRequestPayload {
  subject: string;
  message: string;
}

export async function create(data: CreateSupportRequestPayload): Promise<SupportRequest> {
  const res = await apiClient.post<SupportRequest>('/support-requests', data);
  return res.data;
}

export async function list(): Promise<SupportRequest[]> {
  const res = await apiClient.get<SupportRequest[]>('/support-requests');
  return res.data;
}

export async function resolve(id: string): Promise<SupportRequest> {
  const res = await apiClient.patch<SupportRequest>(`/support-requests/${id}/resolve`);
  return res.data;
}
