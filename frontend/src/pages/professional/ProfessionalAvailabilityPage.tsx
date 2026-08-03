import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as availabilityApi from '../../api/availability';
import { getErrorMessage } from '../../api/client';
import * as professionalsApi from '../../api/professionals';
import type { Availability, AvailabilityException } from '../../types';
import {
  createAvailabilitySchema,
  createExceptionSchema,
  type CreateAvailabilityFormValues,
  type CreateExceptionFormValues,
} from '../../validation/availabilitySchemas';

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function AvailabilityForm({ onSubmit }: { onSubmit: (values: CreateAvailabilityFormValues) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAvailabilityFormValues>({
    resolver: zodResolver(createAvailabilitySchema),
    defaultValues: { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Agregar franja horaria</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Día</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('dayOfWeek', { valueAsNumber: true })}
          >
            {dayNames.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Desde</label>
          <input
            type="time"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('startTime')}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Hasta</label>
          <input
            type="time"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('endTime')}
          />
        </div>
      </div>
      {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        Agregar
      </button>
    </form>
  );
}

function ExceptionForm({ onSubmit }: { onSubmit: (values: CreateExceptionFormValues) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateExceptionFormValues>({
    resolver: zodResolver(createExceptionSchema),
    defaultValues: { date: '', isBlocked: true, startTime: '', endTime: '' },
  });
  const isBlocked = watch('isBlocked');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Agregar excepción</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Fecha</label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('date')}
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" {...register('isBlocked')} />
            Bloquear el día completo
          </label>
        </div>
      </div>

      {!isBlocked && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Desde</label>
            <input
              type="time"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              {...register('startTime')}
            />
            {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Hasta</label>
            <input
              type="time"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              {...register('endTime')}
            />
            {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        Agregar excepción
      </button>
    </form>
  );
}

export function ProfessionalAvailabilityPage() {
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [availabilityFormKey, setAvailabilityFormKey] = useState(0);
  const [exceptionFormKey, setExceptionFormKey] = useState(0);

  useEffect(() => {
    professionalsApi
      .getMe()
      .then(async (professional) => {
        setProfessionalId(professional.id);
        const [avail, exc] = await Promise.all([
          availabilityApi.listAvailability(professional.id),
          availabilityApi.listExceptions(professional.id),
        ]);
        setAvailabilities(avail);
        setExceptions(exc);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddAvailability(values: CreateAvailabilityFormValues) {
    if (!professionalId) return;
    setError(null);
    try {
      const created = await availabilityApi.createAvailability(professionalId, values);
      setAvailabilities((prev) =>
        [...prev, created].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
      );
      setAvailabilityFormKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleRemoveAvailability(id: string) {
    if (!professionalId) return;
    setBusyId(id);
    setError(null);
    try {
      await availabilityApi.removeAvailability(professionalId, id);
      setAvailabilities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddException(values: CreateExceptionFormValues) {
    if (!professionalId) return;
    setError(null);
    try {
      const created = await availabilityApi.createException(professionalId, {
        date: values.date,
        isBlocked: values.isBlocked,
        startTime: values.isBlocked ? undefined : values.startTime,
        endTime: values.isBlocked ? undefined : values.endTime,
      });
      setExceptions((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      setExceptionFormKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleRemoveException(id: string) {
    if (!professionalId) return;
    setBusyId(id);
    setError(null);
    try {
      await availabilityApi.removeException(professionalId, id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      {loading && <p className="text-sm text-gray-500">Cargando…</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!loading && professionalId && (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-lg font-medium text-gray-900 dark:text-gray-100">Disponibilidad semanal</h2>
            <AvailabilityForm key={availabilityFormKey} onSubmit={handleAddAvailability} />
            <ul className="mt-4 flex flex-col gap-2">
              {availabilities.length === 0 && <p className="text-sm text-gray-500">Todavía no cargaste horarios.</p>}
              {availabilities.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-800"
                >
                  <span className="text-gray-800 dark:text-gray-200">
                    {dayNames[a.dayOfWeek]}: {a.startTime.slice(0, 5)} – {a.endTime.slice(0, 5)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAvailability(a.id)}
                    disabled={busyId === a.id}
                    className="text-red-600 hover:underline disabled:opacity-60"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium text-gray-900 dark:text-gray-100">Excepciones</h2>
            <ExceptionForm key={exceptionFormKey} onSubmit={handleAddException} />
            <ul className="mt-4 flex flex-col gap-2">
              {exceptions.length === 0 && <p className="text-sm text-gray-500">Sin excepciones cargadas.</p>}
              {exceptions.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-800"
                >
                  <span className="text-gray-800 dark:text-gray-200">
                    {e.date} —{' '}
                    {e.isBlocked
                      ? e.startTime && e.endTime
                        ? `Bloqueado ${e.startTime.slice(0, 5)}–${e.endTime.slice(0, 5)}`
                        : 'Día completo bloqueado'
                      : `Horario extra ${e.startTime?.slice(0, 5)}–${e.endTime?.slice(0, 5)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveException(e.id)}
                    disabled={busyId === e.id}
                    className="text-red-600 hover:underline disabled:opacity-60"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
