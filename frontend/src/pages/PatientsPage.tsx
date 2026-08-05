import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CalendarCheck, Search, UserCheck, UserRound, UserX } from 'lucide-react';
import * as patientsApi from '../api/patients';
import { getErrorMessage } from '../api/client';
import { avatarStyle } from '../lib/avatarColor';
import { getInitials } from '../lib/format';
import type { PatientSummary } from '../types';

function lastVisitLabel(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace('.', '');
}

export function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    patientsApi
      .list()
      .then(setPatients)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [patients, search]);

  const activeCount = patients.filter((p) => p.active).length;
  const totalAppointments = patients.reduce((sum, p) => sum + p.appointmentsCount, 0);

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="p-7 text-sm text-red-600">{error}</p>;

  return (
    <div className="px-4 pt-5 pb-8 lg:px-[28px] lg:pt-[26px] lg:pb-[40px]">
      <div className="mb-[22px]">
        <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
          <UserRound className="h-[17px] w-[17px]" />
          Historial de la clínica
        </div>
        <h2 className="mt-[7px] mb-[5px] text-[21px] font-extrabold tracking-[-.6px] text-[#171a1f] sm:text-[26px]">Pacientes</h2>
        <p className="m-0 text-[14px] text-[#6b7480]">Historial y datos de contacto de tus pacientes.</p>
      </div>

      <div className="mb-[22px] grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { icon: UserRound, value: String(patients.length), label: 'Pacientes totales', bg: '#eef0fe', color: '#5847eb' },
          { icon: UserCheck, value: String(activeCount), label: 'Activos', bg: '#eaf7ef', color: '#16a34a' },
          { icon: UserX, value: String(patients.length - activeCount), label: 'Inactivos', bg: '#eef1f4', color: '#6b7480' },
          { icon: CalendarCheck, value: String(totalAppointments), label: 'Turnos acumulados', bg: '#fef4e8', color: '#d97706' },
        ].map((k) => (
          <div key={k.label} className="flex items-center gap-2.5 rounded-2xl border border-[#eaecef] bg-white px-3.5 py-3.5 sm:gap-3.5 sm:px-[18px] sm:py-[17px]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11" style={{ background: k.bg, color: k.color }}>
              <k.icon className="h-[19px] w-[19px] sm:h-[23px] sm:w-[23px]" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[18px] font-extrabold tracking-[-.6px] text-[#171a1f] sm:text-[23px]">{k.value}</div>
              <div className="mt-[3px] text-[11.5px] font-semibold text-[#8a919c] sm:mt-[5px] sm:text-[12.5px]">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-[11px] border border-[#eaecef] bg-white px-[13px] py-2.5 text-[#9aa1ac] sm:max-w-[360px]">
        <Search className="h-[19px] w-[19px] shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar paciente…"
          className="w-full text-[13.5px] text-[#171a1f] placeholder:text-[#9aa1ac] focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#8a919c]">
          {patients.length === 0 ? 'Todavía no hay pacientes con turnos registrados.' : 'No hay pacientes que coincidan con la búsqueda.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#eaecef] bg-white">
          <div className="hidden items-center gap-4 border-b border-[#f0f1f3] px-5 py-3 text-[11px] font-bold tracking-[.04em] text-[#9aa1ac] uppercase sm:flex">
            <span className="flex-1">Paciente</span>
            <span className="w-[150px] shrink-0">Teléfono</span>
            <span className="w-[110px] shrink-0">Turnos</span>
            <span className="w-[130px] shrink-0">Última visita</span>
            <span className="w-[90px] shrink-0">Estado</span>
            <span className="w-[70px] shrink-0 text-right">&nbsp;</span>
          </div>
          <div className="flex flex-col">
            {filtered.map((p) => {
              const avatar = avatarStyle(p.id);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 border-b border-[#f4f5f7] px-4 py-3.5 last:border-b-0 hover:bg-[#fafbfc] sm:flex-nowrap sm:gap-4 sm:px-5"
                  style={{ opacity: p.active ? 1 : 0.7 }}
                >
                  <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-1">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-[13px] font-bold"
                      style={{ background: avatar.bg, color: avatar.color }}
                    >
                      {getInitials(p.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-bold text-[#171a1f]">{p.name}</div>
                      <div className="truncate text-[12px] text-[#8a919c]">{p.email}</div>
                    </div>
                  </div>
                  <div className="hidden shrink-0 text-[13px] text-[#4b535e] sm:block sm:w-[150px]">{p.phone || '—'}</div>
                  <div className="shrink-0 sm:w-[110px]">
                    <span className="rounded-[20px] bg-[#eef0fe] px-[10px] py-[4px] text-[12px] font-bold text-[#5847eb]">
                      {p.appointmentsCount} turno{p.appointmentsCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 text-[12.5px] text-[#6b7480] sm:flex sm:w-[130px]">
                    <Calendar className="h-3.5 w-3.5 text-[#a3a9b2]" />
                    {lastVisitLabel(p.lastVisit)}
                  </div>
                  <div className="shrink-0 sm:w-[90px]">
                    <span
                      className="rounded-[20px] px-[10px] py-[4px] text-[11px] font-bold"
                      style={p.active ? { background: '#eaf7ef', color: '#16a34a' } : { background: '#eef1f4', color: '#98a0ab' }}
                    >
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="shrink-0 sm:w-[70px] sm:text-right">
                    <Link
                      to={`/pacientes/${p.id}`}
                      className="rounded-[9px] border border-[#eaecef] px-3 py-1.5 text-[12.5px] font-bold text-[#4b535e] hover:bg-[#f4f5f7]"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
