import { useAuthStore } from '../stores/authStore';
import { AdminHomePage } from './admin/AdminHomePage';
import { ClientHomePage } from './client/ClientHomePage';

const roleLabels = {
  admin: 'Administrador',
  professional: 'Profesional',
  client: 'Cliente',
} as const;

export function HomePage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'admin') {
    return <AdminHomePage />;
  }

  if (user?.role === 'client') {
    return <ClientHomePage />;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Hola, {user?.name} 👋</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Ingresaste como <strong>{user ? roleLabels[user.role] : ''}</strong>. Usá el menú de la izquierda para
        moverte por el sistema.
      </p>
    </div>
  );
}
