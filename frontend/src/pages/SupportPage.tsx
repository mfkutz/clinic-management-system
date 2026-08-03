import { useEffect, useState, type FormEvent } from 'react';
import { getErrorMessage } from '../api/client';
import * as supportApi from '../api/supportRequests';
import { useAuthStore } from '../stores/authStore';
import type { SupportRequest } from '../types';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

export function SupportPage() {
  const role = useAuthStore((s) => s.user?.role);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    supportApi
      .list()
      .then(setRequests)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const created = await supportApi.create({ subject, message });
      setRequests((prev) => [created, ...prev]);
      setSubject('');
      setMessage('');
      setSuccess(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(id: string) {
    setResolvingId(id);
    try {
      const updated = await supportApi.resolve(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">¿Necesitás ayuda?</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Contanos qué pasó y te respondemos a la brevedad.
      </p>

      <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Asunto</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
            required
            minLength={3}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Mensaje</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className={inputClass}
            required
            minLength={10}
          />
        </div>

        {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}
        {success && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
            Recibimos tu mensaje, ¡gracias!
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? 'Enviando…' : 'Enviar consulta'}
        </button>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {role === 'admin' ? 'Todas las solicitudes' : 'Mis solicitudes'}
      </h2>

      {loading && <p className="text-sm text-gray-500">Cargando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && requests.length === 0 && <p className="text-sm text-gray-500">Todavía no hay solicitudes.</p>}

      <ul className="flex flex-col gap-2">
        {requests.map((r) => (
          <li key={r.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.subject}</p>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{r.message}</p>
                {role === 'admin' && r.user && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    {r.user.name} · {r.user.email}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  r.status === 'open'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {r.status === 'open' ? 'Abierta' : 'Resuelta'}
              </span>
            </div>
            {role === 'admin' && r.status === 'open' && (
              <button
                type="button"
                onClick={() => handleResolve(r.id)}
                disabled={resolvingId === r.id}
                className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                {resolvingId === r.id ? 'Guardando…' : 'Marcar resuelta'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
