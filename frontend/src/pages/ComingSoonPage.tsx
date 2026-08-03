import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
        <Construction className="h-7 w-7" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Esta sección está en desarrollo</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Todavía no está implementada, pero ya está pensada en el diseño del sistema.
      </p>
      <Link to="/" className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
        Volver al inicio
      </Link>
    </div>
  );
}
