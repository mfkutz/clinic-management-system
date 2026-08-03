import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as clinicalRecordsApi from '../api/clinicalRecords';
import { getErrorMessage } from '../api/client';
import * as patientsApi from '../api/patients';
import { statusClasses, statusLabels } from '../lib/appointmentStatus';
import { useAuthStore } from '../stores/authStore';
import type { ClinicalRecord, PatientDetail } from '../types';

function initialsOf(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useAuthStore((s) => s.user?.role);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([patientsApi.getById(id), clinicalRecordsApi.listForPatient(id)])
      .then(([patientData, recordsData]) => {
        setPatient(patientData);
        setRecords(recordsData);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setNoteError(null);
    setSavingNote(true);
    try {
      const created = await clinicalRecordsApi.createForPatient(id, noteContent);
      setRecords((prev) => [created, ...prev]);
      setNoteContent('');
    } catch (err) {
      setNoteError(getErrorMessage(err));
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!patient) return null;

  return (
    <div>
      <Link to="/pacientes" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">
        ← Volver a Pacientes
      </Link>

      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {initialsOf(patient.name)}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{patient.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{patient.email}</p>
          {patient.phone && <p className="text-sm text-gray-500 dark:text-gray-400">Tel: {patient.phone}</p>}
        </div>
      </div>

      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Historial de turnos</h3>

      {patient.appointments.length === 0 ? (
        <p className="text-sm text-gray-500">Sin turnos registrados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {patient.appointments.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {a.service?.name ?? 'Servicio'} — {a.professional?.user.name ?? 'Profesional'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(a.startDatetime).toLocaleString('es-AR', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'UTC',
                  })}
                </p>
                {a.notes && <p className="mt-1 text-sm text-gray-500 italic">Notas: {a.notes}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[a.status]}`}>
                {statusLabels[a.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-8 mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Historia clínica</h3>

      {role === 'professional' && (
        <form
          onSubmit={handleAddNote}
          className="mb-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
        >
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Agregar una nota clínica…"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          {noteError && <p className="mt-2 text-sm text-red-600">{noteError}</p>}
          <button
            type="submit"
            disabled={savingNote || noteContent.trim().length < 3}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {savingNote ? 'Guardando…' : 'Agregar nota'}
          </button>
        </form>
      )}

      {records.length === 0 ? (
        <p className="text-sm text-gray-500">Sin notas clínicas todavía.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {records.map((r) => (
            <li key={r.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <p className="text-sm text-gray-800 dark:text-gray-200">{r.content}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {r.professional?.user.name ?? 'Profesional'} ·{' '}
                {new Date(r.createdAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
