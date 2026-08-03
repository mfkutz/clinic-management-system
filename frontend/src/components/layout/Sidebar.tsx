import { Building2, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { navSections } from '../../lib/navConfig';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const sections = navSections[user.role];

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 dark:border-gray-800 dark:bg-gray-900 ${
        collapsed ? 'w-[76px]' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <CalendarClock className="h-4.5 w-4.5" />
          </span>
          {!collapsed && (
            <span className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
              Sistema de Turnos
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mx-3 mt-4 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-gray-800">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <Building2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">Clínica Dental Sonrisas</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">Av. Rivadavia 1234, CABA</p>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {sections.map((section, i) => (
          <div key={i}>
            {section.title && !collapsed && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) =>
                item.comingSoon ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-800/60 ${
                      collapsed ? 'justify-center' : 'justify-between'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 uppercase dark:bg-gray-800">
                        Pronto
                      </span>
                    )}
                  </Link>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        collapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                )
              )}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
