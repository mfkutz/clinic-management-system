import { apiClient } from './client';
import type { ClinicalRecord } from '../types';

export async function listForPatient(patientId: string): Promise<ClinicalRecord[]> {
  const res = await apiClient.get<ClinicalRecord[]>(`/patients/${patientId}/clinical-records`);
  return res.data;
}

export async function createForPatient(patientId: string, content: string): Promise<ClinicalRecord> {
  const res = await apiClient.post<ClinicalRecord>(`/patients/${patientId}/clinical-records`, { content });
  return res.data;
}

export async function listRecent(): Promise<ClinicalRecord[]> {
  const res = await apiClient.get<ClinicalRecord[]>('/clinical-records');
  return res.data;
}
