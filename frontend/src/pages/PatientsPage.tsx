import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as patientsApi from '../api/patients';
import { getErrorMessage } from '../api/client';
import type { PatientSummary } from '../types';

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    patientsApi
      .list()
      .then(setPatients)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (patients.length === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay pacientes con turnos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-[11px] font-semibold tracking-wide text-gray-400 uppercase dark:border-gray-800">
            <th className="py-2.5 pr-4 font-semibold">Paciente</th>
            <th className="px-4 py-2.5 font-semibold">Teléfono</th>
            <th className="px-4 py-2.5 font-semibold">Turnos</th>
            <th className="px-4 py-2.5 font-semibold">Última visita</th>
            <th className="py-2.5 pl-4 font-semibold">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {patients.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {initialsOf(p.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{p.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.phone || '—'}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.appointmentsCount}</td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {p.lastVisit
                  ? new Date(p.lastVisit).toLocaleDateString('es-AR', { timeZone: 'UTC' })
                  : '—'}
              </td>
              <td className="py-3 pl-4 text-right">
                <Link to={`/pacientes/${p.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
