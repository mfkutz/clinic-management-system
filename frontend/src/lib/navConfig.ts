import {
  BarChart3,
  CalendarCheck,
  CalendarPlus,
  CalendarRange,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Stethoscope,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  comingSoon?: boolean;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const pageTitles: Record<string, string> = {
  '/': 'Inicio',
  '/reservar': 'Reservar turno',
  '/mis-turnos': 'Mis turnos',
  '/admin/servicios': 'Servicios',
  '/admin/profesionales': 'Profesionales',
  '/profesional/disponibilidad': 'Disponibilidad',
  '/profesional/agenda': 'Agenda',
  '/pacientes': 'Pacientes',
  '/historias-clinicas': 'Historias clínicas',
  '/cobros': 'Cobros',
  '/soporte': 'Soporte',
  '/proximamente': 'Próximamente',
};

export const navSections: Record<UserRole, NavSection[]> = {
  client: [
    { items: [{ to: '/', label: 'Inicio', icon: LayoutDashboard, end: true }] },
    {
      title: 'Turnos',
      items: [
        { to: '/reservar', label: 'Reservar turno', icon: CalendarPlus },
        { to: '/mis-turnos', label: 'Mis turnos', icon: CalendarCheck },
      ],
    },
    {
      items: [{ to: '/soporte', label: 'Soporte', icon: LifeBuoy }],
    },
  ],
  admin: [
    { items: [{ to: '/', label: 'Inicio', icon: LayoutDashboard, end: true }] },
    {
      title: 'Gestión',
      items: [
        { to: '/admin/servicios', label: 'Servicios', icon: Stethoscope },
        { to: '/admin/profesionales', label: 'Profesionales', icon: Users },
      ],
    },
    {
      title: 'Clínica',
      items: [
        { to: '/pacientes', label: 'Pacientes', icon: UserRound },
        { to: '/historias-clinicas', label: 'Historias clínicas', icon: FileText },
      ],
    },
    {
      title: 'Finanzas',
      items: [
        { to: '/cobros', label: 'Cobros', icon: CreditCard },
        { to: '/proximamente', label: 'Reportes', icon: BarChart3, comingSoon: true },
      ],
    },
    {
      items: [{ to: '/soporte', label: 'Soporte', icon: LifeBuoy }],
    },
  ],
  professional: [
    { items: [{ to: '/', label: 'Inicio', icon: LayoutDashboard, end: true }] },
    {
      title: 'Agenda',
      items: [
        { to: '/profesional/disponibilidad', label: 'Disponibilidad', icon: Clock },
        { to: '/profesional/agenda', label: 'Agenda', icon: CalendarRange },
      ],
    },
    {
      title: 'Clínica',
      items: [
        { to: '/pacientes', label: 'Pacientes', icon: UserRound },
        { to: '/historias-clinicas', label: 'Historias clínicas', icon: FileText },
      ],
    },
    {
      items: [{ to: '/soporte', label: 'Soporte', icon: LifeBuoy }],
    },
  ],
};
