import type { AppointmentStatus } from '../types';

export const statusLabels: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
  no_show: 'No se presentó',
};

export const statusClasses: Record<AppointmentStatus, string> = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  no_show: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
};
