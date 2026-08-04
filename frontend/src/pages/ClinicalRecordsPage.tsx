import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardPlus, Download, FileText, Search, Stethoscope, UserRound, Users } from 'lucide-react';
import * as clinicalRecordsApi from '../api/clinicalRecords';
import * as professionalsApi from '../api/professionals';
import { getErrorMessage } from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { getInitials } from '../lib/format';
import { avatarStyle } from '../lib/avatarColor';
import { specialtyMeta } from '../lib/specialty';
import { addDays, toDateKey } from '../lib/dates';
import type { ClinicalRecord, Professional } from '../types';

const DAY_FULL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function groupLabel(date: Date, today: Date, yesterday: Date): string {
  const key = toDateKey(date);
  if (key === toDateKey(today)) return 'Hoy';
  if (key === toDateKey(yesterday)) return 'Ayer';
  return `${DAY_FULL[date.getUTCDay()]} ${date.getUTCDate()} de ${MONTHS[date.getUTCMonth()]}`.replace(/^\w/, (c) =>
    c.toUpperCase()
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export function ClinicalRecordsPage() {
  const authUser = useAuthStore((s) => s.user);
  const isAdmin = authUser?.role === 'admin';

  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [proFilter, setProFilter] = useState('all');

  useEffect(() => {
    Promise.all([clinicalRecordsApi.listRecent(), isAdmin ? professionalsApi.list() : Promise.resolve([])])
      .then(([recs, pros]) => {
        setRecords(recs);
        setProfessionals(pros);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (isAdmin && proFilter !== 'all' && r.professionalId !== proFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!(r.patient?.name ?? '').toLowerCase().includes(q) && !r.content.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, isAdmin, proFilter, search]);

  const groups = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const yesterday = addDays(today, -1);
    const map = new Map<string, ClinicalRecord[]>();
    filtered.forEach((r) => {
      const label = groupLabel(new Date(r.createdAt), today, yesterday);
      map.set(label, [...(map.get(label) ?? []), r]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="p-7 text-sm text-red-600">{error}</p>;

  const patientsWithHistory = new Set(records.map((r) => r.patientId)).size;
  const weekAgo = Date.now() - 7 * 86400000;
  const thisWeekCount = records.filter((r) => new Date(r.createdAt).getTime() >= weekAgo).length;
  const lastRecord = records[0];

  return (
    <div className="px-[28px] pt-[26px] pb-[40px]">
      {/* PAGE HEADER */}
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
            <FileText className="h-[17px] w-[17px]" />
            Actividad clínica
          </div>
          <h2 className="mt-[7px] mb-[5px] text-[26px] font-extrabold tracking-[-.6px] text-[#171a1f]">
            Historias clínicas
          </h2>
          <p className="m-0 text-[14px] text-[#6b7480]">
            {isAdmin
              ? 'Notas clínicas registradas por todo el equipo, ordenadas por fecha.'
              : 'Tus notas clínicas registradas, ordenadas por fecha.'}
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-[7px] rounded-[11px] border border-[#eaecef] bg-white px-[15px] py-2.5 text-[13.5px] font-semibold text-[#4b535e] hover:bg-[#f4f5f7]"
        >
          <Download className="h-[19px] w-[19px]" />
          Exportar
        </button>
      </div>

      {/* KPI STRIP */}
      <div className="mb-[22px] grid grid-cols-4 gap-4">
        {[
          { icon: ClipboardPlus, value: String(records.length), label: 'Notas totales', bg: '#eef0fe', color: '#5847eb' },
          { icon: FileText, value: String(thisWeekCount), label: 'Esta semana', bg: '#fef4e8', color: '#d97706' },
          { icon: Users, value: String(patientsWithHistory), label: 'Pacientes con historia', bg: '#eef7f2', color: '#0f9d63' },
          {
            icon: Stethoscope,
            value: lastRecord ? timeAgo(lastRecord.createdAt) : '—',
            label: 'Último registro',
            bg: '#eaf7ef',
            color: '#16a34a',
          },
        ].map((k) => (
          <div key={k.label} className="flex items-center gap-3.5 rounded-2xl border border-[#eaecef] bg-white px-[18px] py-[17px]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: k.bg, color: k.color }}>
              <k.icon className="h-[23px] w-[23px]" />
            </span>
            <div>
              <div className="text-[23px] font-extrabold tracking-[-.6px] text-[#171a1f]">{k.value}</div>
              <div className="mt-[5px] text-[12.5px] font-semibold text-[#8a919c]">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] max-w-[360px] flex-1 items-center gap-2 rounded-[11px] border border-[#eaecef] bg-white px-[13px] py-2.5 text-[#9aa1ac]">
          <Search className="h-[19px] w-[19px] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por paciente o contenido…"
            className="w-full text-[13.5px] text-[#171a1f] placeholder:text-[#9aa1ac] focus:outline-none"
          />
        </div>
        {isAdmin && (
          <select
            value={proFilter}
            onChange={(e) => setProFilter(e.target.value)}
            className="h-[42px] rounded-[11px] border border-[#eaecef] bg-white px-3 text-[13px] font-semibold text-[#4b535e] focus:border-[#5847eb] focus:outline-none"
          >
            <option value="all">Todos los profesionales</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.user.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[#eaecef] bg-white py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef0fe] text-[#5847eb]">
            <FileText className="h-7 w-7" />
          </span>
          <p className="m-0 text-[14px] font-semibold text-[#4b535e]">Todavía no hay notas clínicas cargadas.</p>
          <p className="m-0 text-[13px] text-[#8a919c]">
            Las notas se registran desde el detalle de cada paciente, después de atenderlo.
          </p>
        </div>
      )}

      {/* TIMELINE */}
      <div className="flex flex-col gap-8">
        {groups.map(([label, items]) => (
          <div key={label}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-[13px] font-extrabold tracking-[-.2px] text-[#171a1f]">{label}</span>
              <span className="h-px flex-1 bg-[#eef0f2]" />
              <span className="text-[11.5px] font-bold text-[#9aa1ac]">
                {items.length} nota{items.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {items.map((r) => {
                const patientName = r.patient?.name ?? 'Paciente';
                const avatar = avatarStyle(r.patientId);
                const proMeta = specialtyMeta(r.professional?.specialty);
                const proColor = r.professional?.color ?? proMeta.color;
                return (
                  <div
                    key={r.id}
                    className="flex gap-4 rounded-[16px] border border-[#eaecef] bg-white p-4 pl-[18px] transition-[border-color,box-shadow] duration-150 hover:border-[#d7d4f7] hover:shadow-[0_10px_24px_-18px_rgba(88,71,235,.35)]"
                    style={{ borderLeft: `3px solid ${proColor}` }}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[14px] font-extrabold"
                      style={{ background: avatar.bg, color: avatar.color }}
                    >
                      {getInitials(patientName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <Link
                          to={`/pacientes/${r.patient?.id}`}
                          className="text-[14.5px] font-extrabold text-[#171a1f] hover:text-[#5847eb]"
                        >
                          {patientName}
                        </Link>
                        <span className="shrink-0 text-[11.5px] font-semibold text-[#a3a9b2]">
                          {timeLabel(r.createdAt)} · {timeAgo(r.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 mb-0 rounded-[12px] border border-[#f0f1f3] bg-[#fafbfc] px-3.5 py-3 text-[13px] leading-[1.55] text-[#4b535e]">
                        {r.content}
                      </p>
                      <div
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-[20px] px-[9px] py-[3px] text-[11.5px] font-bold"
                        style={{ background: proMeta.bg, color: proColor }}
                      >
                        <UserRound className="h-3.5 w-3.5" />
                        {r.professional?.user.name ?? 'Profesional'}
                        {r.professional?.specialty && <span className="opacity-70">· {r.professional.specialty}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
