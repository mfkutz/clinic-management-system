import { ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BookingGatewayPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reservar turno</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
        Para reservar necesitás una cuenta. ¿Cómo querés continuar?
      </p>

      <div className="flex flex-col gap-3">
        <Link
          to="/register"
          className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <UserPlus className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">Soy nuevo</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">Crear una cuenta y reservar</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
        </Link>

        <Link
          to="/login"
          className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <LogIn className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">Ya tengo cuenta</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">Iniciar sesión y reservar</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
        </Link>
      </div>

      <Link
        to="/"
        className="mt-6 block text-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        ← Volver al inicio
      </Link>
    </div>
  );
}
