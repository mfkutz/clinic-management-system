export function formatMoney(amount: number | string | null): string {
  if (amount === null) return '—';
  return `$${Number(amount).toLocaleString('es-AR')}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const capitalized = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Fecha real "de hoy" para saludos, en la zona horaria del visitante (no la convención UTC-naive usada para horarios de turnos). */
export function formatLongDateLabel(date: Date): string {
  return capitalized(
    date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  );
}

export function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
}
