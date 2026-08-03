import { Bell, ChevronDown, HelpCircle, Menu, Plus, Search, Settings, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { pageTitles } from '../../lib/navConfig';
import type { UserRole } from '../../types';

const roleLabels: Record<UserRole, string> = {
  admin: 'Super admin',
  professional: 'Profesional',
  client: 'Cliente',
};

const primaryActionByRole: Record<UserRole, { to: string; label: string }> = {
  client: { to: '/reservar', label: 'Reservar turno' },
  admin: { to: '/admin/servicios', label: 'Nuevo servicio' },
  professional: { to: '/profesional/disponibilidad', label: 'Nueva disponibilidad' },
};

interface TopHeaderProps {
  onToggleSidebar: () => void;
}

export function TopHeader({ onToggleSidebar }: TopHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const title =
    pageTitles[location.pathname] ??
    (location.pathname.startsWith('/pacientes/') ? 'Paciente' : 'Sistema de Turnos');
  const primaryAction = primaryActionByRole[user.role];
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-3.5 dark:border-gray-800 dark:bg-gray-900">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden dark:hover:bg-gray-800"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <h1 className="shrink-0 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h1>

      <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar…"
          className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-sm text-gray-700 placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          to={primaryAction.to}
          title={primaryAction.label}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="h-4.5 w-4.5" />
        </Link>
        <button
          type="button"
          title="Ayuda"
          className="hidden h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:flex dark:hover:bg-gray-800"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          title="Notificaciones"
          className="hidden h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:flex dark:hover:bg-gray-800"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <button
          type="button"
          title="Configuración"
          className="hidden h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:flex dark:hover:bg-gray-800"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>

        <div className="relative ml-1" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{roleLabels[user.role]}</span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
