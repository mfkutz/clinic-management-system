import { useAuthStore } from '../stores/authStore';
import { AdminHomePage } from './admin/AdminHomePage';
import { ClientHomePage } from './client/ClientHomePage';
import { ProfessionalHomePage } from './professional/ProfessionalHomePage';

export function HomePage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'admin') {
    return <AdminHomePage />;
  }

  if (user?.role === 'client') {
    return <ClientHomePage />;
  }

  return <ProfessionalHomePage />;
}
