import { Sparkles, ShieldCheck, Smile, Stethoscope, Syringe, type LucideIcon } from 'lucide-react';
import type { ServiceCategory } from '../types';

export const CATEGORY_META: Record<ServiceCategory, { color: string; bg: string; icon: LucideIcon }> = {
  Consulta: { color: '#5847eb', bg: '#eef0fe', icon: Stethoscope },
  Estética: { color: '#c2418a', bg: '#fce8f3', icon: Sparkles },
  Ortodoncia: { color: '#7c4dcb', bg: '#f0eafd', icon: Smile },
  Cirugía: { color: '#dc2626', bg: '#fdecec', icon: Syringe },
  Prevención: { color: '#0f9d63', bg: '#eef7f2', icon: ShieldCheck },
};
