/** Todas las fechas de turnos son UTC "ingenuo": se guardan e interpretan como si fueran hora local, sin conversión de zona horaria. */

export const dateKeyOf = (iso: string) => iso.slice(0, 10);

export function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86400000);
}

export const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const addDaysKey = (base: Date, days: number) => toDateKey(addDays(base, days));

export function minutesOfDayUTC(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}
