import { useEffect, useState } from 'react';
import * as appointmentsApi from '../api/appointments';
import { getErrorMessage } from '../api/client';
import { statusClasses, statusLabels } from '../lib/appointmentStatus';
import type { Appointment } from '../types';

export function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    appointmentsApi
      .listMine()
      .then(setAppointments)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCancel(id: string) {
    setCancellingId(id);
    setCancelError(null);
    try {
      const updated = await appointmentsApi.cancel(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setCancelError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {loading && <p className="text-sm text-gray-500">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {cancelError && <p className="mb-4 text-sm text-red-600">{cancelError}</p>}

      {!loading && appointments.length === 0 && (
        <p className="text-sm text-gray-500">Todavía no tenés turnos reservados.</p>
      )}

      <ul className="flex flex-col gap-3">
        {appointments.map((a) => (
          <li key={a.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {a.service?.name ?? 'Servicio'} con {a.professional?.user.name ?? 'Profesional'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(a.startDatetime).toLocaleString('es-AR', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                    timeZone: 'UTC',
                  })}
                </p>
                {a.status === 'cancelled' && a.cancellationReason && (
                  <p className="mt-1 text-sm text-gray-500 italic">Motivo: {a.cancellationReason}</p>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[a.status]}`}>
                {statusLabels[a.status]}
              </span>
            </div>

            {a.status === 'confirmed' && (
              <button
                type="button"
                onClick={() => handleCancel(a.id)}
                disabled={cancellingId === a.id}
                className="mt-3 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                {cancellingId === a.id ? 'Cancelando…' : 'Cancelar turno'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
