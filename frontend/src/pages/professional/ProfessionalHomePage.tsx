import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CalendarRange, Clock, FileText, PieChart, Stethoscope, UserRound, UserX } from 'lucide-react';
import * as appointmentsApi from '../../api/appointments';
import { getErrorMessage } from '../../api/client';
import { STATUS_META } from '../../lib/appointmentStatusMeta';
import { avatarStyle } from '../../lib/avatarColor';
import { addDaysKey, dateKeyOf } from '../../lib/dates';
import { formatLongDateLabel, formatTimeLabel, getInitials } from '../../lib/format';
import { useAuthStore } from '../../stores/authStore';
import type { Appointment } from '../../types';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function ProfessionalHomePage() {
  const user = useAuthStore((s) => s.user);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    appointmentsApi
      .listMine()
      .then(setAppointments)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  const todayAppts = useMemo(
    () => appointments.filter((a) => dateKeyOf(a.startDatetime) === todayKey && a.status !== 'cancelled'),
    [appointments, todayKey]
  );
  const completedToday = todayAppts.filter((a) => a.status === 'completed');
  const pendingToday = todayAppts.filter((a) => a.status === 'confirmed');

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

  const weekAppts = useMemo(() => {
    const endKey = addDaysKey(now, 6);
    return appointments.filter((a) => {
      const k = dateKeyOf(a.startDatetime);
      return k >= todayKey && k <= endKey && a.status !== 'cancelled';
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, todayKey]);

  const upcomingUnconfirmed = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'confirmed' && !a.confirmedByClient && dateKeyOf(a.startDatetime) >= todayKey)
        .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime))
        .slice(0, 4),
    [appointments, todayKey]
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

  const sortedTodayAppts = [...todayAppts].sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="p-7 text-sm text-red-600">{error}</p>;

  return (
    <div className="px-[28px] pt-[26px] pb-[40px]">
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
            <Calendar className="h-[17px] w-[17px]" />
            {formatLongDateLabel(now)}
          </div>
          <h2 className="mt-[7px] mb-[5px] text-[26px] font-extrabold tracking-[-.6px] text-[#171a1f]">Hola, {user?.name.split(' ')[0]} 👋</h2>
          <p className="m-0 text-[14px] text-[#6b7480]">
            Tenés <b className="text-[#171a1f]">{todayAppts.length} turnos</b>
            {pendingToday.length > 0 && (
              <>
                {' '}
                y <b className="text-[#171a1f]">{pendingToday.length} por atender</b>
              </>
            )}{' '}
            hoy.
          </p>
        </div>
        <Link
          to="/agenda"
          className="flex items-center gap-[7px] rounded-[11px] border border-[#eaecef] bg-white px-[15px] py-2.5 text-[13.5px] font-semibold text-[#4b535e] hover:bg-[#f4f5f7]"
        >
          <CalendarRange className="h-[19px] w-[19px]" />
          Ver agenda completa
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#eaecef] bg-white px-[18px] py-[17px]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef0fe] text-[#5847eb]">
            <Calendar className="h-[23px] w-[23px]" />
          </span>
          <div>
            <div className="text-[23px] font-extrabold tracking-[-.6px] text-[#171a1f]">{todayAppts.length}</div>
            <div className="mt-[5px] text-[12.5px] font-semibold text-[#8a919c]">Turnos hoy</div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#eaecef] bg-white px-[18px] py-[17px]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf7ef] text-[#16a34a]">
            <PieChart className="h-[23px] w-[23px]" />
          </span>
          <div>
            <div className="text-[23px] font-extrabold tracking-[-.6px] text-[#171a1f]">
              {completedToday.length}/{todayAppts.length}
            </div>
            <div className="mt-[5px] text-[12.5px] font-semibold text-[#8a919c]">Atendidos hoy</div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#eaecef] bg-white px-[18px] py-[17px]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fdecec] text-[#dc2626]">
            <UserX className="h-[23px] w-[23px]" />
          </span>
          <div>
            <div className="text-[23px] font-extrabold tracking-[-.6px] text-[#171a1f]">{ausentismoRate}%</div>
            <div className="mt-[5px] text-[12.5px] font-semibold text-[#8a919c]">Ausentismo (7 días)</div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#eaecef] bg-white px-[18px] py-[17px]">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fef4e8] text-[#d97706]">
            <CalendarRange className="h-[23px] w-[23px]" />
          </span>
          <div>
            <div className="text-[23px] font-extrabold tracking-[-.6px] text-[#171a1f]">{weekAppts.length}</div>
            <div className="mt-[5px] text-[12.5px] font-semibold text-[#8a919c]">Turnos esta semana</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1.7fr_1fr] items-start gap-5">
        <div className="flex flex-col gap-5">
          <section className="overflow-hidden rounded-[18px] border border-[#eaecef] bg-white">
            <div className="flex items-center gap-[11px] border-b border-[#f0f1f3] px-5 pt-[18px] pb-3.5">
              <Calendar className="h-[22px] w-[22px] text-[#5847eb]" />
              <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Agenda de hoy</h3>
              <span className="rounded-[20px] bg-[#eef0fe] px-[9px] py-[3px] text-[12px] font-bold text-[#5847eb]">
                {todayAppts.length} turnos
              </span>
            </div>
            <div className="flex flex-col">
              {sortedTodayAppts.length === 0 && <p className="px-5 py-6 text-sm text-[#8a919c]">No tenés turnos hoy.</p>}
              {sortedTodayAppts.map((a) => {
                const start = new Date(a.startDatetime);
                const end = new Date(a.endDatetime);
                const isNow = a.status === 'confirmed' && start <= now && now <= end;
                const meta = STATUS_META[a.status];
                const clientName = a.client?.name ?? 'Cliente';
                const avatar = avatarStyle(a.client?.id ?? clientName);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-[15px] border-b border-[#f4f5f7] px-5 py-[13px] last:border-b-0 hover:bg-[#fafbfc]"
                    style={{ borderLeft: `3px solid ${isNow ? '#5847eb' : meta.color}` }}
                  >
                    <div className="w-[62px] shrink-0 text-center">
                      <div className="text-[15px] font-extrabold tracking-[-.3px] text-[#171a1f]">{formatTimeLabel(start)}</div>
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
                        {a.service?.name ?? 'Servicio'}
                      </div>
                    </div>
                    <span
                      className="rounded-[20px] px-[11px] py-[5px] text-[12px] font-bold whitespace-nowrap"
                      style={{ background: meta.tint, color: meta.color }}
                    >
                      {isNow ? 'En curso' : meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

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
                  <span className="text-[11.5px] font-bold" style={{ color: t.isToday ? '#5847eb' : '#a3a9b2' }}>
                    {t.day}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 pt-[18px] pb-5">
            <h3 className="mt-0 mb-3.5 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Accesos rápidos</h3>
            <div className="grid grid-cols-2 gap-[11px]">
              {[
                { icon: CalendarRange, label: 'Agenda', bg: '#eef0fe', color: '#5847eb', to: '/agenda' },
                { icon: Clock, label: 'Disponibilidad', bg: '#eaf7ef', color: '#16a34a', to: '/profesional/disponibilidad' },
                { icon: UserRound, label: 'Pacientes', bg: '#fef4e8', color: '#d97706', to: '/pacientes' },
                { icon: FileText, label: 'Historias clínicas', bg: '#eef7f2', color: '#0f9d63', to: '/historias-clinicas' },
              ].map((qa) => (
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

          <section className="rounded-[18px] border border-[#eaecef] bg-white px-5 py-[18px]">
            <div className="mb-[13px] flex items-center justify-between">
              <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Turnos sin confirmar</h3>
              {upcomingUnconfirmed.length > 0 && (
                <span className="rounded-[20px] bg-[#fef4e8] px-[9px] py-[3px] text-[12px] font-bold text-[#d97706]">
                  {upcomingUnconfirmed.length}
                </span>
              )}
            </div>
            {upcomingUnconfirmed.length === 0 ? (
              <p className="text-[13px] text-[#8a919c]">Todos tus próximos turnos están confirmados.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {upcomingUnconfirmed.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-[13px] border border-[#f0f1f3] p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#fef4e8] text-[#d97706]">
                      <Clock className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-bold text-[#171a1f]">{a.client?.name ?? 'Cliente'}</div>
                      <div className="mt-px text-[12px] text-[#8a919c]">
                        {a.service?.name} ·{' '}
                        {new Date(a.startDatetime).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '')}{' '}
                        {formatTimeLabel(new Date(a.startDatetime))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
