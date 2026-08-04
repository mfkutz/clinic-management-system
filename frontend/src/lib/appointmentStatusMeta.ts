import { CalendarCheck, CalendarX, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react';
import type { AppointmentStatus } from '../types';

export const STATUS_META: Record<AppointmentStatus, { label: string; color: string; tint: string; icon: LucideIcon }> = {
  confirmed: { label: 'Confirmado', color: '#5847eb', tint: '#eef0fe', icon: CalendarCheck },
  completed: { label: 'Atendido', color: '#0f9d63', tint: '#e7f5ee', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: '#dc2626', tint: '#fdecec', icon: XCircle },
  no_show: { label: 'No asistió', color: '#d97706', tint: '#fdf1e3', icon: CalendarX },
};
