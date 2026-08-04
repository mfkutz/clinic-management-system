import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  Cake,
  Check,
  CalendarPlus,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Download,
  Calendar,
  FilePlus2,
  MessageCircle,
  MoreHorizontal,
  Package,
  PieChart,
  Receipt,
  RotateCcw,
  Send,
  Stethoscope,
  UserPlus,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import * as appointmentsApi from '../../api/appointments';
import * as professionalsApi from '../../api/professionals';
import { getErrorMessage } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { formatLongDateLabel, formatMoney, formatTimeLabel, getInitials } from '../../lib/format';
import { avatarStyle } from '../../lib/avatarColor';
import { addDaysKey, dateKeyOf } from '../../lib/dates';
import type { Appointment, Professional } from '../../types';

type AgendaRange = 'hoy' | 'mañana' | 'semana';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface Alert {
  icon: LucideIcon;
  title: string;
  meta: string;
  bg: string;
  color: string;
  to: string;
}

export function AdminHomePage() {
  const user = useAuthStore((s) => s.user);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<AgendaRange>('hoy');

  useEffect(() => {
    Promise.all([appointmentsApi.listMine(), professionalsApi.list()])
      .then(([appts, pros]) => {
        setAppointments(appts);
        setProfessionals(pros);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const yesterdayKey = addDaysKey(now, -1);
  const tomorrowKey = addDaysKey(now, 1);

  const todayAppts = useMemo(
    () => appointments.filter((a) => dateKeyOf(a.startDatetime) === todayKey && a.status !== 'cancelled'),
    [appointments, todayKey]
  );
  const yesterdayAppts = useMemo(
    () => appointments.filter((a) => dateKeyOf(a.startDatetime) === yesterdayKey && a.status !== 'cancelled'),
    [appointments, yesterdayKey]
  );

  const completedToday = todayAppts.filter((a) => a.status === 'completed');
  const pendingToday = todayAppts.filter((a) => a.status === 'confirmed');
  const attendedPct = todayAppts.length > 0 ? Math.round((completedToday.length / todayAppts.length) * 100) : 0;
  const turnosDelta = todayAppts.length - yesterdayAppts.length;

  const paidToday = todayAppts.filter((a) => a.paymentStatus === 'paid' && a.paidAt && dateKeyOf(a.paidAt) === todayKey);
  const ingresosHoy = paidToday.reduce((sum, a) => sum + Number(a.amount ?? 0), 0);
  const paidYesterday = appointments.filter(
    (a) => a.paymentStatus === 'paid' && a.paidAt && dateKeyOf(a.paidAt) === yesterdayKey
  );
  const ingresosAyer = paidYesterday.reduce((sum, a) => sum + Number(a.amount ?? 0), 0);
  const ingresosDeltaPct =
    ingresosAyer > 0 ? Math.round(((ingresosHoy - ingresosAyer) / ingresosAyer) * 100) : ingresosHoy > 0 ? 100 : 0;

  function windowNoShowRate(startDaysAgo: number, endDaysAgo: number) {
    const startKey = addDaysKey(now, -startDaysAgo);
    const endKey = addDaysKey(now, -endDaysAgo);
    const inWindow = appointments.filter((a) => {
      const k = dateKeyOf(a.startDatetime);
      return k >= startKey && k <= endKey && a.status !== 'cancelled';
    });
    const noShow = inWindow.filter((a) => a.status === 'no_show').length;
    return inWindow.length > 0 ? (noShow / inWindow.length) * 100 : 0;
  }
  const ausentismoRate = Math.round(windowNoShowRate(7, 1));
  const ausentismoDeltaPts = Math.round(windowNoShowRate(7, 1) - windowNoShowRate(14, 8));

  const cobrosPendientes = appointments.filter(
    (a) => (a.status === 'confirmed' || a.status === 'completed') && a.paymentStatus === 'pending'
  );
  const cobrosPendientesTotal = cobrosPendientes.reduce((sum, a) => sum + Number(a.amount ?? 0), 0);

  const recentCancelled = useMemo(
    () =>
      [...appointments]
        .filter((a) => a.status === 'cancelled')
        .sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime())[0],
    [appointments]
  );

  const trend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const offset = 6 - i;
      const key = addDaysKey(now, -offset);
      const dayAppts = appointments.filter((a) => dateKeyOf(a.startDatetime) === key && a.status !== 'cancelled');
      const dow = new Date(`${key}T00:00:00Z`).getUTCDay();
      return {
        key,
        day: WEEKDAY_LABELS[dow],
        attended: dayAppts.filter((a) => a.status === 'completed').length,
        scheduled: dayAppts.length,
        isToday: key === todayKey,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, todayKey]);
  const trendMax = Math.max(1, ...trend.map((t) => t.scheduled));

  const todayCountByProfessional = useMemo(() => {
    const map = new Map<string, number>();
    todayAppts.forEach((a) => map.set(a.professionalId, (map.get(a.professionalId) ?? 0) + 1));
    return map;
  }, [todayAppts]);

  const professionalsToday = useMemo(() => {
    const withCounts = professionals.map((p) => ({ professional: p, count: todayCountByProfessional.get(p.id) ?? 0 }));
    const active = withCounts.filter((p) => p.count > 0).sort((a, b) => b.count - a.count);
    const list = active.length > 0 ? active : withCounts;
    return list.slice(0, 4);
  }, [professionals, todayCountByProfessional]);
  const maxProfessionalCount = Math.max(1, ...professionalsToday.map((p) => p.count));

  const agendaAppts = useMemo(() => {
    let list: Appointment[];
    if (range === 'hoy') {
      list = todayAppts;
    } else if (range === 'mañana') {
      list = appointments.filter((a) => dateKeyOf(a.startDatetime) === tomorrowKey && a.status !== 'cancelled');
    } else {
      const endKey = addDaysKey(now, 6);
      list = appointments.filter((a) => {
        const k = dateKeyOf(a.startDatetime);
        return k >= todayKey && k <= endKey && a.status !== 'cancelled';
      });
    }
    return [...list].sort((a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, appointments, todayAppts, todayKey, tomorrowKey]);

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="p-7 text-sm text-red-600">{error}</p>;

  const alerts: Alert[] = [];
  if (cobrosPendientes.length > 0) {
    alerts.push({
      icon: Receipt,
      title: `${cobrosPendientes.length} cobro${cobrosPendientes.length === 1 ? '' : 's'} pendiente${cobrosPendientes.length === 1 ? '' : 's'} · ${formatMoney(cobrosPendientesTotal)}`,
      meta: 'Ver en Cobros',
      bg: '#fdecec',
      color: '#dc2626',
      to: '/cobros',
    });
  }
  if (recentCancelled) {
    alerts.push({
      icon: RotateCcw,
      title: 'Turno cancelado recientemente',
      meta: `${recentCancelled.professional?.user.name ?? 'Profesional'} · ${formatTimeLabel(new Date(recentCancelled.startDatetime))} canceló`,
      bg: '#eef0fe',
      color: '#5847eb',
      to: '/proximamente',
    });
  }
  // Mock: no existe estado de "pendiente de confirmar" ni gestión de insumos en el sistema todavía.
  alerts.push({
    icon: MessageCircle,
    title: '3 turnos sin confirmar',
    meta: 'Enviar recordatorio por WhatsApp',
    bg: '#fef4e8',
    color: '#d97706',
    to: '/proximamente',
  });
  alerts.push({
    icon: Package,
    title: 'Insumo bajo: anestesia local',
    meta: 'Quedan 4 unidades',
    bg: '#eef1f4',
    color: '#6b7480',
    to: '/proximamente',
  });

  const quickActions = [
    { icon: CalendarPlus, label: 'Agendar turno', bg: '#eef0fe', color: '#5847eb', to: '/proximamente' },
    { icon: UserPlus, label: 'Nuevo paciente', bg: '#eaf7ef', color: '#16a34a', to: '/proximamente' },
    { icon: CircleDollarSign, label: 'Registrar cobro', bg: '#eef7f2', color: '#0f9d63', to: '/cobros' },
    { icon: FilePlus2, label: 'Nueva historia', bg: '#fef4e8', color: '#d97706', to: '/pacientes' },
  ];

  // Mock: no hay campo de fecha de nacimiento en el modelo de usuario, es un widget decorativo.
  const birthdays = [
    { name: 'Carla Giménez', when: 'Hoy', bg: '#eef0fe', color: '#5847eb' },
    { name: 'Martín Ríos', when: 'Miércoles', bg: '#eaf7ef', color: '#16a34a' },
    { name: 'Sofía Aguirre', when: 'Viernes', bg: '#fce8f3', color: '#c2418a' },
  ];

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="px-[28px] pt-[26px] pb-[40px]">
      {/* GREETING */}
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
            <Calendar className="h-[17px] w-[17px]" />
            {formatLongDateLabel(now)}
          </div>
          <h2 className="mt-[7px] mb-[5px] text-[26px] font-extrabold tracking-[-.6px] text-[#171a1f]">
            {greeting}, {user?.name} 👋
          </h2>
          <p className="m-0 text-[14px] text-[#6b7480]">
            Tenés <b className="text-[#171a1f]">{todayAppts.length} turnos</b>
            {pendingToday.length > 0 && (
              <>
                {' '}
                y <b className="text-[#171a1f]">{pendingToday.length} por atender</b>
              </>
            )}{' '}
            hoy. Esto es lo que necesita tu atención.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/proximamente"
            className="flex items-center gap-[7px] rounded-[11px] border border-[#eaecef] bg-white px-[15px] py-2.5 text-[13.5px] font-semibold text-[#4b535e] hover:bg-[#f4f5f7]"
          >
            <Download className="h-[19px] w-[19px]" />
            Exportar
          </Link>
          <Link
            to="/agenda"
            className="flex items-center gap-[7px] rounded-[11px] border border-[#eaecef] bg-white px-[15px] py-2.5 text-[13.5px] font-semibold text-[#4b535e] hover:bg-[#f4f5f7]"
          >
            <CalendarDays className="h-[19px] w-[19px]" />
            Ver agenda completa
          </Link>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="mb-5 grid grid-cols-5 gap-4">
        <KpiCard
          icon={CalendarDays}
          iconBg="#eef0fe"
          iconColor="#5847eb"
          value={String(todayAppts.length)}
          label="Turnos hoy"
          delta={`${turnosDelta >= 0 ? '+' : ''}${turnosDelta}`}
          deltaIcon={turnosDelta >= 0 ? ArrowUp : ArrowDown}
          deltaColor="#16a34a"
        />
        <KpiCard
          icon={PieChart}
          iconBg="#eaf7ef"
          iconColor="#16a34a"
          value={`${pendingToday.length}/${todayAppts.length}`}
          label="Por atender hoy"
          delta={`${attendedPct}%`}
          deltaIcon={Check}
          deltaColor="#16a34a"
        />
        <KpiCard
          icon={CircleDollarSign}
          iconBg="#eef7f2"
          iconColor="#0f9d63"
          value={formatMoney(ingresosHoy)}
          label="Ingresos del día"
          delta={`${ingresosDeltaPct >= 0 ? '+' : ''}${ingresosDeltaPct}%`}
          deltaIcon={ingresosDeltaPct >= 0 ? ArrowUp : ArrowDown}
          deltaColor="#16a34a"
        />
        <KpiCard
          icon={PieChart}
          iconBg="#fef4e8"
          iconColor="#d97706"
          value="78%"
          label="Ocupación agenda"
          delta="+5%"
          deltaIcon={ArrowUp}
          deltaColor="#16a34a"
          mock
        />
        <KpiCard
          icon={UserX}
          iconBg="#fdecec"
          iconColor="#dc2626"
          value={`${ausentismoRate}%`}
          label="Ausentismo (7 días)"
          delta={`${ausentismoDeltaPts >= 0 ? '+' : ''}${ausentismoDeltaPts}pt`}
          deltaIcon={ausentismoDeltaPts > 0 ? ArrowUp : ArrowDown}
          deltaColor={ausentismoDeltaPts > 0 ? '#dc2626' : '#16a34a'}
        />
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-[1.9fr_1fr] items-start gap-5">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* AGENDA DE HOY */}
          <section className="overflow-hidden rounded-[18px] border border-[#eaecef] bg-white">
            <div className="flex items-center justify-between border-b border-[#f0f1f3] px-5 pt-[18px] pb-3.5">
              <div className="flex items-center gap-[11px]">
                <CalendarDays className="h-[22px] w-[22px] text-[#5847eb]" />
                <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Agenda</h3>
                <span className="rounded-[20px] bg-[#eef0fe] px-[9px] py-[3px] text-[12px] font-bold text-[#5847eb]">
                  {agendaAppts.length} turnos
                </span>
              </div>
              <div className="flex gap-1 rounded-[10px] bg-[#f4f5f7] p-[3px]">
                {(['hoy', 'mañana', 'semana'] as AgendaRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`rounded-lg px-[13px] py-1.5 text-[12.5px] font-bold capitalize ${
                      range === r ? 'bg-[#5847eb] text-white' : 'text-[#6b7480] hover:bg-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              {agendaAppts.length === 0 && (
                <p className="px-5 py-6 text-sm text-[#8a919c]">No hay turnos en este rango.</p>
              )}
              {agendaAppts.slice(0, 8).map((a) => {
                const start = new Date(a.startDatetime);
                const end = new Date(a.endDatetime);
                const isNow = range === 'hoy' && a.status === 'confirmed' && start <= now && now <= end;
                const status = isNow
                  ? { label: 'En curso', bg: '#eaf7ef', color: '#16a34a', edge: '#5847eb' }
                  : a.status === 'completed'
                    ? { label: 'Atendido', bg: '#eef1f4', color: '#6b7480', edge: '#dfe2e6' }
                    : a.status === 'no_show'
                      ? { label: 'Ausente', bg: '#fdecec', color: '#dc2626', edge: '#dfe2e6' }
                      : { label: 'Confirmado', bg: '#eef0fe', color: '#5847eb', edge: '#dfe2e6' };
                const clientName = a.client?.name ?? 'Cliente';
                const avatar = avatarStyle(a.client?.id ?? clientName);
                // Duración real del turno agendado, no la default del catálogo — puede diferir por un
                // durationOverride en ProfessionalService que el endpoint no expone en `service`.
                const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-[15px] border-b border-[#f4f5f7] px-5 py-[13px] hover:bg-[#fafbfc]"
                    style={{ borderLeft: `3px solid ${status.edge}` }}
                  >
                    <div className="w-[62px] shrink-0 text-center">
                      <div className="text-[15px] font-extrabold tracking-[-.3px] text-[#171a1f]">
                        {formatTimeLabel(start)}
                      </div>
                      <div className="text-[11px] font-semibold text-[#a3a9b2]">{durationMinutes} min</div>
                    </div>
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13.5px] font-bold"
                      style={{ background: avatar.bg, color: avatar.color }}
                    >
                      {getInitials(clientName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[14px] font-bold text-[#171a1f]">
                        {clientName}
                        {isNow && (
                          <span className="inline-flex items-center gap-1 rounded-[20px] bg-[#eaf7ef] px-[7px] py-[2px] text-[10px] font-extrabold tracking-[.04em] text-[#16a34a]">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                            AHORA
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#8a919c]">
                        <Stethoscope className="h-3.5 w-3.5" />
                        {a.service?.name ?? 'Servicio'} · {a.professional?.user.name ?? 'Profesional'}
                      </div>
                    </div>
                    <span
                      className="rounded-[20px] px-[11px] py-[5px] text-[12px] font-bold whitespace-nowrap"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                    <MoreHorizontal className="h-5 w-5 shrink-0 cursor-pointer rounded-lg p-0.5 text-[#c3c8d0] hover:bg-[#f4f5f7]" />
                  </div>
                );
              })}
            </div>
            {agendaAppts.length > 0 && (
              <div className="p-[13px] text-center">
                <Link to="/agenda" className="text-[13px] font-bold text-[#5847eb] hover:text-[#4636cf]">
                  Ver los {agendaAppts.length} turnos →
                </Link>
              </div>
            )}
          </section>

          {/* TENDENCIA */}
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-[22px] pt-[18px] pb-5">
            <div className="mb-1.5 flex items-center justify-between">
              <div>
                <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Turnos de la semana</h3>
                <p className="mt-1 mb-0 text-[12.5px] text-[#8a919c]">Atendidos vs. programados · últimos 7 días</p>
              </div>
              <div className="flex items-center gap-4 text-[12px] font-semibold text-[#6b7480]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-[#5847eb]" />
                  Atendidos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-[#e6e3fb]" />
                  Programados
                </span>
              </div>
            </div>
            <div className="flex h-[150px] items-end gap-3.5 pt-4">
              {trend.map((t) => (
                <div key={t.key} className="flex h-full flex-1 flex-col items-center justify-end gap-[9px]">
                  <div className="relative flex h-full w-[26px] items-end">
                    <div
                      className="absolute bottom-0 w-full rounded-[7px] bg-[#eeecfb]"
                      style={{ height: `${Math.round((t.scheduled / trendMax) * 100)}%` }}
                    />
                    <div
                      className="absolute bottom-0 w-full rounded-[7px] bg-gradient-to-b from-[#6a58f2] to-[#5847eb]"
                      style={{ height: `${Math.round((t.attended / trendMax) * 100)}%` }}
                    />
                  </div>
                  <span
                    className="text-[11.5px] font-bold"
                    style={{ color: t.isToday ? '#5847eb' : '#a3a9b2' }}
                  >
                    {t.day}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">
          {/* ACCIONES RÁPIDAS */}
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 pt-[18px] pb-5">
            <h3 className="mt-0 mb-3.5 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Acciones rápidas</h3>
            <div className="grid grid-cols-2 gap-[11px]">
              {quickActions.map((qa) => (
                <Link
                  key={qa.label}
                  to={qa.to}
                  className="flex flex-col items-start gap-[11px] rounded-[14px] border border-[#eef0f2] p-3.5 transition hover:-translate-y-px hover:border-[#cdd0f7] hover:bg-[#fbfbff]"
                >
                  <span
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]"
                    style={{ background: qa.bg, color: qa.color }}
                  >
                    <qa.icon className="h-[21px] w-[21px]" />
                  </span>
                  <span className="text-[13.5px] font-bold text-[#2b2f36]">{qa.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* PENDIENTES */}
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 py-[18px]">
            <div className="mb-[13px] flex items-center justify-between">
              <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Pendientes</h3>
              <span className="rounded-[20px] bg-[#fdecec] px-[9px] py-[3px] text-[12px] font-bold text-[#dc2626]">
                {alerts.length} por resolver
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {alerts.map((al, i) => (
                <Link
                  key={i}
                  to={al.to}
                  className="flex items-center gap-3 rounded-[13px] border border-[#f0f1f3] p-3 hover:bg-[#f4f5f7]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ background: al.bg, color: al.color }}
                  >
                    <al.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold text-[#171a1f]">{al.title}</div>
                    <div className="mt-px text-[12px] text-[#8a919c]">{al.meta}</div>
                  </div>
                  <ChevronRight className="h-[19px] w-[19px] shrink-0 text-[#c3c8d0]" />
                </Link>
              ))}
            </div>
          </section>

          {/* CARGA POR PROFESIONAL */}
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 py-[18px]">
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Profesionales hoy</h3>
              <Link to="/admin/profesionales" className="text-[12.5px] font-bold text-[#5847eb] hover:text-[#4636cf]">
                Ver todos
              </Link>
            </div>
            <div className="flex flex-col gap-[15px]">
              {professionalsToday.map(({ professional, count }) => {
                const pct = Math.round((count / maxProfessionalCount) * 100);
                const barColor = pct >= 75 ? '#e05656' : pct >= 50 ? '#e6a13c' : '#33a866';
                return (
                  <div key={professional.id} className="flex items-center gap-3">
                    <div
                      className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] text-[13px] font-bold"
                      style={{ background: professional.color, color: '#fff' }}
                    >
                      {getInitials(professional.user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13.5px] font-bold text-[#171a1f]">{professional.user.name}</span>
                        <span className="text-[12px] font-bold" style={{ color: barColor }}>
                          {count} turno{count === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="my-[3px] text-[11.5px] text-[#8a919c]">{professional.specialty}</div>
                      <div className="h-[7px] overflow-hidden rounded-[20px] bg-[#f0f1f3]">
                        <div className="h-full rounded-[20px]" style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* CUMPLEAÑOS */}
          <section className="rounded-[18px] border border-[#e8e5fb] bg-gradient-to-br from-[#f3f1fe] to-[#fbfbff] px-5 py-[18px]">
            <div className="mb-[13px] flex items-center gap-[9px]">
              <Cake className="h-[21px] w-[21px] text-[#5847eb]" />
              <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Cumpleaños esta semana</h3>
            </div>
            <div className="flex flex-col gap-[11px]">
              {birthdays.map((b) => (
                <div key={b.name} className="flex items-center gap-[11px]">
                  <div
                    className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-[12.5px] font-bold"
                    style={{ background: b.bg, color: b.color }}
                  >
                    {getInitials(b.name)}
                  </div>
                  <span className="flex-1 text-[13.5px] font-semibold text-[#171a1f]">{b.name}</span>
                  <span className="text-[12px] font-bold text-[#8a7ff0]">{b.when}</span>
                  <Send className="h-[18px] w-[18px] cursor-pointer rounded-md p-0.5 text-[#a99ff2] hover:bg-white" />
                </div>
              ))}
            </div>
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
  delta: string;
  deltaIcon: LucideIcon;
  deltaColor: string;
  mock?: boolean;
}

function KpiCard({ icon: Icon, iconBg, iconColor, value, label, delta, deltaIcon: DeltaIcon, deltaColor, mock }: KpiCardProps) {
  return (
    <div className="flex flex-col gap-[13px] rounded-2xl border border-[#eaecef] bg-white px-[18px] py-[17px]">
      <div className="flex items-center justify-between">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]" style={{ background: iconBg, color: iconColor }}>
          <Icon className="h-[21px] w-[21px]" />
        </span>
        <span className="flex items-center gap-[3px] text-[12px] font-bold" style={{ color: deltaColor }}>
          <DeltaIcon className="h-[15px] w-[15px]" />
          {delta}
        </span>
      </div>
      <div>
        <div className="text-[25px] font-extrabold tracking-[-.6px] text-[#171a1f]">{value}</div>
        <div className="mt-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-[#8a919c]">
          {label}
          {mock && <span title="Dato de ejemplo, cálculo real pendiente">*</span>}
        </div>
      </div>
    </div>
  );
}
