import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { registerSchema, type RegisterFormValues } from '../validation/authSchemas';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      const { token, user } = await authApi.register(values);
      setSession(token, user);
      navigate('/');
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Crear cuenta</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">Reservá turnos en un par de clics.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
          <input type="text" className={inputClass} {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input type="email" className={inputClass} {...register('email')} />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Teléfono (opcional)
          </label>
          <input type="tel" className={inputClass} {...register('phone')} />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
          <input type="password" className={inputClass} {...register('password')} />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
