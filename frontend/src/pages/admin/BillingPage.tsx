import { useEffect, useState } from 'react';
import * as appointmentsApi from '../../api/appointments';
import { getErrorMessage } from '../../api/client';
import type { Appointment } from '../../types';

const paymentMethods = ['Efectivo', 'Transferencia', 'Tarjeta'];

function formatMoney(amount: string | null) {
  if (!amount) return '—';
  return `$${Number(amount).toLocaleString('es-AR')}`;
}

export function BillingPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [methodByAppointment, setMethodByAppointment] = useState<Record<string, string>>({});

  useEffect(() => {
    appointmentsApi
      .listMine()
      .then((all) => setAppointments(all.filter((a) => a.status === 'confirmed' || a.status === 'completed')))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleMarkPaid(id: string) {
    setPayingId(id);
    setError(null);
    try {
      const updated = await appointmentsApi.markAsPaid(id, methodByAppointment[id] ?? paymentMethods[0]);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPayingId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const collected = appointments.filter((a) => a.paymentStatus === 'paid');
  const pending = appointments.filter((a) => a.paymentStatus === 'pending');
  const totalCollected = collected.reduce((sum, a) => sum + Number(a.amount ?? 0), 0);
  const totalPending = pending.reduce((sum, a) => sum + Number(a.amount ?? 0), 0);
  const total = totalCollected + totalPending;
  const collectedPct = total > 0 ? (totalCollected / total) * 100 : 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-8 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total cobrado</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            ${totalCollected.toLocaleString('es-AR')}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pendiente de cobro</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            ${totalPending.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="min-w-[180px] flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-green-500" style={{ width: `${collectedPct}%` }} />
          </div>
          <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Cobrado: {collected.length}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Pendiente: {pending.length}
            </span>
          </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <p className="text-sm text-gray-500">No hay turnos confirmados para facturar todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-semibold tracking-wide text-gray-400 uppercase dark:border-gray-800">
                <th className="py-2.5 pr-4 font-semibold">Turno</th>
                <th className="px-4 py-2.5 font-semibold">Fecha</th>
                <th className="px-4 py-2.5 font-semibold">Monto</th>
                <th className="px-4 py-2.5 font-semibold">Estado</th>
                <th className="py-2.5 pl-4 font-semibold">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{a.service?.name ?? 'Servicio'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {a.client?.name ?? 'Cliente'} · {a.professional?.user.name ?? 'Profesional'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(a.startDatetime).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{formatMoney(a.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        a.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {a.paymentStatus === 'paid' ? `Cobrado (${a.paymentMethod})` : 'Pendiente'}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    {a.paymentStatus === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <select
                          value={methodByAppointment[a.id] ?? paymentMethods[0]}
                          onChange={(e) => setMethodByAppointment((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                          {paymentMethods.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(a.id)}
                          disabled={payingId === a.id}
                          className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {payingId === a.id ? 'Guardando…' : 'Marcar cobrado'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
