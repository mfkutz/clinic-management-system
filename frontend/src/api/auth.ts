import { apiClient } from './client';
import type { AuthResponse, User } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(data: RegisterPayload): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function login(data: LoginPayload): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function me(): Promise<User> {
  const res = await apiClient.get<User>('/auth/me');
  return res.data;
}
