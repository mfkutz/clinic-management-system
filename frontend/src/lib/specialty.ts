import { Baby, Scissors, Smile, Sparkles, Stethoscope, Syringe, type LucideIcon } from 'lucide-react';

export const SPECIALTY_META: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  'Odontología general': { icon: Stethoscope, color: '#5847eb', bg: '#eef0fe' },
  Ortodoncia: { icon: Smile, color: '#7c4dcb', bg: '#f0eafd' },
  Endodoncia: { icon: Syringe, color: '#dc2626', bg: '#fdecec' },
  Odontopediatría: { icon: Baby, color: '#0f9d63', bg: '#eef7f2' },
  'Estética dental': { icon: Sparkles, color: '#c2418a', bg: '#fce8f3' },
  'Cirugía maxilofacial': { icon: Scissors, color: '#2477c9', bg: '#e7f1fb' },
};
const FALLBACK_SPECIALTY_META = { icon: Stethoscope, color: '#6b7480', bg: '#eef1f4' };
export const SPECIALTY_PRESETS = Object.keys(SPECIALTY_META);

export function specialtyMeta(specialty: string | null | undefined) {
  if (!specialty) return FALLBACK_SPECIALTY_META;
  return SPECIALTY_META[specialty] ?? FALLBACK_SPECIALTY_META;
}
