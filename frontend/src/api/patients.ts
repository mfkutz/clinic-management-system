import { apiClient } from './client';
import type { PatientDetail, PatientSummary } from '../types';

export async function list(): Promise<PatientSummary[]> {
  const res = await apiClient.get<PatientSummary[]>('/patients');
  return res.data;
}

export async function getById(id: string): Promise<PatientDetail> {
  const res = await apiClient.get<PatientDetail>(`/patients/${id}`);
  return res.data;
}
