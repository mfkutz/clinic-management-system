import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  Edit3,
  FileText,
  Info,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  User,
  UserRound,
  X,
} from 'lucide-react';
import * as appointmentsApi from '../../api/appointments';
import { getErrorMessage } from '../../api/client';
import { CLIENT_STATUS_META, clientBadgeOf } from '../../lib/clientAppointmentStatus';
import { CLINIC_INFO, clinicMapEmbedUrl } from '../../lib/clinic';
import { dateKeyOf } from '../../lib/dates';
import { formatLongDateLabel } from '../../lib/format';
import { CATEGORY_META } from '../../lib/serviceCategory';
import { useAuthStore } from '../../stores/authStore';
import type { Appointment } from '../../types';

function daysUntil(dateKey: string, todayKey: string): number {
  const ms = new Date(`${dateKey}T00:00:00Z`).getTime() - new Date(`${todayKey}T00:00:00Z`).getTime();
  return Math.round(ms / 86400000);
}

function countdownLabel(diffDays: number): string {
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  return `En ${diffDays} días`;
}

function monthShort(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase();
}
function dayNum(iso: string): string {
  return String(new Date(iso).getUTCDate());
}
function dowLong(iso: string): string {
  const d = new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', timeZone: 'UTC' });
  return d.charAt(0).toUpperCase() + d.slice(1);
}
function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
}
function mapsUrl(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CLINIC_INFO.address)}`;
}
function whatsAppUrl(): string {
  const digits = CLINIC_INFO.phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export function ClientHomePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    appointmentsApi
      .listMine()
      .then(setAppointments)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const todayKey = dateKeyOf(now.toISOString());

  const upcoming = useMemo(
    () => appointments.filter((a) => a.status === 'confirmed').sort((a, b) => a.startDatetime.localeCompare(b.startDatetime)),
    [appointments]
  );
  const next = upcoming[0] ?? null;
  const nextDiffDays = next ? daysUntil(dateKeyOf(next.startDatetime), todayKey) : 0;

  const rebookSuggestions = useMemo(() => {
    const map = new Map<string, { professionalId: string; serviceId: string; count: number; last: string }>();
    appointments
      .filter((a) => a.status === 'completed' && a.service && a.professional)
      .forEach((a) => {
        const key = `${a.professionalId}:${a.serviceId}`;
        const entry = map.get(key);
        if (entry) {
          entry.count += 1;
          if (a.startDatetime > entry.last) entry.last = a.startDatetime;
        } else {
          map.set(key, { professionalId: a.professionalId, serviceId: a.serviceId, count: 1, last: a.startDatetime });
        }
      });
    return [...map.values()]
      .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
      .slice(0, 3)
      .map((entry) => {
        const source = appointments.find((a) => a.professionalId === entry.professionalId && a.serviceId === entry.serviceId);
        return { ...entry, service: source?.service, professional: source?.professional };
      });
  }, [appointments]);

  async function handleConfirmAttendance(a: Appointment) {
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
      `¿Cancelar el turno de ${a.service?.name ?? 'servicio'}?\n\nPodés cancelar sin costo hasta 24hs antes del turno.`
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
    const ok = window.confirm('Vas a cancelar este turno para elegir un nuevo horario con el mismo profesional y servicio. ¿Continuar?');
    if (!ok) return;
    setBusyId(a.id);
    setActionError(null);
    try {
      await appointmentsApi.cancel(a.id, 'Reprogramado por el paciente');
      navigate(`/reservar?professionalId=${a.professionalId}&serviceId=${a.serviceId}`);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="p-7 text-sm text-red-600">{error}</p>;

  const firstName = user?.name.split(' ')[0] ?? '';
  const quickActions = [
    { icon: CalendarPlus, label: 'Reservar turno', bg: '#eef0fe', color: '#5847eb', to: '/reservar' },
    { icon: Calendar, label: 'Mis turnos', bg: '#eaf7ef', color: '#16a34a', to: '/mis-turnos' },
    { icon: FileText, label: 'Mi historial', bg: '#eef7f2', color: '#0f9d63', to: '/proximamente' },
    { icon: User, label: 'Mis datos', bg: '#fef4e8', color: '#d97706', to: '/proximamente' },
  ];

  return (
    <div className="px-[28px] pt-[26px] pb-[40px]">
      <div className="mb-[22px]">
        <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
          <Calendar className="h-[17px] w-[17px]" />
          {formatLongDateLabel(now)}
        </div>
        <h2 className="mt-[7px] mb-[5px] text-[26px] font-extrabold tracking-[-.6px] text-[#171a1f]">Hola, {firstName} 👋</h2>
        <p className="m-0 text-[14px] text-[#6b7480]">
          {next
            ? <>Tu próximo turno es <b className="text-[#171a1f]">{countdownLabel(nextDiffDays).toLowerCase()}</b>. Acá tenés todo lo que necesitás.</>
            : 'No tenés turnos próximos. ¿Reservamos uno?'}
        </p>
      </div>

      {actionError && <p className="mb-4 text-sm text-red-600">{actionError}</p>}

      <div className="grid grid-cols-[1.7fr_1fr] items-start gap-5">
        <div className="flex flex-col gap-5">
          {next ? (
            <section
              className="overflow-hidden rounded-[20px] text-white shadow-[0_18px_40px_-18px_rgba(88,71,235,.6)]"
              style={{ background: 'linear-gradient(135deg,#5f4df0,#4a38d4)' }}
            >
              <div className="px-6 pt-[22px] pb-5">
                <div className="mb-[18px] flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[12px] font-extrabold tracking-[.08em] text-[#d6d0fb] uppercase">
                    <span
                      className="inline-block h-[7px] w-[7px] rounded-full bg-[#8fffc4]"
                      style={{ boxShadow: '0 0 0 4px rgba(143,255,196,.25)' }}
                    />
                    Tu próximo turno
                  </span>
                  <span className="rounded-[20px] bg-[rgba(255,255,255,.16)] px-3 py-[5px] text-[12.5px] font-bold">
                    {countdownLabel(nextDiffDays)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="w-[70px] shrink-0 rounded-2xl bg-[rgba(255,255,255,.14)] px-2 py-3 text-center">
                    <div className="text-[11.5px] font-bold tracking-[.05em] text-[#d6d0fb] uppercase">{monthShort(next.startDatetime)}</div>
                    <div className="my-0.5 text-[30px] font-extrabold leading-[1.05]">{dayNum(next.startDatetime)}</div>
                    <div className="text-[11.5px] font-semibold text-[#d6d0fb]">{dowLong(next.startDatetime)}</div>
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-center gap-2.5 text-[22px] font-extrabold tracking-[-.4px]">
                      <Clock className="h-6 w-6" />
                      {timeLabel(next.startDatetime)} · {next.service?.name ?? 'Servicio'}
                    </div>
                    <div className="mt-2.5 flex flex-col gap-1.5 text-[13.5px] text-[#e6e3fb]">
                      <span className="flex items-center gap-2">
                        <UserRound className="h-[18px] w-[18px] text-[#c3bbf8]" />
                        {next.professional?.user.name ?? 'Profesional'}
                        {next.professional?.specialty && ` · ${next.professional.specialty}`}
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="h-[18px] w-[18px] text-[#c3bbf8]" />
                        {CLINIC_INFO.name} · {CLINIC_INFO.shortAddress}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 px-6 pb-[22px]">
                {!next.confirmedByClient && (
                  <button
                    type="button"
                    disabled={busyId === next.id}
                    onClick={() => handleConfirmAttendance(next)}
                    className="flex items-center gap-1.5 rounded-[11px] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#4a38d4] hover:bg-[#f2f0ff] disabled:opacity-60"
                  >
                    <Check className="h-[19px] w-[19px]" />
                    Confirmar asistencia
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === next.id}
                  onClick={() => handleReprogram(next)}
                  className="flex items-center gap-1.5 rounded-[11px] border border-[rgba(255,255,255,.3)] bg-[rgba(255,255,255,.12)] px-4 py-2.5 text-[13.5px] font-bold text-white hover:bg-[rgba(255,255,255,.2)] disabled:opacity-60"
                >
                  <Edit3 className="h-[19px] w-[19px]" />
                  Reprogramar
                </button>
                <a
                  href={mapsUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-[11px] border border-[rgba(255,255,255,.3)] bg-[rgba(255,255,255,.12)] px-4 py-2.5 text-[13.5px] font-bold text-white hover:bg-[rgba(255,255,255,.2)]"
                >
                  <Navigation className="h-[19px] w-[19px]" />
                  Cómo llegar
                </a>
                <button
                  type="button"
                  disabled={busyId === next.id}
                  onClick={() => handleCancel(next)}
                  className="ml-auto flex items-center gap-1.5 rounded-[11px] border border-[rgba(255,255,255,.2)] bg-transparent px-4 py-2.5 text-[13.5px] font-semibold text-[#d6d0fb] hover:bg-[rgba(255,255,255,.1)] disabled:opacity-60"
                >
                  <X className="h-[19px] w-[19px]" />
                  Cancelar
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-[20px] border border-dashed border-[#e2ddf9] bg-[#fbfbff] px-6 py-10 text-center">
              <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef0fe] text-[#5847eb]">
                <CalendarPlus className="h-7 w-7" />
              </div>
              <div className="text-[16px] font-extrabold tracking-[-.2px] text-[#171a1f]">No tenés turnos próximos</div>
              <p className="mt-1.5 mb-4.5 text-[13.5px] text-[#8a919c]">Reservá tu próxima cita en unos pocos pasos.</p>
              <Link
                to="/reservar"
                className="inline-flex items-center gap-1.5 rounded-[11px] bg-[#5847eb] px-[18px] py-2.5 text-[13.5px] font-bold text-white hover:bg-[#4636cf]"
              >
                <CalendarPlus className="h-[19px] w-[19px]" />
                Reservar turno
              </Link>
            </section>
          )}

          <section className="overflow-hidden rounded-[18px] border border-[#eaecef] bg-white">
            <div className="flex items-center justify-between border-b border-[#f0f1f3] px-5 pt-[18px] pb-3.5">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-[22px] w-[22px] text-[#5847eb]" />
                <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Mis próximos turnos</h3>
                <span className="rounded-[20px] bg-[#eef0fe] px-[9px] py-[3px] text-[12px] font-bold text-[#5847eb]">{upcoming.length}</span>
              </div>
              <Link to="/mis-turnos" className="text-[12.5px] font-bold text-[#5847eb] hover:text-[#4636cf]">
                Ver todos
              </Link>
            </div>
            <div className="flex flex-col">
              {upcoming.length === 0 && <p className="px-5 py-6 text-sm text-[#8a919c]">No tenés turnos próximos.</p>}
              {upcoming.slice(0, 4).map((a) => {
                const badge = clientBadgeOf(a);
                const meta = CLIENT_STATUS_META[badge];
                const catMeta = a.service ? CATEGORY_META[a.service.category] : null;
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-[15px] border-b border-[#f4f5f7] px-5 py-3.5 hover:bg-[#fafbfc]"
                    style={{ borderLeft: `3px solid ${meta.color}` }}
                  >
                    <div className="w-14 shrink-0 text-center">
                      <div className="text-[12px] font-bold tracking-[.03em] text-[#a3a9b2] uppercase">{monthShort(a.startDatetime)}</div>
                      <div className="text-[19px] font-extrabold leading-[1.05] tracking-[-.3px] text-[#171a1f]">{dayNum(a.startDatetime)}</div>
                    </div>
                    {catMeta && (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: catMeta.bg, color: catMeta.color }}>
                        <catMeta.icon className="h-[21px] w-[21px]" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold text-[#171a1f]">{a.service?.name ?? 'Servicio'}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#8a919c]">
                        <Clock className="h-3.5 w-3.5" />
                        {timeLabel(a.startDatetime)} · {a.professional?.user.name ?? 'Profesional'}
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-[20px] px-[11px] py-[5px] text-[12px] font-bold whitespace-nowrap" style={{ background: meta.bg, color: meta.color }}>
                      <meta.icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 py-[18px]">
            <h3 className="m-0 mb-3.5 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Para tener en cuenta</h3>
            <div className="flex flex-col gap-2.5">
              {next && !next.confirmedByClient && (
                <button
                  type="button"
                  onClick={() => handleConfirmAttendance(next)}
                  className="flex items-center gap-3 rounded-[13px] border border-[#f0f1f3] p-3 text-left hover:bg-[#f4f5f7]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#fef4e8] text-[#d97706]">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-bold text-[#171a1f]">Confirmá tu turno del {dowLong(next.startDatetime).toLowerCase()}</div>
                    <div className="mt-px text-[12px] text-[#8a919c]">
                      {next.service?.name} · {monthShort(next.startDatetime)} {dayNum(next.startDatetime)}, {timeLabel(next.startDatetime)}
                    </div>
                  </div>
                  <span className="text-[12px] font-bold text-[#d97706]">Confirmar</span>
                </button>
              )}
              <div className="flex items-center gap-3 rounded-[13px] border border-[#f0f1f3] p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eef0fe] text-[#5847eb]">
                  <Info className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold text-[#171a1f]">Vení 10 minutos antes</div>
                  <div className="mt-px text-[12px] text-[#8a919c]">Traé tu documento y tu credencial de obra social/prepaga si tenés.</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 pt-[18px] pb-5">
            <h3 className="mt-0 mb-3.5 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Acciones rápidas</h3>
            <div className="grid grid-cols-2 gap-[11px]">
              {quickActions.map((qa) => (
                <Link
                  key={qa.label}
                  to={qa.to}
                  className="flex flex-col items-start gap-[11px] rounded-[14px] border border-[#eef0f2] p-3.5 transition hover:-translate-y-px hover:border-[#cdd0f7] hover:bg-[#fbfbff]"
                >
                  <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]" style={{ background: qa.bg, color: qa.color }}>
                    <qa.icon className="h-[21px] w-[21px]" />
                  </span>
                  <span className="text-[13.5px] font-bold text-[#2b2f36]">{qa.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[18px] border border-[#eaecef] bg-white">
            <iframe
              title="Ubicación de la clínica"
              src={clinicMapEmbedUrl()}
              className="h-[120px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="px-5 py-[18px]">
              <h3 className="m-0 mb-0.5 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">{CLINIC_INFO.name}</h3>
              <div className="mt-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 text-[13px] text-[#4b535e]">
                  <MapPin className="h-[19px] w-[19px] text-[#8a919c]" />
                  {CLINIC_INFO.address}
                </div>
                <div className="flex items-center gap-2.5 text-[13px] text-[#4b535e]">
                  <Phone className="h-[19px] w-[19px] text-[#8a919c]" />
                  {CLINIC_INFO.phone}
                </div>
                <div className="flex items-center gap-2.5 text-[13px] text-[#4b535e]">
                  <Clock className="h-[19px] w-[19px] text-[#8a919c]" />
                  {CLINIC_INFO.hours}
                </div>
              </div>
              <div className="mt-4 flex gap-2.5">
                <a
                  href={mapsUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[11px] border border-[#eaecef] bg-white py-2.5 text-[13px] font-bold text-[#4b535e] hover:bg-[#f4f5f7]"
                >
                  <Navigation className="h-[18px] w-[18px]" />
                  Cómo llegar
                </a>
                <a
                  href={whatsAppUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[11px] border border-[#d6efdf] bg-[#eaf7ef] py-2.5 text-[13px] font-bold text-[#16a34a] hover:bg-[#dff2e6]"
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                  WhatsApp
                </a>
              </div>
            </div>
          </section>

          {rebookSuggestions.length > 0 && (
            <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 py-[18px]">
              <h3 className="m-0 mb-3.5 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Reservar de nuevo</h3>
              <div className="flex flex-col gap-2.5">
                {rebookSuggestions.map((r) => {
                  const catMeta = r.service ? CATEGORY_META[r.service.category] : null;
                  return (
                    <Link
                      key={`${r.professionalId}:${r.serviceId}`}
                      to={`/reservar?professionalId=${r.professionalId}&serviceId=${r.serviceId}`}
                      className="flex items-center gap-3 rounded-[13px] border border-[#f0f1f3] p-2.5 hover:bg-[#fbfbff]"
                    >
                      {catMeta && (
                        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px]" style={{ background: catMeta.bg, color: catMeta.color }}>
                          <catMeta.icon className="h-5 w-5" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-bold text-[#171a1f]">{r.service?.name}</div>
                        <div className="mt-px text-[12px] text-[#8a919c]">{r.professional?.user.name}</div>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#eef0fe] text-[#5847eb]">
                        <CalendarPlus className="h-[18px] w-[18px]" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
