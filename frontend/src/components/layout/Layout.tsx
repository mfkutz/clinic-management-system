import { CalendarClock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Cerrar el drawer mobile al navegar a otra ruta (SPA: no hay reload que lo haga solo).
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  // Rutas ya rediseñadas sección por sección (handoff de Claude Design, o diseñadas con el mismo
  // criterio cuando no hubo handoff), que manejan sus propias cards en vez de depender del wrapper
  // genérico de abajo. Las 3 secciones de "Inicio" (una por rol) están todas rediseñadas.
  const ADMIN_ONLY_FULL_BLEED_PATHS = ['/admin/servicios', '/admin/profesionales', '/cobros', '/reportes'];
  const CLIENT_ONLY_FULL_BLEED_PATHS = ['/reservar', '/mis-turnos'];
  const PROFESSIONAL_ONLY_FULL_BLEED_PATHS = ['/profesional/disponibilidad'];
  const SHARED_FULL_BLEED_PATHS = ['/agenda', '/pacientes', '/historias-clinicas'];
  const isFullBleed =
    location.pathname === '/inicio' ||
    (user?.role === 'admin' && ADMIN_ONLY_FULL_BLEED_PATHS.includes(location.pathname)) ||
    (user?.role === 'client' && CLIENT_ONLY_FULL_BLEED_PATHS.includes(location.pathname)) ||
    (user?.role === 'professional' && PROFESSIONAL_ONLY_FULL_BLEED_PATHS.includes(location.pathname)) ||
    SHARED_FULL_BLEED_PATHS.includes(location.pathname) ||
    location.pathname.startsWith('/pacientes/');

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="w-full max-w-sm">
          <Link to="/login" className="mb-8 flex items-center justify-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <CalendarClock className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sistema de Turnos</span>
          </Link>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Outlet />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f7f9]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader onOpenMobileSidebar={() => setMobileOpen(true)} />
        {isFullBleed ? (
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:p-6 dark:border-gray-800 dark:bg-gray-900">
              <Outlet />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
