import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Info,
  Phone,
  Plus,
  RotateCw,
  Stethoscope,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import * as appointmentsApi from '../api/appointments';
import * as professionalsApi from '../api/professionals';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { getInitials } from '../lib/format';
import { addDays, minutesOfDayUTC, toDateKey } from '../lib/dates';
import { STATUS_META } from '../lib/appointmentStatusMeta';
import type { Appointment, AppointmentStatus, Professional } from '../types';

const HOUR_START = 480; // 08:00
const HOUR_END = 1200; // 20:00
const HOUR_PX = 80;
const ROWS = (HOUR_END - HOUR_START) / 60;
const GRID_HEIGHT = ROWS * HOUR_PX;

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const ACTION_VARIANTS = {
  primary: { bg: '#5847eb', color: '#fff', border: '#5847eb', shadow: '0 6px 16px -6px rgba(88,71,235,.6)' },
  success: { bg: '#fff', color: '#0f9d63', border: '#d6ecdf', shadow: 'none' },
  warning: { bg: '#fff', color: '#b46707', border: '#f2e2c8', shadow: 'none' },
  danger: { bg: '#fff', color: '#dc2626', border: '#f4d3d3', shadow: 'none' },
  neutral: { bg: '#fff', color: '#4b535e', border: '#eef0f2', shadow: 'none' },
} as const;

function mondayOf(date: Date): Date {
  const dow = date.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(date, diff);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function hourLabel(minutes: number) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

interface PackedEvent {
  appointment: Appointment;
  start: number;
  end: number;
  col: number;
  cols: number;
}

/** Ordena por inicio, agrupa en clústers de solapamiento y asigna cada turno a la primera
 * columna cuyo último turno ya terminó — así los turnos superpuestos quedan lado a lado. */
function packOverlaps(events: { appointment: Appointment; start: number; end: number }[]): PackedEvent[] {
  const sorted = [...events].sort((a, b) => a.start - b.start || a.end - b.end);
  const result: PackedEvent[] = [];
  let cluster: { appointment: Appointment; start: number; end: number; col: number }[] = [];
  let clusterEnd = -1;

  function flush() {
    const cols: { end: number }[][] = [];
    cluster.forEach((ev) => {
      let placed = false;
      for (let c = 0; c < cols.length; c++) {
        if (cols[c][cols[c].length - 1].end <= ev.start) {
          cols[c].push(ev);
          ev.col = c;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ev.col = cols.length;
        cols.push([ev]);
      }
    });
    cluster.forEach((ev) => result.push({ ...ev, cols: cols.length }));
    cluster = [];
    clusterEnd = -1;
  }

  sorted.forEach((ev) => {
    if (cluster.length && ev.start >= clusterEnd) flush();
    cluster.push({ ...ev, col: 0 });
    clusterEnd = Math.max(clusterEnd, ev.end);
  });
  if (cluster.length) flush();

  return result;
}

export function AgendaPage() {
  const authUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdmin = authUser?.role === 'admin';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<'week' | 'day'>('week');
  const [focusDate, setFocusDate] = useState<Date>(todayUTC);
  // Preseleccionado desde /profesionales ("Agenda" de una tarjeta), vía ?profesional=<id>.
  const [proFilter, setProFilter] = useState<string>(() => searchParams.get('profesional') ?? 'all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    Promise.all([appointmentsApi.listMine(), professionalsApi.list()])
      .then(([appts, pros]) => {
        setAppointments(appts);
        setProfessionals(pros);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }

  const professionalById = useMemo(() => new Map(professionals.map((p) => [p.id, p])), [professionals]);
  const myProfessional = useMemo(
    () => professionals.find((p) => p.user.id === authUser?.id) ?? null,
    [professionals, authUser]
  );

  const colorByProfessional = isAdmin && proFilter === 'all';

  const filteredAppointments = useMemo(() => {
    if (!isAdmin || proFilter === 'all') return appointments;
    return appointments.filter((a) => a.professionalId === proFilter);
  }, [appointments, isAdmin, proFilter]);

  const weekDays = useMemo(() => {
    const monday = mondayOf(focusDate);
    return Array.from({ length: 6 }, (_, i) => addDays(monday, i));
  }, [focusDate]);
  const visibleDays = view === 'week' ? weekDays : [focusDate];

  const today = todayUTC();

  const days = useMemo(() => {
    return visibleDays.map((date) => {
      const key = toDateKey(date);
      const dayAppts = filteredAppointments.filter((a) => a.startDatetime.slice(0, 10) === key);
      const raw = dayAppts.map((a) => ({
        appointment: a,
        start: minutesOfDayUTC(new Date(a.startDatetime)),
        end: minutesOfDayUTC(new Date(a.endDatetime)),
      }));
      const packed = packOverlaps(raw);

      const blocks = packed.map((ev) => {
        const a = ev.appointment;
        const statusMeta = STATUS_META[a.status];
        const dim = a.status === 'cancelled' || a.status === 'no_show';
        const pro = professionalById.get(a.professionalId);
        const edge = colorByProfessional ? (pro?.color ?? '#8a919c') : statusMeta.color;
        const bg = colorByProfessional
          ? `color-mix(in srgb, ${pro?.color ?? '#8a919c'} 12%, white)`
          : statusMeta.tint;
        const height = Math.max(((ev.end - ev.start) / 60) * HOUR_PX, 34);
        return {
          appointment: a,
          top: Math.max(0, ((ev.start - HOUR_START) / 60) * HOUR_PX),
          height,
          left: (ev.col / ev.cols) * 100,
          width: (1 / ev.cols) * 100,
          edge,
          bg,
          dim,
          timeLabel: hourLabel(ev.start),
          sub: colorByProfessional ? (pro?.user.name ?? '') : (a.service?.name ?? ''),
          showSub: height >= 58,
        };
      });

      const isToday = key === toDateKey(today);
      let nowTop: number | null = null;
      if (isToday) {
        const nowMin = minutesOfDayUTC(new Date());
        if (nowMin >= HOUR_START && nowMin <= HOUR_END) {
          nowTop = ((nowMin - HOUR_START) / 60) * HOUR_PX;
        }
      }

      return { date, key, isToday, blocks, nowTop };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleDays, filteredAppointments, professionalById, colorByProfessional]);

  const hourLabels = Array.from({ length: ROWS + 1 }, (_, i) => ({
    label: hourLabel(HOUR_START + i * 60),
    top: i * HOUR_PX,
  }));

  const selected = useMemo(() => appointments.find((a) => a.id === selectedId) ?? null, [appointments, selectedId]);

  function goPrev() {
    setFocusDate((d) => addDays(d, view === 'week' ? -7 : -1));
  }
  function goNext() {
    setFocusDate((d) => addDays(d, view === 'week' ? 7 : 1));
  }
  function goToday() {
    setFocusDate(todayUTC());
  }

  function handleEmptyCellClick(date: Date, minutes: number) {
    showToast(`Nuevo turno · ${DAY_ABBR[date.getUTCDay()]} ${hourLabel(minutes)} — próximamente`);
  }

  async function handleComplete(a: Appointment) {
    setActionLoading(true);
    try {
      const updated = await appointmentsApi.complete(a.id);
      setAppointments((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      showToast('Turno marcado como atendido');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleNoShow(a: Appointment) {
    setActionLoading(true);
    try {
      const updated = await appointmentsApi.markNoShow(a.id);
      setAppointments((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      showToast('Turno marcado como no asistido');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel(a: Appointment) {
    setActionLoading(true);
    try {
      const reason = isAdmin ? 'Cancelado por el administrador' : 'Cancelado por el profesional';
      const updated = await appointmentsApi.cancel(a.id, reason);
      setAppointments((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      showToast('Turno cancelado');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  function actionsFor(a: Appointment) {
    if (a.status === 'confirmed') {
      return [
        { label: 'Marcar como atendido', icon: CheckCircle2, variant: 'primary' as const, onClick: () => handleComplete(a) },
        {
          label: 'Registrar cobro',
          icon: CircleDollarSign,
          variant: 'success' as const,
          onClick: () => {
            setSelectedId(null);
            navigate('/cobros');
          },
        },
        { label: 'Marcar no asistió', icon: CalendarX, variant: 'warning' as const, onClick: () => handleNoShow(a) },
        { label: 'Cancelar turno', icon: XCircle, variant: 'danger' as const, onClick: () => handleCancel(a) },
      ];
    }
    if (a.status === 'completed') {
      return [
        {
          label: 'Registrar cobro',
          icon: CircleDollarSign,
          variant: 'primary' as const,
          onClick: () => {
            setSelectedId(null);
            navigate('/cobros');
          },
        },
        {
          label: 'Ver historia clínica',
          icon: FileText,
          variant: 'neutral' as const,
          onClick: () => {
            setSelectedId(null);
            navigate(`/pacientes/${a.clientId}`);
          },
        },
      ];
    }
    if (a.status === 'no_show') {
      return [
        {
          label: 'Reprogramar turno',
          icon: RotateCw,
          variant: 'neutral' as const,
          onClick: () => showToast('Reprogramación — próximamente'),
        },
      ];
    }
    return [];
  }

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="p-7 text-sm text-red-600">{error}</p>;

  const legendItems = colorByProfessional
    ? professionals.map((p) => ({ label: p.user.name, color: p.color }))
    : (Object.values(STATUS_META) as (typeof STATUS_META)[AppointmentStatus][]).map((m) => ({
        label: m.label,
        color: m.color,
      }));

  const monthLabel = (d: Date) => MONTHS[d.getUTCMonth()];
  const dateLabel =
    view === 'week'
      ? weekDays[0].getUTCMonth() === weekDays[5].getUTCMonth()
        ? `${weekDays[0].getUTCDate()} – ${weekDays[5].getUTCDate()} de ${monthLabel(weekDays[0])} ${weekDays[0].getUTCFullYear()}`
        : `${weekDays[0].getUTCDate()} de ${monthLabel(weekDays[0])} – ${weekDays[5].getUTCDate()} de ${monthLabel(weekDays[5])}`
      : `${DAY_FULL[focusDate.getUTCDay()]} ${focusDate.getUTCDate()} de ${monthLabel(focusDate)} ${focusDate.getUTCFullYear()}`;
  const visibleCount = days.reduce((sum, d) => sum + d.blocks.length, 0);
  const subLabel = view === 'week' ? `Semana · ${visibleCount} turnos` : `${visibleCount} turnos`;
  // En semana, cada día necesita un ancho mínimo legible — en mobile eso se resuelve con scroll
  // horizontal (header + grilla comparten este mismo ancho para desplazarse sincronizados).
  const gridMinWidth = view === 'week' ? 66 + visibleDays.length * 130 : undefined;

  return (
    <div className="px-3 pt-4 pb-6 lg:px-[26px] lg:pt-[22px] lg:pb-[34px]">
      <div className="overflow-hidden rounded-[18px] border border-[#eaecef] bg-white">
        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center gap-4 border-b border-[#f0f1f3] px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#eef0f2] bg-white text-[#6b7480] hover:bg-[#f4f5f7]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#eef0f2] bg-white text-[#6b7480] hover:bg-[#f4f5f7]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="h-9 rounded-[10px] border border-[#eef0f2] bg-white px-3.5 text-[13px] font-bold text-[#4b535e] hover:bg-[#f4f5f7]"
            >
              Hoy
            </button>
          </div>
          <div className="flex flex-col leading-tight">
            <div className="text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">{dateLabel}</div>
            <div className="text-[12px] font-semibold text-[#9aa1ac]">{subLabel}</div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            {isAdmin && (
              <select
                value={proFilter}
                onChange={(e) => setProFilter(e.target.value)}
                className="h-9 rounded-[10px] border border-[#eef0f2] bg-white px-3 text-[13px] font-semibold text-[#4b535e] focus:border-[#5847eb] focus:outline-none"
              >
                <option value="all">Todos los profesionales</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.name}
                  </option>
                ))}
              </select>
            )}
            {!isAdmin && myProfessional && (
              <span className="inline-flex items-center gap-1.5 rounded-[20px] bg-[#eef0fe] px-3 py-1.5 text-[12px] font-bold text-[#5847eb]">
                <UserRound className="h-4 w-4" />
                {myProfessional.user.name} · {myProfessional.specialty}
              </span>
            )}
            <div className="flex items-center gap-0.5 rounded-[10px] bg-[#f4f5f7] p-[3px]">
              <button
                type="button"
                onClick={() => setView('day')}
                className="rounded-lg px-3.5 py-[7px] text-[12.5px] font-bold"
                style={view === 'day' ? { background: '#5847eb', color: '#fff' } : { color: '#6b7480' }}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => setView('week')}
                className="rounded-lg px-3.5 py-[7px] text-[12.5px] font-bold"
                style={view === 'week' ? { background: '#5847eb', color: '#fff' } : { color: '#6b7480' }}
              >
                Semana
              </button>
            </div>
            <button
              type="button"
              onClick={() => showToast('Creación manual de turno — próximamente')}
              className="flex items-center gap-[7px] rounded-[11px] bg-[#5847eb] px-4 py-2 text-[13.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.6)] hover:bg-[#4636cf]"
            >
              <Plus className="h-[19px] w-[19px]" />
              Nuevo turno
            </button>
          </div>
        </div>

        {/* LEGEND */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[#f0f1f3] px-5 py-[11px]">
          <span className="text-[11.5px] font-bold tracking-[.06em] text-[#9aa1ac] uppercase">
            {colorByProfessional ? 'Profesionales' : 'Estados'}
          </span>
          <div className="flex flex-wrap items-center gap-4">
            {legendItems.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4b535e]">
                <span className="inline-block h-[11px] w-[11px] rounded-[4px]" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* En semana, header y grilla comparten un contenedor con scroll horizontal para no
            desincronizarse; en día, ocupan el ancho disponible sin necesidad de scroll. */}
        <div className="overflow-x-auto">
        <div style={{ minWidth: gridMinWidth }}>
        {/* DAY HEADER */}
        <div className="flex border-b border-[#eef0f2] bg-[#fcfcfd] pr-1.5">
          <div className="w-[66px] shrink-0" />
          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${visibleDays.length},1fr)` }}>
            {days.map((d) => (
              <div key={d.key} className="border-l border-[#f2f3f5] px-2 py-[11px] text-center">
                <div
                  className="text-[11.5px] font-bold tracking-[.03em] uppercase"
                  style={{ color: d.isToday ? '#5847eb' : '#9aa1ac' }}
                >
                  {DAY_ABBR[d.date.getUTCDay()]}
                </div>
                <div
                  className="mt-1 inline-flex h-[30px] min-w-[30px] items-center justify-center rounded-[9px] px-2 text-[15px] font-extrabold tracking-[-.3px]"
                  style={{ color: d.isToday ? '#fff' : '#2b2f36', background: d.isToday ? '#5847eb' : 'transparent' }}
                >
                  {d.date.getUTCDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCROLL GRID */}
        <div className="max-h-[600px] overflow-auto">
          <div className="flex">
            <div className="relative w-[66px] shrink-0" style={{ height: GRID_HEIGHT }}>
              {hourLabels.map((hl) => (
                <div
                  key={hl.label}
                  className="absolute right-2.5 -translate-y-[7px] text-[11px] font-bold text-[#a3a9b2]"
                  style={{ top: hl.top }}
                >
                  {hl.label}
                </div>
              ))}
            </div>
            <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${visibleDays.length},1fr)` }}>
              {days.map((d) => (
                <div key={d.key} className="relative border-l border-[#f2f3f5]">
                  {Array.from({ length: ROWS }, (_, i) => (
                    <div
                      key={i}
                      onClick={() => handleEmptyCellClick(d.date, HOUR_START + i * 60)}
                      className="group relative h-[80px] cursor-pointer border-b border-[#f4f5f7] hover:bg-[#f9faff]"
                    >
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-[#a29bf0] opacity-0 transition-opacity group-hover:opacity-100">
                        <Plus className="h-[15px] w-[15px]" />
                        Nuevo turno
                      </span>
                    </div>
                  ))}
                  <div className="pointer-events-none absolute inset-0">
                    {d.nowTop != null && (
                      <div className="absolute right-0 left-0 z-[7] border-t-2 border-[#ef4444]" style={{ top: d.nowTop }}>
                        <span className="absolute -top-[5px] -left-1 h-[9px] w-[9px] rounded-full bg-[#ef4444]" />
                      </div>
                    )}
                    {d.blocks.map((b) => (
                      <div
                        key={b.appointment.id}
                        onClick={() => setSelectedId(b.appointment.id)}
                        className="absolute cursor-pointer overflow-hidden rounded-[9px] pointer-events-auto transition-[transform,box-shadow] duration-100 hover:z-[6] hover:-translate-y-px hover:shadow-[0_8px_18px_-8px_rgba(23,26,31,.28)]"
                        style={{
                          top: b.top,
                          height: b.height,
                          left: `calc(${b.left}% + 2px)`,
                          width: `calc(${b.width}% - 4px)`,
                          background: b.bg,
                          border: `1px solid ${b.edge}2e`,
                          borderLeft: `3px solid ${b.edge}`,
                          padding: '6px 9px',
                          opacity: b.dim ? 0.7 : 1,
                          boxShadow: '0 1px 2px rgba(23,26,31,.04)',
                        }}
                      >
                        <div
                          className="text-[10.5px] font-extrabold tracking-[-.1px]"
                          style={{ color: b.dim ? '#9aa1ac' : b.edge }}
                        >
                          {b.timeLabel}
                        </div>
                        <div
                          className="mt-px overflow-hidden text-[12px] font-bold text-ellipsis whitespace-nowrap"
                          style={{
                            color: b.dim ? '#8a919c' : '#2b2f36',
                            textDecoration: b.appointment.status === 'cancelled' ? 'line-through' : 'none',
                          }}
                        >
                          {b.appointment.client?.name ?? 'Cliente'}
                        </div>
                        {b.showSub && (
                          <div className="mt-px overflow-hidden text-[10.5px] text-ellipsis whitespace-nowrap text-[#8a919c]">
                            {b.sub}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
        </div>
      </div>

      {/* DETAIL DRAWER */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-[rgba(23,26,31,.28)]" onClick={() => setSelectedId(null)} />
          <div className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[394px] flex-col border-l border-[#eaecef] bg-white shadow-[-16px_0_44px_-22px_rgba(23,26,31,.4)]">
            <div className="flex items-center justify-between border-b border-[#f0f1f3] px-5 py-[18px]">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-[21px] w-[21px] text-[#5847eb]" />
                <span className="text-[15px] font-extrabold tracking-[-.2px] text-[#171a1f]">Detalle del turno</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#eef0f2] bg-white text-[#6b7480] hover:bg-[#f4f5f7]"
              >
                <X className="h-[19px] w-[19px]" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-5">
              {(() => {
                const statusMeta = STATUS_META[selected.status];
                const pro = professionalById.get(selected.professionalId);
                const start = new Date(selected.startDatetime);
                const end = new Date(selected.endDatetime);
                const clientName = selected.client?.name ?? 'Cliente';
                return (
                  <>
                    <div className="mb-1.5 flex items-center gap-[13px]">
                      <div
                        className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[14px] text-[16px] font-extrabold"
                        style={{ background: statusMeta.tint, color: statusMeta.color }}
                      >
                        {getInitials(clientName)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[17px] font-extrabold tracking-[-.3px] text-[#171a1f]">{clientName}</div>
                        {selected.client?.phone && (
                          <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#8a919c]">
                            <Phone className="h-[15px] w-[15px]" />
                            {selected.client.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className="my-[12px] inline-flex items-center gap-1.5 rounded-[20px] px-3 py-[6px] text-[12.5px] font-bold"
                      style={{ background: statusMeta.tint, color: statusMeta.color }}
                    >
                      <statusMeta.icon className="h-4 w-4" />
                      {statusMeta.label}
                    </div>

                    <div className="flex flex-col overflow-hidden rounded-[14px] border border-[#eef0f2]">
                      <div className="flex items-center gap-3 px-[15px] py-[13px]">
                        <Stethoscope className="h-[19px] w-[19px] text-[#8a919c]" />
                        <div className="flex-1">
                          <div className="text-[11px] font-bold text-[#9aa1ac]">Servicio</div>
                          <div className="mt-px text-[13.5px] font-bold text-[#171a1f]">
                            {selected.service?.name ?? '—'}
                          </div>
                        </div>
                        <div className="text-[13.5px] font-extrabold text-[#0f9d63]">
                          {selected.amount ? `$${Number(selected.amount).toLocaleString('es-AR')}` : '—'}
                        </div>
                      </div>
                      <div className="h-px bg-[#f2f3f5]" />
                      <div className="flex items-center gap-3 px-[15px] py-[13px]">
                        <UserRound className="h-[19px] w-[19px]" style={{ color: pro?.color ?? '#8a919c' }} />
                        <div className="flex-1">
                          <div className="text-[11px] font-bold text-[#9aa1ac]">Profesional</div>
                          <div className="mt-px text-[13.5px] font-bold text-[#171a1f]">
                            {pro?.user.name ?? selected.professional?.user.name ?? '—'}
                          </div>
                        </div>
                        <span className="text-[11.5px] font-semibold text-[#8a919c]">{pro?.specialty ?? ''}</span>
                      </div>
                      <div className="h-px bg-[#f2f3f5]" />
                      <div className="flex items-center gap-3 px-[15px] py-[13px]">
                        <CalendarCheck className="h-[19px] w-[19px] text-[#8a919c]" />
                        <div className="flex-1">
                          <div className="text-[11px] font-bold text-[#9aa1ac]">Fecha y hora</div>
                          <div className="mt-px text-[13.5px] font-bold text-[#171a1f]">
                            {DAY_FULL[start.getUTCDay()]} {start.getUTCDate()} de {monthLabel(start)} {start.getUTCFullYear()}
                          </div>
                        </div>
                        <span className="text-[12.5px] font-bold text-[#4b535e]">
                          {hourLabel(minutesOfDayUTC(start))} – {hourLabel(minutesOfDayUTC(end))}
                        </span>
                      </div>
                    </div>

                    {selected.notes && (
                      <div className="mt-[18px]">
                        <div className="mb-[7px] text-[11px] font-bold tracking-[.05em] text-[#9aa1ac] uppercase">
                          Notas
                        </div>
                        <div className="rounded-xl border border-[#f0f1f3] bg-[#fafbfc] px-3.5 py-3 text-[13px] leading-[1.5] text-[#4b535e]">
                          {selected.notes}
                        </div>
                      </div>
                    )}

                    {selected.status === 'cancelled' && (
                      <div className="mt-3.5 flex gap-2.5 rounded-xl border border-[#f7d4d4] bg-[#fdecec] px-3.5 py-3">
                        <XCircle className="h-[19px] w-[19px] shrink-0 text-[#dc2626]" />
                        <div>
                          <div className="text-[12px] font-extrabold text-[#b91c1c]">Motivo de cancelación</div>
                          <div className="mt-0.5 text-[12.5px] leading-[1.45] text-[#a13a3a]">
                            {selected.cancellationReason || 'Turno cancelado.'}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {actionsFor(selected).length > 0 && (
              <div className="flex flex-col gap-[9px] border-t border-[#f0f1f3] px-5 py-[15px]">
                {actionsFor(selected).map((ac) => {
                  const style = ACTION_VARIANTS[ac.variant];
                  return (
                    <button
                      key={ac.label}
                      type="button"
                      disabled={actionLoading}
                      onClick={ac.onClick}
                      className="flex w-full items-center justify-center gap-2 rounded-[11px] py-[11px] text-[13.5px] font-bold disabled:opacity-60"
                      style={{
                        background: style.bg,
                        color: style.color,
                        border: `1px solid ${style.border}`,
                        boxShadow: style.shadow,
                      }}
                    >
                      <ac.icon className="h-[19px] w-[19px]" />
                      {ac.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-[#171a1f] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,.4)]">
          <Info className="h-[18px] w-[18px] text-[#8a7ff0]" />
          {toast}
        </div>
      )}
    </div>
  );
}
