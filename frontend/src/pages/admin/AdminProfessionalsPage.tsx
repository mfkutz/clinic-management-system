import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '../../api/client';
import * as professionalsApi from '../../api/professionals';
import * as servicesApi from '../../api/services';
import type { Professional, Service } from '../../types';
import { createProfessionalSchema, type CreateProfessionalFormValues } from '../../validation/adminSchemas';

interface ProfessionalFormProps {
  onSubmit: (values: CreateProfessionalFormValues) => Promise<void>;
}

function ProfessionalForm({ onSubmit }: ProfessionalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProfessionalFormValues>({ resolver: zodResolver(createProfessionalSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-8 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Nuevo profesional</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Nombre</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Contraseña</label>
          <input
            type="password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('password')}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Teléfono (opcional)</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('phone')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Especialidad (opcional)</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('specialty')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Bio (opcional)</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('bio')}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        Crear profesional
      </button>
    </form>
  );
}

export function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [serviceToAdd, setServiceToAdd] = useState<Record<string, string>>({});
  const [createFormKey, setCreateFormKey] = useState(0);

  function load() {
    setLoading(true);
    Promise.all([professionalsApi.listAll(), servicesApi.listAll()])
      .then(([profs, servs]) => {
        setProfessionals(profs);
        setServices(servs);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreateSubmit(values: CreateProfessionalFormValues) {
    setError(null);
    try {
      const created = await professionalsApi.create(values);
      setProfessionals((prev) => [...prev, created]);
      setCreateFormKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function toggleActive(p: Professional) {
    setBusyId(p.id);
    setError(null);
    try {
      const updated = await professionalsApi.update(p.id, { active: !p.active });
      setProfessionals((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: updated.active } : x)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddService(professionalId: string) {
    const serviceId = serviceToAdd[professionalId];
    if (!serviceId) return;
    setBusyId(professionalId);
    setError(null);
    try {
      await professionalsApi.addService(professionalId, { serviceId });
      const addedService = services.find((s) => s.id === serviceId);
      setProfessionals((prev) =>
        prev.map((p) =>
          p.id === professionalId && addedService
            ? {
                ...p,
                services: [
                  ...p.services,
                  { ...addedService, ProfessionalService: { id: '', professionalId, serviceId, priceOverride: null, durationOverride: null } },
                ],
              }
            : p
        )
      );
      setServiceToAdd((prev) => ({ ...prev, [professionalId]: '' }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveService(professionalId: string, serviceId: string) {
    setBusyId(professionalId);
    setError(null);
    try {
      await professionalsApi.removeService(professionalId, serviceId);
      setProfessionals((prev) =>
        prev.map((p) =>
          p.id === professionalId ? { ...p, services: p.services.filter((s) => s.id !== serviceId) } : p
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <ProfessionalForm key={createFormKey} onSubmit={handleCreateSubmit} />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Cargando…</p>}

      <ul className="flex flex-col gap-3">
        {professionals.map((p) => {
          const availableToAdd = services.filter(
            (s) => s.active && !p.services.some((ps) => ps.id === s.id)
          );
          return (
            <li key={p.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {p.user.name}{' '}
                    {!p.active && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                        Inactivo
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {p.user.email}
                    {p.specialty ? ` · ${p.specialty}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleActive(p)}
                  disabled={busyId === p.id}
                  className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  {p.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>

              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Servicios</p>
                <div className="flex flex-wrap gap-2">
                  {p.services.length === 0 && <span className="text-sm text-gray-400">Ninguno todavía</span>}
                  {p.services.map((s) => (
                    <span
                      key={s.id}
                      className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(p.id, s.id)}
                        disabled={busyId === p.id}
                        className="text-gray-400 hover:text-red-600 disabled:opacity-60"
                        aria-label={`Quitar ${s.name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {availableToAdd.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    <select
                      value={serviceToAdd[p.id] ?? ''}
                      onChange={(e) => setServiceToAdd((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    >
                      <option value="">Agregar servicio…</option>
                      {availableToAdd.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAddService(p.id)}
                      disabled={!serviceToAdd[p.id] || busyId === p.id}
                      className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                    >
                      Agregar
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
