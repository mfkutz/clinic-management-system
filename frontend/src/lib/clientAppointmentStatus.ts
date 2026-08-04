import { CalendarX, CheckCircle2, Clock, TicketCheck, XCircle, type LucideIcon } from 'lucide-react';
import type { Appointment } from '../types';

export type ClientAppointmentBadge = 'unconfirmed' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export function clientBadgeOf(a: Appointment): ClientAppointmentBadge {
  if (a.status === 'cancelled') return 'cancelled';
  if (a.status === 'no_show') return 'no_show';
  if (a.status === 'completed') return 'completed';
  return a.confirmedByClient ? 'confirmed' : 'unconfirmed';
}

export const CLIENT_STATUS_META: Record<ClientAppointmentBadge, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  unconfirmed: { label: 'Sin confirmar', color: '#d97706', bg: '#fef4e8', icon: Clock },
  confirmed: { label: 'Confirmado', color: '#16a34a', bg: '#eaf7ef', icon: CheckCircle2 },
  completed: { label: 'Atendido', color: '#6b7480', bg: '#eef1f4', icon: TicketCheck },
  cancelled: { label: 'Cancelado', color: '#dc2626', bg: '#fdecec', icon: XCircle },
  no_show: { label: 'No asistido', color: '#d97706', bg: '#fdf1e3', icon: CalendarX },
};
