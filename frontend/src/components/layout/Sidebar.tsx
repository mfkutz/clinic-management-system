import { Building2, CalendarClock, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
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
  const pinnedSection = sections[sections.length - 1];
  const scrollSections = sections.slice(0, -1);

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-[#eaecef] bg-white transition-[width] duration-200 ${
        collapsed ? 'w-[76px]' : 'w-[264px]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-2.5 py-4">
        <Link to="/inicio" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#6a58f2] to-[#4b39d6] text-white">
            <CalendarClock className="h-5 w-5" />
          </span>
          {!collapsed && (
            <span className="truncate text-[15.5px] font-extrabold tracking-tight text-[#171a1f]">
              Sistema de Turnos
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[#9aa1ac] hover:bg-[#f4f5f7]"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <button
          type="button"
          className="mx-4 mt-1 flex items-center gap-2.5 rounded-xl border border-[#eaecef] bg-[#fbfbfc] px-3 py-2.5 text-left hover:bg-[#f4f5f7]"
        >
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#eef0fe] text-[#5847eb]">
            <Building2 className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13.5px] font-bold text-[#171a1f]">Clínica Dental Sonrisas</span>
            <span className="block truncate text-[11.5px] text-[#8a919c]">Av. Rivadavia 1234, CABA</span>
          </span>
          <ChevronsUpDown className="ml-auto h-[16px] w-[16px] shrink-0 text-[#b8bec7]" />
        </button>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {scrollSections.map((section, i) => (
          <div key={i}>
            {section.title && !collapsed && (
              <p className="mb-1.5 px-3 pt-1.5 text-[10.5px] font-bold tracking-[.09em] text-[#9aa1ac] uppercase">
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
                    className={`flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm font-medium text-[#aeb4bd] hover:bg-[#f4f5f7] ${
                      collapsed ? 'justify-center' : 'justify-between'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 shrink-0 text-[#c3c8d0]" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </span>
                    {!collapsed && (
                      <span className="shrink-0 rounded-md bg-[#eef0f2] px-1.5 py-0.5 text-[9.5px] font-bold tracking-[.05em] text-[#98a0ab] uppercase">
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
                      `flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm font-medium transition ${
                        collapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-[#5847eb] text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.55)]'
                          : 'text-[#4b535e] hover:bg-[#f4f5f7]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`h-5 w-5 shrink-0 ${isActive ? '' : 'text-[#8a919c]'}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-[#f0f1f3] px-4 py-3">
        {pinnedSection.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-sm font-medium transition ${
                collapsed ? 'justify-center' : ''
              } ${isActive ? 'bg-[#5847eb] text-white' : 'text-[#4b535e] hover:bg-[#f4f5f7]'}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? '' : 'text-[#8a919c]'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
