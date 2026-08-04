import { useEffect, useMemo, useState } from 'react';
import { Banknote, Calendar, CheckCircle2, Clock, CreditCard, Search, Stethoscope } from 'lucide-react';
import * as appointmentsApi from '../../api/appointments';
import { getErrorMessage } from '../../api/client';
import { avatarStyle } from '../../lib/avatarColor';
import { formatMoney, getInitials } from '../../lib/format';
import type { Appointment } from '../../types';

const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Tarjeta'];
type Tab = 'all' | 'pending' | 'paid';

export function BillingPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [methodByAppointment, setMethodByAppointment] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');

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
      const updated = await appointmentsApi.markAsPaid(id, methodByAppointment[id] ?? PAYMENT_METHODS[0]);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPayingId(null);
    }
  }

  const collected = appointments.filter((a) => a.paymentStatus === 'paid');
  const pending = appointments.filter((a) => a.paymentStatus === 'pending');
  const totalCollected = collected.reduce((sum, a) => sum + Number(a.amount ?? 0), 0);
  const totalPending = pending.reduce((sum, a) => sum + Number(a.amount ?? 0), 0);
  const total = totalCollected + totalPending;
  const collectedPct = total > 0 ? Math.round((totalCollected / total) * 100) : 0;

  const byTab = tab === 'pending' ? pending : tab === 'paid' ? collected : appointments;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byTab;
    return byTab.filter(
      (a) =>
        (a.client?.name ?? '').toLowerCase().includes(q) ||
        (a.service?.name ?? '').toLowerCase().includes(q) ||
        (a.professional?.user.name ?? '').toLowerCase().includes(q)
    );
  }, [byTab, search]);

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;

  return (
    <div className="px-[28px] pt-[26px] pb-[40px]">
      <div className="mb-[22px]">
        <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
          <CreditCard className="h-[17px] w-[17px]" />
          Finanzas
        </div>
        <h2 className="mt-[7px] mb-[5px] text-[26px] font-extrabold tracking-[-.6px] text-[#171a1f]">Cobros</h2>
        <p className="m-0 text-[14px] text-[#6b7480]">Seguimiento de pagos de turnos confirmados y atendidos.</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-5 grid grid-cols-[1fr_1fr_1.4fr] gap-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#eaecef] bg-white px-[18px] py-[17px]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf7ef] text-[#16a34a]">
            <CheckCircle2 className="h-[23px] w-[23px]" />
          </span>
          <div>
            <div className="text-[23px] font-extrabold tracking-[-.6px] text-[#171a1f]">{formatMoney(totalCollected)}</div>
            <div className="mt-[5px] text-[12.5px] font-semibold text-[#8a919c]">Cobrado · {collected.length} turnos</div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#eaecef] bg-white px-[18px] py-[17px]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fef4e8] text-[#d97706]">
            <Clock className="h-[23px] w-[23px]" />
          </span>
          <div>
            <div className="text-[23px] font-extrabold tracking-[-.6px] text-[#171a1f]">{formatMoney(totalPending)}</div>
            <div className="mt-[5px] text-[12.5px] font-semibold text-[#8a919c]">Pendiente · {pending.length} turnos</div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2.5 rounded-2xl border border-[#eaecef] bg-white px-[18px] py-[17px]">
          <div className="flex items-center justify-between text-[12.5px] font-semibold text-[#6b7480]">
            <span>Cobrado sobre el total</span>
            <span className="font-extrabold text-[#171a1f]">{collectedPct}%</span>
          </div>
          <div className="h-[9px] overflow-hidden rounded-[20px] bg-[#fef4e8]">
            <div className="h-full rounded-[20px] bg-[#16a34a]" style={{ width: `${collectedPct}%` }} />
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-[10px] bg-[#f4f5f7] p-[3px]">
          {(
            [
              { id: 'all' as Tab, label: 'Todos', count: appointments.length },
              { id: 'pending' as Tab, label: 'Pendientes', count: pending.length },
              { id: 'paid' as Tab, label: 'Cobrados', count: collected.length },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-[13px] py-1.5 text-[12.5px] font-bold ${
                tab === t.id ? 'bg-[#5847eb] text-white' : 'text-[#6b7480] hover:bg-white'
              }`}
            >
              {t.label} <span className="opacity-70">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="flex min-w-[220px] max-w-[320px] flex-1 items-center gap-2 rounded-[11px] border border-[#eaecef] bg-white px-[13px] py-2.5 text-[#9aa1ac]">
          <Search className="h-[19px] w-[19px] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente, servicio, profesional…"
            className="w-full text-[13.5px] text-[#171a1f] placeholder:text-[#9aa1ac] focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#8a919c]">No hay turnos que coincidan.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((a) => {
            const avatar = avatarStyle(a.client?.id ?? a.id);
            const paid = a.paymentStatus === 'paid';
            return (
              <div key={a.id} className="flex items-center gap-4 rounded-[14px] border border-[#eaecef] bg-white px-4 py-3.5">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-[13px] font-bold"
                  style={{ background: avatar.bg, color: avatar.color }}
                >
                  {getInitials(a.client?.name ?? 'Cliente')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-[#171a1f]">{a.client?.name ?? 'Cliente'}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-[#8a919c]">
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                    {a.service?.name ?? 'Servicio'} · {a.professional?.user.name ?? 'Profesional'}
                  </div>
                </div>
                <div className="flex w-[110px] shrink-0 items-center gap-1.5 text-[12.5px] text-[#6b7480]">
                  <Calendar className="h-3.5 w-3.5 text-[#a3a9b2]" />
                  {new Date(a.startDatetime).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '')}
                </div>
                <div className="w-[100px] shrink-0 text-[14px] font-extrabold text-[#171a1f]">{formatMoney(a.amount)}</div>
                <div className="w-[140px] shrink-0">
                  <span
                    className="flex w-fit items-center gap-1.5 rounded-[20px] px-[10px] py-[4px] text-[11.5px] font-bold whitespace-nowrap"
                    style={paid ? { background: '#eaf7ef', color: '#16a34a' } : { background: '#fef4e8', color: '#d97706' }}
                  >
                    {paid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    {paid ? a.paymentMethod ?? 'Cobrado' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex w-[210px] shrink-0 justify-end gap-2">
                  {!paid && (
                    <>
                      <select
                        value={methodByAppointment[a.id] ?? PAYMENT_METHODS[0]}
                        onChange={(e) => setMethodByAppointment((prev) => ({ ...prev, [a.id]: e.target.value }))}
                        className="rounded-[9px] border border-[#eaecef] bg-white px-2 py-1.5 text-[12px] font-semibold text-[#4b535e] focus:border-[#5847eb] focus:outline-none"
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(a.id)}
                        disabled={payingId === a.id}
                        className="flex items-center gap-1.5 rounded-[9px] bg-[#5847eb] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#4636cf] disabled:opacity-60"
                      >
                        <Banknote className="h-[15px] w-[15px]" />
                        {payingId === a.id ? 'Guardando…' : 'Marcar cobrado'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
