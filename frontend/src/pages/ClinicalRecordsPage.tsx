import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as clinicalRecordsApi from '../api/clinicalRecords';
import { getErrorMessage } from '../api/client';
import type { ClinicalRecord } from '../types';

export function ClinicalRecordsPage() {
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clinicalRecordsApi
      .listRecent()
      .then(setRecords)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (records.length === 0) {
    return <p className="text-sm text-gray-500">Todavía no hay notas clínicas cargadas.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {records.map((r) => (
        <li key={r.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                to={`/pacientes/${r.patient?.id}`}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                {r.patient?.name ?? 'Paciente'}
              </Link>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{r.content}</p>
            </div>
            <div className="shrink-0 text-right text-xs text-gray-500 dark:text-gray-400">
              <p>{r.professional?.user.name ?? 'Profesional'}</p>
              <p>{new Date(r.createdAt).toLocaleDateString('es-AR')}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
