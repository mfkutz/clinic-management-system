import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Download,
  Ticket,
  TrendingUp,
  UserPlus,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import * as appointmentsApi from '../../api/appointments';
import { getErrorMessage } from '../../api/client';
import { STATUS_META } from '../../lib/appointmentStatusMeta';
import { addDaysKey, dateKeyOf, toDateKey } from '../../lib/dates';
import { formatMoney, getInitials } from '../../lib/format';
import { CATEGORY_META } from '../../lib/serviceCategory';
import type { Appointment, AppointmentStatus } from '../../types';

type RangeKey = '7d' | '30d' | 'todo';
const RANGE_LABELS: Record<RangeKey, string> = { '7d': '7 días', '30d': '30 días', todo: 'Todo' };
const RANGE_DAYS: Record<'7d' | '30d', number> = { '7d': 7, '30d': 30 };
const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function inWindow(list: Appointment[], startKey: string, endKey: string, dateOf: (a: Appointment) => string | null) {
  return list.filter((a) => {
    const raw = dateOf(a);
    if (!raw) return false;
    const k = dateKeyOf(raw);
    return k >= startKey && k <= endKey;
  });
}

function pctDelta(curr: number, prev: number): number {
  if (prev > 0) return Math.round(((curr - prev) / prev) * 100);
  return curr > 0 ? 100 : 0;
}

function daysBetweenKeys(startKey: string, endKey: string): number {
  const ms = new Date(`${endKey}T00:00:00Z`).getTime() - new Date(`${startKey}T00:00:00Z`).getTime();
  return Math.round(ms / 86400000);
}

export function ReportsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>('30d');

  useEffect(() => {
    appointmentsApi
      .listMine()
      .then(setAppointments)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="p-7 text-sm text-red-600">{error}</p>;

  const now = new Date();
  const todayKey = toDateKey(now);
  // Solo turnos que ya pasaron cuentan para métricas históricas (confirmados a futuro no son "actividad" todavía).
  const reportable = appointments.filter((a) => dateKeyOf(a.startDatetime) <= todayKey);
  const earliestKey = reportable.reduce((min, a) => {
    const k = dateKeyOf(a.startDatetime);
    return k < min ? k : min;
  }, todayKey);

  const startKey = range === 'todo' ? earliestKey : addDaysKey(now, -(RANGE_DAYS[range] - 1));
  const periodAppts = inWindow(reportable, startKey, todayKey, (a) => a.startDatetime);
  const nonCancelled = periodAppts.filter((a) => a.status !== 'cancelled');
  const completedAppts = periodAppts.filter((a) => a.status === 'completed');
  const noShowAppts = periodAppts.filter((a) => a.status === 'no_show');
  const revenueAppts = inWindow(appointments, startKey, todayKey, (a) => (a.paymentStatus === 'paid' ? a.paidAt : null));
  const ingresos = revenueAppts.reduce((sum, a) => sum + Number(a.amount ?? 0), 0);
  const ticketPromedio = revenueAppts.length > 0 ? ingresos / revenueAppts.length : 0;
  const ausentismo = nonCancelled.length > 0 ? (noShowAppts.length / nonCancelled.length) * 100 : 0;

  const firstApptKeyByClient = new Map<string, string>();
  appointments.forEach((a) => {
    if (!a.client) return;
    const k = dateKeyOf(a.startDatetime);
    const prev = firstApptKeyByClient.get(a.client.id);
    if (!prev || k < prev) firstApptKeyByClient.set(a.client.id, k);
  });
  const newPatients = [...firstApptKeyByClient.values()].filter((k) => k >= startKey && k <= todayKey).length;

  let deltas: { ingresos: number; completados: number; ausentismoPts: number; nuevos: number } | null = null;
  if (range !== 'todo') {
    const days = RANGE_DAYS[range];
    const prevStartKey = addDaysKey(now, -(2 * days - 1));
    const prevEndKey = addDaysKey(now, -days);
    const prevPeriodAppts = inWindow(reportable, prevStartKey, prevEndKey, (a) => a.startDatetime);
    const prevNonCancelled = prevPeriodAppts.filter((a) => a.status !== 'cancelled');
    const prevCompleted = prevPeriodAppts.filter((a) => a.status === 'completed').length;
    const prevNoShow = prevPeriodAppts.filter((a) => a.status === 'no_show').length;
    const prevAusentismo = prevNonCancelled.length > 0 ? (prevNoShow / prevNonCancelled.length) * 100 : 0;
    const prevRevenue = inWindow(appointments, prevStartKey, prevEndKey, (a) => (a.paymentStatus === 'paid' ? a.paidAt : null)).reduce(
      (sum, a) => sum + Number(a.amount ?? 0),
      0
    );
    const prevNewPatients = [...firstApptKeyByClient.values()].filter((k) => k >= prevStartKey && k <= prevEndKey).length;
    deltas = {
      ingresos: pctDelta(ingresos, prevRevenue),
      completados: pctDelta(completedAppts.length, prevCompleted),
      ausentismoPts: Math.round(ausentismo - prevAusentismo),
      nuevos: pctDelta(newPatients, prevNewPatients),
    };
  }

  // TREND: ingresos diarios cobrados, en la ventana del rango seleccionado (tope de 60 barras para 'todo').
  const bucketCount = range === '7d' ? 7 : range === '30d' ? 30 : Math.min(60, daysBetweenKeys(earliestKey, todayKey) + 1);
  const trendBuckets = Array.from({ length: bucketCount }, (_, i) => {
    const offset = bucketCount - 1 - i;
    const key = addDaysKey(now, -offset);
    const revenue = appointments
      .filter((a) => a.paymentStatus === 'paid' && a.paidAt && dateKeyOf(a.paidAt) === key)
      .reduce((sum, a) => sum + Number(a.amount ?? 0), 0);
    return { key, revenue };
  });
  const trendMax = Math.max(1, ...trendBuckets.map((b) => b.revenue));
  const labelEvery = trendBuckets.length > 10 ? Math.ceil(trendBuckets.length / 8) : 1;

  const statusBreakdown = (['confirmed', 'completed', 'cancelled', 'no_show'] as AppointmentStatus[]).map((status) => {
    const count = periodAppts.filter((a) => a.status === status).length;
    return { status, count, pct: periodAppts.length > 0 ? Math.round((count / periodAppts.length) * 100) : 0 };
  });

  const serviceMap = new Map<string, { name: string; category: keyof typeof CATEGORY_META; count: number; revenue: number }>();
  periodAppts.forEach((a) => {
    if (!a.service) return;
    const entry = serviceMap.get(a.service.id) ?? { name: a.service.name, category: a.service.category, count: 0, revenue: 0 };
    entry.count += 1;
    if (a.paymentStatus === 'paid') entry.revenue += Number(a.amount ?? 0);
    serviceMap.set(a.service.id, entry);
  });
  const topServices = [...serviceMap.values()].sort((a, b) => b.count - a.count || b.revenue - a.revenue).slice(0, 5);
  const topServicesMaxCount = Math.max(1, ...topServices.map((s) => s.count));

  const professionalMap = new Map<
    string,
    { name: string; specialty: string | null; color: string; completed: number; revenue: number }
  >();
  nonCancelled.forEach((a) => {
    if (!a.professional) return;
    const entry =
      professionalMap.get(a.professional.id) ??
      { name: a.professional.user.name, specialty: a.professional.specialty, color: a.professional.color, completed: 0, revenue: 0 };
    if (a.status === 'completed') entry.completed += 1;
    if (a.paymentStatus === 'paid') entry.revenue += Number(a.amount ?? 0);
    professionalMap.set(a.professional.id, entry);
  });
  const professionalPerformance = [...professionalMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  const professionalMaxRevenue = Math.max(1, ...professionalPerformance.map((p) => p.revenue));

  return (
    <div className="px-4 pt-5 pb-8 lg:px-[28px] lg:pt-[26px] lg:pb-[40px]">
      {/* HEADER */}
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
            <TrendingUp className="h-[17px] w-[17px]" />
            Panel financiero y operativo
          </div>
          <h2 className="mt-[7px] mb-[5px] text-[26px] font-extrabold tracking-[-.6px] text-[#171a1f]">Reportes</h2>
          <p className="m-0 text-[14px] text-[#6b7480]">Ingresos, turnos y desempeño del equipo.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1 rounded-[10px] bg-[#f4f5f7] p-[3px]">
            {(['7d', '30d', 'todo'] as RangeKey[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-lg px-[13px] py-1.5 text-[12.5px] font-bold ${
                  range === r ? 'bg-[#5847eb] text-white' : 'text-[#6b7480] hover:bg-white'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
          <Link
            to="/proximamente"
            className="flex items-center gap-[7px] rounded-[11px] border border-[#eaecef] bg-white px-[15px] py-2.5 text-[13.5px] font-semibold text-[#4b535e] hover:bg-[#f4f5f7]"
          >
            <Download className="h-[19px] w-[19px]" />
            Exportar
          </Link>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        <KpiCard
          icon={STATUS_META.completed.icon}
          iconBg="#eef7f2"
          iconColor="#0f9d63"
          value={formatMoney(ingresos)}
          label="Ingresos cobrados"
          delta={deltas ? `${deltas.ingresos >= 0 ? '+' : ''}${deltas.ingresos}%` : undefined}
          deltaIcon={deltas && deltas.ingresos >= 0 ? ArrowUp : ArrowDown}
          deltaColor={deltas && deltas.ingresos >= 0 ? '#16a34a' : '#dc2626'}
        />
        <KpiCard
          icon={STATUS_META.completed.icon}
          iconBg={STATUS_META.completed.tint}
          iconColor={STATUS_META.completed.color}
          value={String(completedAppts.length)}
          label="Turnos completados"
          delta={deltas ? `${deltas.completados >= 0 ? '+' : ''}${deltas.completados}%` : undefined}
          deltaIcon={deltas && deltas.completados >= 0 ? ArrowUp : ArrowDown}
          deltaColor={deltas && deltas.completados >= 0 ? '#16a34a' : '#dc2626'}
        />
        <KpiCard
          icon={Ticket}
          iconBg="#eef0fe"
          iconColor="#5847eb"
          value={formatMoney(ticketPromedio)}
          label="Ticket promedio"
        />
        <KpiCard
          icon={STATUS_META.no_show.icon}
          iconBg={STATUS_META.no_show.tint}
          iconColor={STATUS_META.no_show.color}
          value={`${Math.round(ausentismo)}%`}
          label="Ausentismo"
          delta={deltas ? `${deltas.ausentismoPts >= 0 ? '+' : ''}${deltas.ausentismoPts}pt` : undefined}
          deltaIcon={deltas && deltas.ausentismoPts > 0 ? ArrowUp : ArrowDown}
          deltaColor={deltas && deltas.ausentismoPts > 0 ? '#dc2626' : '#16a34a'}
        />
        <KpiCard
          icon={UserPlus}
          iconBg="#fce8f3"
          iconColor="#c2418a"
          value={String(newPatients)}
          label="Pacientes nuevos"
          delta={deltas ? `${deltas.nuevos >= 0 ? '+' : ''}${deltas.nuevos}%` : undefined}
          deltaIcon={deltas && deltas.nuevos >= 0 ? ArrowUp : ArrowDown}
          deltaColor={deltas && deltas.nuevos >= 0 ? '#16a34a' : '#dc2626'}
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* INGRESOS */}
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-4 pt-[18px] pb-5 sm:px-[22px]">
            <div className="mb-1.5">
              <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Ingresos por día</h3>
              <p className="mt-1 mb-0 text-[12.5px] text-[#8a919c]">Cobrado por día · {RANGE_LABELS[range].toLowerCase()}</p>
            </div>
            <div className="flex h-[150px] items-end gap-[3px] pt-4">
              {trendBuckets.map((b, i) => {
                const dow = new Date(`${b.key}T00:00:00Z`).getUTCDay();
                const showLabel = i % labelEvery === 0;
                const label = bucketCount <= 7 ? WEEKDAY_LABELS[dow] : String(new Date(`${b.key}T00:00:00Z`).getUTCDate());
                return (
                  <div key={b.key} className="flex h-full flex-1 flex-col items-center justify-end gap-[9px]" title={`${b.key}: ${formatMoney(b.revenue)}`}>
                    <div className="relative flex h-full w-full max-w-[26px] items-end">
                      <div
                        className="absolute bottom-0 w-full rounded-[5px] bg-gradient-to-b from-[#6a58f2] to-[#5847eb]"
                        style={{ height: `${Math.round((b.revenue / trendMax) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10.5px] font-bold" style={{ color: b.key === todayKey ? '#5847eb' : '#a3a9b2' }}>
                      {showLabel ? label : ' '}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SERVICIOS MÁS SOLICITADOS */}
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 py-[18px]">
            <h3 className="mt-0 mb-3.5 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Servicios más solicitados</h3>
            {topServices.length === 0 ? (
              <p className="text-[13px] text-[#8a919c]">Sin turnos registrados en este período.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topServices.map((s) => {
                  const meta = CATEGORY_META[s.category];
                  const pct = Math.round((s.count / topServicesMaxCount) * 100);
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        <meta.icon className="h-[19px] w-[19px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13.5px] font-bold text-[#171a1f]">{s.name}</span>
                          <span className="shrink-0 text-[12px] font-bold text-[#6b7480]">
                            {s.count} turno{s.count === 1 ? '' : 's'} · {formatMoney(s.revenue)}
                          </span>
                        </div>
                        <div className="mt-[6px] h-[6px] overflow-hidden rounded-[20px] bg-[#f0f1f3]">
                          <div className="h-full rounded-[20px]" style={{ width: `${pct}%`, background: meta.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* TURNOS POR ESTADO */}
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 py-[18px]">
            <h3 className="mt-0 mb-3.5 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Turnos por estado</h3>
            <div className="flex flex-col gap-3">
              {statusBreakdown.map(({ status, count, pct }) => {
                const meta = STATUS_META[status];
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                      style={{ background: meta.tint, color: meta.color }}
                    >
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#171a1f]">{meta.label}</span>
                        <span className="text-[12px] font-bold text-[#6b7480]">
                          {count} · {pct}%
                        </span>
                      </div>
                      <div className="mt-[6px] h-[6px] overflow-hidden rounded-[20px] bg-[#f0f1f3]">
                        <div className="h-full rounded-[20px]" style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RENDIMIENTO POR PROFESIONAL */}
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 py-[18px]">
            <h3 className="mt-0 mb-3.5 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Rendimiento por profesional</h3>
            {professionalPerformance.length === 0 ? (
              <p className="text-[13px] text-[#8a919c]">Sin turnos registrados en este período.</p>
            ) : (
              <div className="flex flex-col gap-[15px]">
                {professionalPerformance.map((p) => {
                  const pct = Math.round((p.revenue / professionalMaxRevenue) * 100);
                  return (
                    <div key={p.name} className="flex items-center gap-3">
                      <div
                        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] text-[13px] font-bold"
                        style={{ background: p.color, color: '#fff' }}
                      >
                        {getInitials(p.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13.5px] font-bold text-[#171a1f]">{p.name}</span>
                          <span className="shrink-0 text-[12px] font-bold text-[#171a1f]">{formatMoney(p.revenue)}</span>
                        </div>
                        <div className="my-[3px] flex items-center gap-1.5 text-[11.5px] text-[#8a919c]">
                          <UserRound className="h-3 w-3" />
                          {p.specialty ?? 'Sin especialidad'} · {p.completed} atendido{p.completed === 1 ? '' : 's'}
                        </div>
                        <div className="h-[7px] overflow-hidden rounded-[20px] bg-[#f0f1f3]">
                          <div className="h-full rounded-[20px]" style={{ width: `${pct}%`, background: p.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

interface KpiCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  delta?: string;
  deltaIcon?: LucideIcon;
  deltaColor?: string;
}

function KpiCard({ icon: Icon, iconBg, iconColor, value, label, delta, deltaIcon: DeltaIcon, deltaColor }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-[#eaecef] bg-white px-3.5 py-3.5 sm:gap-[13px] sm:px-[18px] sm:py-[17px]">
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-[11px] sm:h-[38px] sm:w-[38px]" style={{ background: iconBg, color: iconColor }}>
          <Icon className="h-[18px] w-[18px] sm:h-[21px] sm:w-[21px]" />
        </span>
        {delta && DeltaIcon && (
          <span className="flex items-center gap-[3px] text-[11.5px] font-bold sm:text-[12px]" style={{ color: deltaColor }}>
            <DeltaIcon className="h-[15px] w-[15px]" />
            {delta}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[18px] font-extrabold tracking-[-.6px] text-[#171a1f] sm:text-[22px]">{value}</div>
        <div className="mt-1.5 text-[11.5px] font-semibold text-[#8a919c] sm:text-[12.5px]">{label}</div>
      </div>
    </div>
  );
}
