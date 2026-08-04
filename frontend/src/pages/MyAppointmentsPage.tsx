import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  Edit3,
  MapPin,
  Plus,
  RotateCcw,
  Stethoscope,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import * as appointmentsApi from '../api/appointments';
import { getErrorMessage } from '../api/client';
import { CLIENT_STATUS_META, clientBadgeOf } from '../lib/clientAppointmentStatus';
import { CLINIC_INFO } from '../lib/clinic';
import { getInitials } from '../lib/format';
import type { Appointment } from '../types';

type Tab = 'upcoming' | 'history' | 'all';

const EMPTY_STATE: Record<Tab, { title: string; sub: string }> = {
  upcoming: { title: 'No tenés turnos próximos', sub: 'Reservá tu próxima cita en unos pocos pasos.' },
  history: { title: 'Todavía no tenés historial', sub: 'Acá vas a ver tus turnos pasados.' },
  all: { title: 'No tenés turnos', sub: 'Reservá tu primera cita cuando quieras.' },
};

function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
function monthShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase();
}
function dayNum(iso: string): string {
  return String(new Date(iso).getUTCDate());
}
function dowShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
}
function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
}

export function MyAppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Appointment | null>(null);

  useEffect(() => {
    appointmentsApi
      .listMine()
      .then(setAppointments)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = useMemo(
    () => appointments.filter((a) => a.status === 'confirmed').sort((a, b) => a.startDatetime.localeCompare(b.startDatetime)),
    [appointments]
  );
  const history = useMemo(
    () =>
      appointments
        .filter((a) => a.status !== 'confirmed')
        .sort((a, b) => b.startDatetime.localeCompare(a.startDatetime)),
    [appointments]
  );
  const all = useMemo(() => [...upcoming, ...history], [upcoming, history]);

  const visible = tab === 'upcoming' ? upcoming : tab === 'history' ? history : all;

  function rebookUrl(a: Appointment): string {
    return `/reservar?professionalId=${a.professionalId}&serviceId=${a.serviceId}`;
  }

  async function handleConfirm(a: Appointment) {
    setBusyId(a.id);
    setActionError(null);
    try {
      const updated = await appointmentsApi.confirmAttendance(a.id);
      setAppointments((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(a: Appointment) {
    const ok = window.confirm(
      `¿Cancelar el turno de ${a.service?.name ?? 'servicio'} del ${fullDate(a.startDatetime)}?\n\nPodés cancelar sin costo hasta 24hs antes del turno.`
    );
    if (!ok) return;
    setBusyId(a.id);
    setActionError(null);
    try {
      const updated = await appointmentsApi.cancel(a.id);
      setAppointments((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReprogram(a: Appointment) {
    const ok = window.confirm(
      'Vas a cancelar este turno para elegir un nuevo horario con el mismo profesional y servicio. ¿Continuar?'
    );
    if (!ok) return;
    setBusyId(a.id);
    setActionError(null);
    try {
      const updated = await appointmentsApi.cancel(a.id, 'Reprogramado por el paciente');
      setAppointments((prev) => prev.map((x) => (x.id === a.id ? updated : x)));
      navigate(rebookUrl(a));
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="p-7 text-sm text-red-600">{error}</p>;

  const empty = EMPTY_STATE[tab];

  return (
    <div className="px-[28px] pt-[26px] pb-[40px]">
      <div className="mx-auto max-w-[920px]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="m-0 mb-1 text-[24px] font-extrabold tracking-[-.5px] text-[#171a1f]">Mis turnos</h2>
            <p className="m-0 text-[14px] text-[#6b7480]">Gestioná tus próximas citas y revisá tu historial.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/reservar')}
            className="flex items-center gap-1.5 rounded-[11px] bg-[#5847eb] px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.6)] hover:bg-[#4636cf]"
          >
            <Plus className="h-[19px] w-[19px]" />
            Reservar nuevo turno
          </button>
        </div>

        <div className="mb-[22px] flex items-center gap-1 border-b border-[#eaecef]">
          {(
            [
              { id: 'upcoming' as Tab, label: 'Próximos', count: upcoming.length },
              { id: 'history' as Tab, label: 'Historial', count: history.length },
              { id: 'all' as Tab, label: 'Todos', count: all.length },
            ]
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="-mb-px flex items-center gap-2 px-3.5 py-2.5 text-[14px] font-bold hover:text-[#4b535e]"
                style={{ color: active ? '#171a1f' : '#9aa1ac', borderBottom: `2.5px solid ${active ? '#5847eb' : 'transparent'}` }}
              >
                {t.label}
                <span
                  className="rounded-[20px] px-2 py-0.5 text-[11.5px] font-bold"
                  style={{ background: active ? '#eef0fe' : '#f0f1f3', color: active ? '#5847eb' : '#9aa1ac' }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}

        <div className="flex flex-col gap-3.5">
          {visible.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              busy={busyId === a.id}
              onConfirm={() => handleConfirm(a)}
              onCancel={() => handleCancel(a)}
              onReprogram={() => handleReprogram(a)}
              onRebook={() => navigate(rebookUrl(a))}
              onDetail={() => setDetail(a)}
            />
          ))}

          {visible.length === 0 && (
            <div className="rounded-[16px] border border-dashed border-[#dfe2e6] bg-white px-5 py-12 text-center">
              <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef0fe] text-[#5847eb]">
                <CalendarPlus className="h-7 w-7" />
              </div>
              <div className="text-[16px] font-extrabold tracking-[-.2px] text-[#171a1f]">{empty.title}</div>
              <p className="mt-1.5 mb-4.5 text-[13.5px] text-[#8a919c]">{empty.sub}</p>
              <button
                type="button"
                onClick={() => navigate('/reservar')}
                className="inline-flex items-center gap-1.5 rounded-[11px] bg-[#5847eb] px-[18px] py-2.5 text-[13.5px] font-bold text-white hover:bg-[#4636cf]"
              >
                <Plus className="h-[19px] w-[19px]" />
                Reservar turno
              </button>
            </div>
          )}
        </div>
      </div>

      {detail && <DetailDrawer appointment={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onReprogram: () => void;
  onRebook: () => void;
  onDetail: () => void;
}

function AppointmentCard({ appointment: a, busy, onConfirm, onCancel, onReprogram, onRebook, onDetail }: AppointmentCardProps) {
  const badge = clientBadgeOf(a);
  const meta = CLIENT_STATUS_META[badge];
  const isUpcoming = a.status === 'confirmed';
  const proName = a.professional?.user.name ?? 'Profesional';
  const proColor = a.professional?.color ?? '#5847eb';

  return (
    <div
      className="flex items-center gap-[18px] rounded-2xl border border-[#eaecef] bg-white p-[18px] px-5 hover:border-[#e2ddf9]"
      style={{ opacity: a.status === 'cancelled' ? 0.92 : 1 }}
    >
      <div
        className="w-[66px] shrink-0 rounded-[14px] py-[11px] text-center"
        style={{ background: isUpcoming ? '#f3f1fe' : '#f4f5f7' }}
      >
        <div className="text-[11px] font-bold tracking-[.05em]" style={{ color: isUpcoming ? '#5847eb' : '#a3a9b2' }}>
          {monthShort(a.startDatetime)}
        </div>
        <div className="my-px text-[26px] font-extrabold leading-none" style={{ color: isUpcoming ? '#5847eb' : '#4b535e' }}>
          {dayNum(a.startDatetime)}
        </div>
        <div className="text-[10.5px] font-semibold text-[#8a919c]">{dowShort(a.startDatetime)}</div>
      </div>

      <div
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] text-[15px] font-bold text-white"
        style={{ background: proColor }}
      >
        {getInitials(proName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[15.5px] font-extrabold tracking-[-.2px] text-[#171a1f]">{a.service?.name ?? 'Servicio'}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-[12.5px] text-[#6b7480]">
            <User className="h-4 w-4 text-[#a3a9b2]" />
            {proName}
          </span>
          <span className="flex items-center gap-1.5 text-[12.5px] text-[#6b7480]">
            <Clock className="h-4 w-4 text-[#a3a9b2]" />
            {timeLabel(a.startDatetime)} hs
          </span>
          <span className="flex items-center gap-1.5 text-[12.5px] text-[#6b7480]">
            <MapPin className="h-4 w-4 text-[#a3a9b2]" />
            {CLINIC_INFO.shortAddress}
          </span>
        </div>
        {a.status === 'cancelled' && a.cancellationReason && (
          <p className="mt-1.5 text-[12px] text-[#dc2626] italic">Motivo: {a.cancellationReason}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2.5">
        <span
          className="flex items-center gap-1.5 rounded-[20px] px-3 py-1.5 text-[12px] font-bold"
          style={{ background: meta.bg, color: meta.color }}
        >
          <meta.icon className="h-[15px] w-[15px]" />
          {meta.label}
        </span>
        <div className="flex gap-2">
          {badge === 'unconfirmed' && (
            <ActionButton icon={Check} label="Confirmar" solid disabled={busy} onClick={onConfirm} />
          )}
          {(badge === 'unconfirmed' || badge === 'confirmed') && (
            <ActionButton icon={X} label="Cancelar" danger disabled={busy} onClick={onCancel} />
          )}
          {badge === 'confirmed' && <ActionButton icon={Edit3} label="Reprogramar" disabled={busy} onClick={onReprogram} />}
          {badge === 'completed' && <ActionButton icon={Calendar} label="Ver detalle" disabled={busy} onClick={onDetail} />}
          {(badge === 'completed' || badge === 'cancelled' || badge === 'no_show') && (
            <ActionButton icon={RotateCcw} label="Reservar de nuevo" tint disabled={busy} onClick={onRebook} />
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  solid,
  danger,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  solid?: boolean;
  danger?: boolean;
  tint?: boolean;
}) {
  const style = solid
    ? { background: '#5847eb', border: '1px solid #5847eb', color: '#fff' }
    : danger
      ? { background: '#fff', border: '1px solid #f0d4d4', color: '#dc2626' }
      : tint
        ? { background: '#f7f6ff', border: '1px solid #e2ddf9', color: '#5847eb' }
        : { background: '#fff', border: '1px solid #eaecef', color: '#4b535e' };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[12.5px] font-bold hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      style={style}
    >
      <Icon className="h-[17px] w-[17px]" />
      {label}
    </button>
  );
}

function DetailDrawer({ appointment: a, onClose }: { appointment: Appointment; onClose: () => void }) {
  const badge = clientBadgeOf(a);
  const meta = CLIENT_STATUS_META[badge];

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-[rgba(23,26,31,.34)] backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-[400px] flex-col bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#f0f1f3] px-5 py-[18px]">
          <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#eef0fe] text-[#5847eb]">
            <Stethoscope className="h-5 w-5" />
          </span>
          <h3 className="m-0 flex-1 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Detalle del turno</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#8a919c] hover:bg-[#f4f5f7]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-5">
            <span
              className="flex w-fit items-center gap-1.5 rounded-[20px] px-3 py-1.5 text-[12px] font-bold"
              style={{ background: meta.bg, color: meta.color }}
            >
              <meta.icon className="h-[15px] w-[15px]" />
              {meta.label}
            </span>
          </div>
          <DetailRow icon={Stethoscope} label="Servicio" value={a.service?.name ?? '—'} />
          <DetailRow icon={User} label="Profesional" value={`${a.professional?.user.name ?? '—'}${a.professional?.specialty ? ` · ${a.professional.specialty}` : ''}`} />
          <DetailRow icon={Calendar} label="Fecha y hora" value={`${fullDate(a.startDatetime)} · ${timeLabel(a.startDatetime)} hs`} />
          <DetailRow icon={MapPin} label="Lugar" value={`${CLINIC_INFO.name} · ${CLINIC_INFO.address}`} />
          {a.notes && <DetailRow icon={Edit3} label="Notas" value={a.notes} />}
          <div className="mt-2 flex items-center justify-between rounded-[12px] bg-[#fbfbfc] px-4 py-3.5">
            <span className="text-[13px] font-semibold text-[#6b7480]">Valor del turno</span>
            <span className="text-[15px] font-extrabold text-[#171a1f]">{a.amount ? `$${Number(a.amount).toLocaleString('es-AR')}` : '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f4f5f7] text-[#6b7480]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold tracking-[.04em] text-[#9aa1ac] uppercase">{label}</div>
        <div className="mt-0.5 text-[13.5px] font-semibold text-[#2b2f36]">{value}</div>
      </div>
    </div>
  );
}
