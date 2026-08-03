import { apiClient } from './client';
import type { Availability, AvailabilityException } from '../types';

export interface CreateAvailabilityPayload {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface CreateExceptionPayload {
  date: string;
  startTime?: string;
  endTime?: string;
  isBlocked: boolean;
}

export async function listAvailability(professionalId: string): Promise<Availability[]> {
  const res = await apiClient.get<Availability[]>(`/professionals/${professionalId}/availability`);
  return res.data;
}

export async function createAvailability(
  professionalId: string,
  data: CreateAvailabilityPayload
): Promise<Availability> {
  const res = await apiClient.post<Availability>(`/professionals/${professionalId}/availability`, data);
  return res.data;
}

export async function removeAvailability(professionalId: string, availabilityId: string): Promise<void> {
  await apiClient.delete(`/professionals/${professionalId}/availability/${availabilityId}`);
}

export async function listExceptions(professionalId: string): Promise<AvailabilityException[]> {
  const res = await apiClient.get<AvailabilityException[]>(`/professionals/${professionalId}/availability-exceptions`);
  return res.data;
}

export async function createException(
  professionalId: string,
  data: CreateExceptionPayload
): Promise<AvailabilityException> {
  const res = await apiClient.post<AvailabilityException>(
    `/professionals/${professionalId}/availability-exceptions`,
    data
  );
  return res.data;
}

export async function removeException(professionalId: string, exceptionId: string): Promise<void> {
  await apiClient.delete(`/professionals/${professionalId}/availability-exceptions/${exceptionId}`);
}
