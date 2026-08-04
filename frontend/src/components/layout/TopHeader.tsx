import { Bell, ChevronDown, HelpCircle, LogOut, Menu, Plus, Search, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { pageTitles } from '../../lib/navConfig';
import { getInitials } from '../../lib/format';
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
  const initials = getInitials(user.name);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="flex h-[66px] shrink-0 items-center gap-5 border-b border-[#eaecef] bg-white px-6.5">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9aa1ac] hover:bg-[#f4f5f7] md:hidden"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <h1 className="shrink-0 text-[19px] font-extrabold tracking-tight text-[#171a1f]">{title}</h1>

      <div className="hidden max-w-[440px] flex-1 items-center gap-2 rounded-[11px] border border-[#eef0f2] bg-[#f4f5f7] px-3.5 py-2.5 text-[#9aa1ac] md:flex">
        <Search className="h-[19px] w-[19px] shrink-0" />
        <span className="truncate text-[13.5px]">Buscar pacientes, turnos, profesionales…</span>
        <span className="ml-auto shrink-0 rounded-md border border-[#e6e8eb] bg-white px-1.5 py-0.5 text-[11px] font-semibold text-[#aeb4bd]">
          ⌘K
        </span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        {primaryAction.to !== location.pathname && (
          <Link
            to={primaryAction.to}
            className="flex items-center gap-1.5 rounded-[11px] bg-[#5847eb] px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.6)] hover:bg-[#4636cf]"
          >
            <Plus className="h-[19px] w-[19px]" />
            {primaryAction.label}
          </Link>
        )}
        <button
          type="button"
          title="Ayuda"
          className="hidden h-10 w-10 items-center justify-center rounded-[11px] border border-[#eef0f2] bg-white text-[#6b7480] hover:bg-[#f4f5f7] sm:flex"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="Notificaciones"
          className="relative hidden h-10 w-10 items-center justify-center rounded-[11px] border border-[#eef0f2] bg-white text-[#6b7480] hover:bg-[#f4f5f7] sm:flex"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 h-[7px] w-[7px] rounded-full border border-white bg-[#ef4444]" />
        </button>
        <button
          type="button"
          title="Configuración"
          className="hidden h-10 w-10 items-center justify-center rounded-[11px] border border-[#eef0f2] bg-white text-[#6b7480] hover:bg-[#f4f5f7] sm:flex"
        >
          <Settings className="h-5 w-5" />
        </button>

        <div className="relative ml-1" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-[11px] py-1 pr-2 pl-1 hover:bg-[#f4f5f7]"
          >
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#5847eb] text-[15px] font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[13.5px] font-bold text-[#171a1f]">{user.name}</span>
              <span className="block text-[11.5px] text-[#8a919c]">{roleLabels[user.role]}</span>
            </span>
            <ChevronDown className="hidden h-[18px] w-[18px] text-[#b8bec7] sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-[#eaecef] bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#4b535e] hover:bg-[#f4f5f7]"
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
