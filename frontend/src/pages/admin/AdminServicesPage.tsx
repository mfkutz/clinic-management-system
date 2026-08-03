import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as servicesApi from '../../api/services';
import { getErrorMessage } from '../../api/client';
import type { Service } from '../../types';
import { createServiceSchema, type CreateServiceFormValues } from '../../validation/adminSchemas';

interface ServiceFormProps {
  service: Service | null;
  onSubmit: (values: CreateServiceFormValues) => Promise<void>;
  onCancel: () => void;
}

function ServiceForm({ service, onSubmit, onCancel }: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceFormValues>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description ?? undefined,
          durationMinutes: service.durationMinutes,
          price: Number(service.price),
        }
      : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mb-8 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {service ? `Editar "${service.name}"` : 'Nuevo servicio'}
      </h2>

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
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Descripción (opcional)</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('description')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Duración (min)</label>
          <input
            type="number"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('durationMinutes', { valueAsNumber: true })}
          />
          {errors.durationMinutes && <p className="mt-1 text-sm text-red-600">{errors.durationMinutes.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Precio</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {service ? 'Guardar cambios' : 'Crear servicio'}
        </button>
        {service && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [createFormKey, setCreateFormKey] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    servicesApi
      .listAll()
      .then(setServices)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleFormSubmit(values: CreateServiceFormValues) {
    setError(null);
    try {
      if (editingService) {
        const updated = await servicesApi.update(editingService.id, values);
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        setEditingService(null);
      } else {
        const created = await servicesApi.create(values);
        setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setCreateFormKey((k) => k + 1);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function toggleActive(service: Service) {
    setTogglingId(service.id);
    setError(null);
    try {
      const updated = await servicesApi.update(service.id, { active: !service.active });
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <ServiceForm
        key={editingService?.id ?? `create-${createFormKey}`}
        service={editingService}
        onSubmit={handleFormSubmit}
        onCancel={() => setEditingService(null)}
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Cargando…</p>}

      <ul className="flex flex-col gap-2">
        {services.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {s.name}{' '}
                {!s.active && (
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                    Inactivo
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {s.durationMinutes} min · ${s.price}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditingService(s)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => toggleActive(s)}
                disabled={togglingId === s.id}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                {s.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
