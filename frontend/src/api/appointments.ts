import { apiClient } from './client';
import type { Appointment, Slot } from '../types';

export interface AvailableSlotsParams {
  professionalId: string;
  serviceId: string;
  date: string;
}

export async function getAvailableSlots(params: AvailableSlotsParams): Promise<Slot[]> {
  const res = await apiClient.get<Slot[]>('/appointments/available-slots', { params });
  return res.data;
}

export interface CreateAppointmentPayload {
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export async function create(payload: CreateAppointmentPayload): Promise<Appointment> {
  const res = await apiClient.post<Appointment>('/appointments', payload);
  return res.data;
}

export async function listMine(): Promise<Appointment[]> {
  const res = await apiClient.get<Appointment[]>('/appointments/me');
  return res.data;
}

export async function cancel(id: string, reason?: string): Promise<Appointment> {
  const res = await apiClient.patch<Appointment>(`/appointments/${id}/cancel`, { reason });
  return res.data;
}

export async function confirmAttendance(id: string): Promise<Appointment> {
  const res = await apiClient.patch<Appointment>(`/appointments/${id}/confirm`);
  return res.data;
}

export async function markAsPaid(id: string, paymentMethod?: string): Promise<Appointment> {
  const res = await apiClient.patch<Appointment>(`/appointments/${id}/pay`, { paymentMethod });
  return res.data;
}

export async function complete(id: string): Promise<Appointment> {
  const res = await apiClient.patch<Appointment>(`/appointments/${id}/complete`);
  return res.data;
}

export async function markNoShow(id: string): Promise<Appointment> {
  const res = await apiClient.patch<Appointment>(`/appointments/${id}/no-show`);
  return res.data;
}
