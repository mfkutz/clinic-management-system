import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Edit,
  MapPin,
  Receipt,
  Stethoscope,
  User,
} from 'lucide-react';
import * as appointmentsApi from '../api/appointments';
import { getErrorMessage } from '../api/client';
import * as professionalsApi from '../api/professionals';
import { CLINIC_INFO } from '../lib/clinic';
import { toDateKey } from '../lib/dates';
import { formatMoney } from '../lib/format';
import { CATEGORY_META } from '../lib/serviceCategory';
import type { Appointment, Professional, Service, Slot } from '../types';

const CLINIC_ADDRESS = `${CLINIC_INFO.name} · ${CLINIC_INFO.address}`;
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const DOW3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const WEEKDAY_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_MONTH_OFFSET = 3;

const STEP_LABELS = ['Profesional', 'Servicio', 'Fecha', 'Horario', 'Confirmar'];

function utcMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`);
}

function monthAnchor(todayKey: string, monthOffset: number): Date {
  const t = utcMidnight(todayKey);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + monthOffset, 1));
}

function daysInMonthUTC(monthDate: Date): number {
  return new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)).getUTCDate();
}

function buildCalendarCells(monthDate: Date): (string | null)[] {
  const firstDow = (monthDate.getUTCDay() + 6) % 7; // lunes = 0
  const total = daysInMonthUTC(monthDate);
  const totalCells = Math.ceil((firstDow + total) / 7) * 7;
  return Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDow + 1;
    if (dayNum < 1 || dayNum > total) return null;
    return toDateKey(new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), dayNum)));
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function slotKey(professionalId: string, serviceId: string, date: string): string {
  return `${professionalId}:${serviceId}:${date}`;
}

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const prefillApplied = useRef(false);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [notes, setNotes] = useState('');

  const [slotsByKey, setSlotsByKey] = useState<Record<string, Slot[]>>({});
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);

  const todayKey = toDateKey(new Date());

  useEffect(() => {
    professionalsApi
      .list()
      .then((data) => setProfessionals(data.filter((p) => p.services.length > 0)))
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoadingProfessionals(false));
  }, []);

  // Reservar de nuevo: precarga profesional/servicio desde query params y salta directo al paso 3.
  useEffect(() => {
    if (prefillApplied.current || loadingProfessionals || professionals.length === 0) return;
    const proId = searchParams.get('professionalId');
    const svcId = searchParams.get('serviceId');
    if (!proId || !svcId) return;
    const pro = professionals.find((p) => p.id === proId);
    if (!pro || !pro.services.some((s) => s.id === svcId)) return;
    prefillApplied.current = true;
    setProfessionalId(proId);
    setServiceId(svcId);
    setStep(3);
  }, [loadingProfessionals, professionals, searchParams]);

  const selectedProfessional = useMemo(
    () => professionals.find((p) => p.id === professionalId) ?? null,
    [professionals, professionalId]
  );
  const selectedService = useMemo<(Service & { ProfessionalService: { priceOverride: string | null; durationOverride: number | null } }) | null>(
    () => selectedProfessional?.services.find((s) => s.id === serviceId) ?? null,
    [selectedProfessional, serviceId]
  );
  const price = selectedService ? Number(selectedService.ProfessionalService.priceOverride ?? selectedService.price) : null;
  const duration = selectedService ? (selectedService.ProfessionalService.durationOverride ?? selectedService.durationMinutes) : null;

  function selectProfessional(id: string) {
    setProfessionalId(id);
    setServiceId(null);
    setDate(null);
    setTime(null);
    setMonthOffset(0);
  }

  function selectService(id: string) {
    setServiceId(id);
    setDate(null);
    setTime(null);
    setMonthOffset(0);
  }

  function selectDate(k: string) {
    setDate(k);
    setTime(null);
  }

  // Disponibilidad real del mes visible: trae los horarios libres de cada día (sin cache repetida)
  // para poder pintar el dot verde/ámbar/gris del calendario con datos reales, no una regla fija.
  useEffect(() => {
    if (!professionalId || !serviceId) return;
    const monthDate = monthAnchor(todayKey, monthOffset);
    const keys = buildCalendarCells(monthDate).filter((k): k is string => k !== null && k >= todayKey);
    const missing = keys.filter((k) => !(slotKey(professionalId, serviceId, k) in slotsByKey));
    if (missing.length === 0) return;

    setLoadingCalendar(true);
    Promise.all(
      missing.map((k) =>
        appointmentsApi
          .getAvailableSlots({ professionalId, serviceId, date: k })
          .then((slots) => [k, slots] as [string, Slot[]])
          .catch(() => [k, [] as Slot[]] as [string, Slot[]])
      )
    )
      .then((pairs) => {
        setSlotsByKey((prev) => {
          const next = { ...prev };
          pairs.forEach(([k, slots]) => {
            next[slotKey(professionalId, serviceId, k)] = slots;
          });
          return next;
        });
      })
      .finally(() => setLoadingCalendar(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, serviceId, monthOffset]);

  const daySlots = date && professionalId && serviceId ? slotsByKey[slotKey(professionalId, serviceId, date)] : undefined;

  function canAdvance(s: number): boolean {
    if (s === 1) return professionalId != null;
    if (s === 2) return serviceId != null;
    if (s === 3) return date != null;
    if (s === 4) return time != null;
    return true;
  }

  async function handleConfirm() {
    if (!professionalId || !serviceId || !date || !time) return;
    setBooking(true);
    setBookingError(null);
    try {
      const appointment = await appointmentsApi.create({
        professionalId,
        serviceId,
        date,
        startTime: time,
        notes: notes.trim() || undefined,
      });
      setConfirmed(appointment);
    } catch (err) {
      setBookingError(getErrorMessage(err));
    } finally {
      setBooking(false);
    }
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center sm:py-24">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf7ef] text-[#16a34a]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="m-0 text-[22px] font-extrabold tracking-[-.4px] text-[#171a1f]">¡Turno confirmado!</h2>
        <p className="mt-2.5 text-[14px] leading-[1.6] text-[#6b7480]">
          {confirmed.service?.name} con {confirmed.professional?.user.name}
          <br />
          {new Date(confirmed.startDatetime).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' })}
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link
            to="/mis-turnos"
            className="rounded-[11px] bg-[#5847eb] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.6)] hover:bg-[#4636cf]"
          >
            Ver mis turnos
          </Link>
          <Link
            to="/inicio"
            className="rounded-[11px] border border-[#eaecef] bg-white px-5 py-2.5 text-[13.5px] font-bold text-[#4b535e] hover:bg-[#f4f5f7]"
          >
            Volver a Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-8 lg:px-[28px] lg:pt-[26px] lg:pb-[40px]">
      <div className="mx-auto mb-5 max-w-[1080px]">
        <h2 className="m-0 mb-1 text-[20px] font-extrabold tracking-[-.5px] text-[#171a1f] sm:text-[24px]">Reservá tu turno</h2>
        <p className="m-0 mb-5 text-[13.5px] text-[#6b7480] sm:text-[14px]">Seguí los pasos y confirmá. Te enviaremos un recordatorio antes de la cita.</p>

        {/* Stepper compacto para mobile: barra de progreso + paso actual */}
        <div className="sm:hidden">
          <div className="mb-2 flex items-center justify-between text-[12.5px] font-bold text-[#171a1f]">
            <span>
              Paso {step} de {STEP_LABELS.length} · {STEP_LABELS[step - 1]}
            </span>
            <span className="text-[#9aa1ac]">{Math.round((step / STEP_LABELS.length) * 100)}%</span>
          </div>
          <div className="h-[6px] overflow-hidden rounded-[20px] bg-[#eef0f2]">
            <div
              className="h-full rounded-[20px] bg-[#5847eb] transition-[width]"
              style={{ width: `${(step / STEP_LABELS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="hidden items-center sm:flex">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = step > n;
            const active = step === n;
            const reachable = n <= step;
            return (
              <div key={n} className={`flex items-center ${i === STEP_LABELS.length - 1 ? 'flex-none' : 'flex-1'} min-w-0`}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => setStep(n)}
                  className="flex items-center gap-2.5"
                  style={{ cursor: reachable ? 'pointer' : 'default' }}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] border-[1.5px] text-[13.5px] font-extrabold"
                    style={{
                      background: done ? '#5847eb' : active ? '#eef0fe' : '#fff',
                      color: done ? '#fff' : active ? '#5847eb' : '#b8bec7',
                      borderColor: done || active ? '#5847eb' : '#e6e8eb',
                    }}
                  >
                    {done ? <Check className="h-[18px] w-[18px]" /> : n}
                  </span>
                  <span className="hidden flex-col items-start leading-tight md:flex">
                    <span className="text-[10px] font-bold tracking-[.05em] text-[#9aa1ac] uppercase">Paso {n}</span>
                    <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: active || done ? '#171a1f' : '#9aa1ac' }}>
                      {label}
                    </span>
                  </span>
                </button>
                {i < STEP_LABELS.length - 1 && (
                  <div className="mx-3 h-[2px] flex-1 rounded-sm" style={{ background: done ? '#5847eb' : '#e6e8eb' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
        <section className="min-h-[400px] rounded-[18px] border border-[#eaecef] bg-white p-4 sm:p-[22px]">
          {loadError && <p className="mb-4 text-sm text-red-600">{loadError}</p>}

          {step === 1 && (
            <div>
              <h3 className="m-0 mb-0.5 text-[17px] font-extrabold tracking-[-.3px] text-[#171a1f]">Elegí un profesional</h3>
              <p className="m-0 mb-4.5 text-[13px] text-[#8a919c]">¿Con quién te querés atender?</p>
              {loadingProfessionals ? (
                <p className="text-sm text-[#8a919c]">Cargando…</p>
              ) : professionals.length === 0 ? (
                <p className="text-sm text-[#8a919c]">No hay profesionales disponibles todavía.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {professionals.map((p) => {
                    const sel = professionalId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectProfessional(p.id)}
                        className="flex items-center gap-3.5 rounded-[14px] border-[1.5px] p-[15px] text-left hover:border-[#cdd0f7] hover:bg-[#fbfbff]"
                        style={{ borderColor: sel ? '#5847eb' : '#eef0f2', background: sel ? '#f7f6ff' : '#fff' }}
                      >
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[15px] font-bold text-white"
                          style={{ background: p.color }}
                        >
                          {p.user.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14px] font-bold text-[#171a1f]">{p.user.name}</div>
                          <div className="mt-0.5 text-[12.5px] text-[#8a919c]">{p.specialty}</div>
                        </div>
                        {sel ? (
                          <CheckCircle2 className="h-[22px] w-[22px] shrink-0 text-[#5847eb]" />
                        ) : (
                          <Circle className="h-[22px] w-[22px] shrink-0 text-[#d4d7de]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedProfessional && (
            <div>
              <h3 className="m-0 mb-0.5 text-[17px] font-extrabold tracking-[-.3px] text-[#171a1f]">Elegí un servicio</h3>
              <p className="m-0 mb-4.5 text-[13px] text-[#8a919c]">Servicios que ofrece {selectedProfessional.user.name}.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selectedProfessional.services.map((s) => {
                  const sel = serviceId === s.id;
                  const meta = CATEGORY_META[s.category];
                  const svcPrice = s.ProfessionalService.priceOverride ?? s.price;
                  const svcDuration = s.ProfessionalService.durationOverride ?? s.durationMinutes;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectService(s.id)}
                      className="flex items-center gap-3.5 rounded-[14px] border-[1.5px] p-[15px] text-left hover:border-[#cdd0f7] hover:bg-[#fbfbff]"
                      style={{ borderColor: sel ? '#5847eb' : '#eef0f2', background: sel ? '#f7f6ff' : '#fff' }}
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        <meta.icon className="h-[23px] w-[23px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-bold text-[#171a1f]">{s.name}</div>
                        <div className="mt-0.5 text-[12.5px] text-[#8a919c]">
                          {svcDuration} min · {formatMoney(svcPrice)}
                        </div>
                      </div>
                      {sel ? (
                        <CheckCircle2 className="h-[22px] w-[22px] shrink-0 text-[#5847eb]" />
                      ) : (
                        <Circle className="h-[22px] w-[22px] shrink-0 text-[#d4d7de]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && selectedProfessional && (
            <CalendarStep
              professionalName={selectedProfessional.user.name}
              todayKey={todayKey}
              monthOffset={monthOffset}
              setMonthOffset={setMonthOffset}
              date={date}
              onSelectDate={selectDate}
              slotsByKey={slotsByKey}
              professionalId={professionalId!}
              serviceId={serviceId!}
              loadingCalendar={loadingCalendar}
            />
          )}

          {step === 4 && (
            <div>
              <h3 className="m-0 mb-0.5 text-[17px] font-extrabold tracking-[-.3px] text-[#171a1f]">Elegí un horario</h3>
              <p className="m-0 mb-4.5 text-[13px] text-[#8a919c]">
                Horarios disponibles para el {date ? formatDayLabel(date) : 'día elegido'}.
              </p>
              {daySlots === undefined ? (
                <p className="text-sm text-[#8a919c]">Buscando horarios…</p>
              ) : daySlots.length === 0 ? (
                <p className="text-sm text-[#8a919c]">No hay horarios libres ese día. Volvé al paso anterior y elegí otra fecha.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5">
                  {daySlots.map((slot) => {
                    const sel = time === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => setTime(slot.startTime)}
                        className="rounded-[12px] border-[1.5px] py-3.5 text-center text-[14.5px] font-bold hover:border-[#cdd0f7]"
                        style={{
                          borderColor: sel ? '#5847eb' : '#eef0f2',
                          background: sel ? '#5847eb' : '#fff',
                          color: sel ? '#fff' : '#2b2f36',
                        }}
                      >
                        {slot.startTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 5 && selectedProfessional && selectedService && date && time && (
            <div>
              <h3 className="m-0 mb-0.5 text-[17px] font-extrabold tracking-[-.3px] text-[#171a1f]">Revisá y confirmá</h3>
              <p className="m-0 mb-4 text-[13px] text-[#8a919c]">Verificá que esté todo bien antes de reservar.</p>
              <div className="mb-4 flex items-start gap-3 rounded-[13px] border border-[#e0dcf7] bg-[#f7f6ff] p-4">
                <Calendar className="h-[22px] w-[22px] shrink-0 text-[#5847eb]" />
                <p className="m-0 text-[14.5px] leading-[1.55] font-semibold text-[#2b2f36]">
                  {selectedService.name} con {selectedProfessional.user.name}, el {formatSlashDate(date)} a las {time} hs.
                </p>
              </div>
              <div className="overflow-hidden rounded-[14px] border border-[#eef0f2]">
                <ReviewRow icon={User} label="Profesional" value={`${selectedProfessional.user.name} · ${selectedProfessional.specialty}`} onEdit={() => setStep(1)} />
                <ReviewRow icon={Stethoscope} label="Servicio" value={`${selectedService.name} · ${duration} min · ${formatMoney(price)}`} onEdit={() => setStep(2)} />
                <ReviewRow icon={Calendar} label="Fecha y hora" value={`${formatDayLabel(date)} · ${time} hs`} onEdit={() => setStep(3)} />
                <ReviewRow icon={MapPin} label="Lugar" value={CLINIC_ADDRESS} last />
              </div>
              <div className="mt-4">
                <label className="text-[12.5px] font-bold text-[#4b535e]">Notas para el profesional (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: vengo por una molestia en la muela superior derecha…"
                  rows={3}
                  className="mt-1.5 w-full rounded-[12px] border-[1.5px] border-[#eef0f2] px-3.5 py-3 text-[13px] text-[#171a1f] focus:border-[#5847eb] focus:outline-none"
                />
              </div>
              {bookingError && <p className="mt-3 text-sm text-red-600">{bookingError}</p>}
            </div>
          )}

          <div className="mt-[26px] flex items-center gap-2.5 border-t border-[#f0f1f3] pt-5">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 rounded-[11px] border border-[#eaecef] bg-white px-4 py-2.5 text-[13.5px] font-bold text-[#4b535e] hover:bg-[#f4f5f7]"
              >
                <ArrowLeft className="h-[19px] w-[19px]" />
                Atrás
              </button>
            )}
            <div className="ml-auto flex items-center gap-2.5">
              {!canAdvance(step) && (
                <span className="hidden text-[12.5px] text-[#a3a9b2] sm:inline">
                  {step === 1 && 'Elegí un profesional para continuar'}
                  {step === 2 && 'Elegí un servicio'}
                  {step === 3 && 'Elegí una fecha'}
                  {step === 4 && 'Elegí un horario'}
                </span>
              )}
              <button
                type="button"
                disabled={!canAdvance(step) || booking}
                onClick={() => (step === 5 ? handleConfirm() : setStep((s) => s + 1))}
                className="flex items-center gap-1.5 rounded-[11px] px-3 py-2.5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.6)] disabled:cursor-not-allowed disabled:opacity-70 sm:px-[18px]"
                style={{ background: canAdvance(step) ? '#5847eb' : '#c7c2f0' }}
              >
                {step === 5 ? (booking ? 'Confirmando…' : 'Confirmar turno') : 'Continuar'}
                {step === 5 ? <Check className="h-[19px] w-[19px]" /> : <ArrowRight className="h-[19px] w-[19px]" />}
              </button>
            </div>
          </div>
        </section>

        <aside className="overflow-hidden rounded-[18px] border border-[#eaecef] bg-white lg:sticky lg:top-0">
          <div className="flex items-center gap-2.5 border-b border-[#f0f1f3] px-[18px] py-3.5">
            <Receipt className="h-[21px] w-[21px] text-[#5847eb]" />
            <h3 className="m-0 text-[15px] font-extrabold tracking-[-.2px] text-[#171a1f]">Tu turno</h3>
          </div>
          <div className="flex flex-col gap-3.5 px-[18px] py-4">
            <SummaryRow icon={User} bg="#eaf7ef" color="#16a34a" label="Profesional" value={selectedProfessional?.user.name} />
            <SummaryRow icon={Stethoscope} bg="#eef0fe" color="#5847eb" label="Servicio" value={selectedService?.name} />
            <SummaryRow icon={Calendar} bg="#fef4e8" color="#d97706" label="Fecha" value={date ? formatDayLabel(date) : undefined} />
            <SummaryRow icon={Clock} bg="#fce8f3" color="#c2418a" label="Hora" value={time ?? undefined} />
          </div>
          <div className="flex items-center justify-between border-t border-[#f0f1f3] px-[18px] py-3.5">
            <span className="text-[13px] font-semibold text-[#6b7480]">{selectedService ? 'Valor consulta' : 'Elegí un servicio'}</span>
            <span className="text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">{price != null ? formatMoney(price) : '—'}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function formatDayLabel(dateKey: string): string {
  const d = utcMidnight(dateKey);
  return `${DOW3[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatSlashDate(dateKey: string): string {
  const d = utcMidnight(dateKey);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

interface CalendarStepProps {
  professionalName: string;
  todayKey: string;
  monthOffset: number;
  setMonthOffset: (fn: (o: number) => number) => void;
  date: string | null;
  onSelectDate: (k: string) => void;
  slotsByKey: Record<string, Slot[]>;
  professionalId: string;
  serviceId: string;
  loadingCalendar: boolean;
}

function CalendarStep({
  professionalName,
  todayKey,
  monthOffset,
  setMonthOffset,
  date,
  onSelectDate,
  slotsByKey,
  professionalId,
  serviceId,
  loadingCalendar,
}: CalendarStepProps) {
  const monthDate = monthAnchor(todayKey, monthOffset);
  const monthLabel = `${capitalize(MESES[monthDate.getUTCMonth()])} ${monthDate.getUTCFullYear()}`;
  const cells = buildCalendarCells(monthDate);

  return (
    <div>
      <h3 className="m-0 mb-0.5 text-[17px] font-extrabold tracking-[-.3px] text-[#171a1f]">Elegí una fecha</h3>
      <p className="m-0 mb-3.5 text-[13px] text-[#8a919c]">
        Disponibilidad de {professionalName} · podés reservar hasta con 3 meses de anticipación.
      </p>
      <div className="mb-3.5 flex items-center justify-between">
        <button
          type="button"
          disabled={monthOffset === 0}
          onClick={() => setMonthOffset((o) => o - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#eef0f2] bg-white text-[#4b535e] hover:bg-[#f4f5f7] disabled:cursor-not-allowed disabled:text-[#d4d7de]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-[15.5px] font-extrabold tracking-[-.2px] text-[#171a1f]">
          {monthLabel}
          {loadingCalendar && <span className="text-[11px] font-semibold text-[#a3a9b2]">cargando…</span>}
        </div>
        <button
          type="button"
          disabled={monthOffset === MAX_MONTH_OFFSET}
          onClick={() => setMonthOffset((o) => o + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#eef0f2] bg-white text-[#4b535e] hover:bg-[#f4f5f7] disabled:cursor-not-allowed disabled:text-[#d4d7de]"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {WEEKDAY_HEADER.map((w) => (
          <div key={w} className="text-center text-[11px] font-bold tracking-[.03em] text-[#9aa1ac] uppercase">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((k, i) => {
          if (k === null) return <div key={i} />;
          const past = k < todayKey;
          const slots = slotsByKey[slotKey(professionalId, serviceId, k)];
          const count = slots?.length ?? 0;
          const known = slots !== undefined;
          const selectable = !past && known && count > 0;
          const sel = date === k;
          const dotColor = past || !known ? 'transparent' : count === 0 ? '#d4d7de' : count <= 2 ? '#d97706' : '#16a34a';
          const dayNum = utcMidnight(k).getUTCDate();
          return (
            <button
              key={k}
              type="button"
              disabled={!selectable}
              onClick={() => onSelectDate(k)}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[11px] border-[1.5px] hover:border-[#cdd0f7]"
              style={{
                borderColor: sel ? '#5847eb' : selectable ? '#eef0f2' : '#f4f5f7',
                background: sel ? '#f7f6ff' : '#fff',
                opacity: past ? 0.4 : 1,
                cursor: selectable ? 'pointer' : 'not-allowed',
              }}
            >
              <span className="text-[14.5px] font-bold" style={{ color: sel ? '#5847eb' : past ? '#c3c8d0' : '#2b2f36' }}>
                {dayNum}
              </span>
              <span className="h-[5px] w-[5px] rounded-full" style={{ background: dotColor }} />
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11.5px] font-semibold text-[#8a919c] sm:gap-4.5">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#16a34a]" />
          Con turnos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#d97706]" />
          Pocos turnos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#d4d7de]" />
          Sin disponibilidad
        </span>
      </div>
    </div>
  );
}

function ReviewRow({
  icon: Icon,
  label,
  value,
  onEdit,
  last,
}: {
  icon: typeof User;
  label: string;
  value: string;
  onEdit?: () => void;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3.5 px-4 py-3.5 ${last ? '' : 'border-b border-[#f4f5f7]'}`}>
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#eef0fe] text-[#5847eb]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold tracking-[.04em] text-[#9aa1ac] uppercase">{label}</div>
        <div className="mt-0.5 text-[14px] font-bold text-[#171a1f]">{value}</div>
      </div>
      {onEdit && (
        <button type="button" onClick={onEdit} className="rounded-[9px] p-1.5 text-[#8a919c] hover:bg-[#f4f5f7]">
          <Edit className="h-[19px] w-[19px]" />
        </button>
      )}
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  bg,
  color,
  label,
  value,
}: {
  icon: typeof User;
  bg: string;
  color: string;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: bg, color }}>
        <Icon className="h-[19px] w-[19px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold tracking-[.04em] text-[#9aa1ac] uppercase">{label}</div>
        <div className="mt-px text-[13.5px] font-bold" style={{ color: value ? '#171a1f' : '#b8bec7' }}>
          {value ?? 'Por elegir'}
        </div>
      </div>
    </div>
  );
}
