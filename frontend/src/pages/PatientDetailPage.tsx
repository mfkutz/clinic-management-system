import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ClipboardPlus,
  FileText,
  Mail,
  Phone,
  Send,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import * as clinicalRecordsApi from '../api/clinicalRecords';
import { getErrorMessage } from '../api/client';
import * as patientsApi from '../api/patients';
import { STATUS_META } from '../lib/appointmentStatusMeta';
import { avatarStyle } from '../lib/avatarColor';
import { getInitials } from '../lib/format';
import { useAuthStore } from '../stores/authStore';
import type { ClinicalRecord, PatientDetail } from '../types';

function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).replace('.', '');
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
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

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const role = useAuthStore((s) => s.user?.role);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([patientsApi.getById(id), clinicalRecordsApi.listForPatient(id)])
      .then(([patientData, recordsData]) => {
        setPatient(patientData);
        setRecords(recordsData);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setNoteError(null);
    setSavingNote(true);
    try {
      const created = await clinicalRecordsApi.createForPatient(id, noteContent);
      setRecords((prev) => [created, ...prev]);
      setNoteContent('');
    } catch (err) {
      setNoteError(getErrorMessage(err));
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="p-7 text-sm text-red-600">{error}</p>;
  if (!patient) return null;

  const avatar = avatarStyle(patient.id);
  const completedVisits = patient.appointments.filter((a) => a.status === 'completed');
  const lastVisit = completedVisits[0] ?? null; // ya vienen ordenados desc por startDatetime
  const upcoming = patient.appointments.filter((a) => a.status === 'confirmed').length;

  return (
    <div className="px-4 pt-5 pb-8 lg:px-[28px] lg:pt-[26px] lg:pb-[40px]">
      <Link
        to="/pacientes"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5847eb] hover:text-[#4636cf]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Pacientes
      </Link>

      {/* HEADER CARD */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-[20px] border border-[#eaecef] bg-white p-4 sm:gap-5 sm:p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-[21px] font-extrabold"
          style={{ background: avatar.bg, color: avatar.color }}
        >
          {getInitials(patient.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h2 className="m-0 text-[21px] font-extrabold tracking-[-.4px] text-[#171a1f]">{patient.name}</h2>
            <span
              className="rounded-[20px] px-[9px] py-[3px] text-[11px] font-bold"
              style={patient.active ? { background: '#eaf7ef', color: '#16a34a' } : { background: '#eef1f4', color: '#98a0ab' }}
            >
              {patient.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[12.5px] text-[#8a919c]">
            <span className="flex items-center gap-1.5">
              <Mail className="h-[15px] w-[15px]" />
              {patient.email}
            </span>
            {patient.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-[15px] w-[15px]" />
                {patient.phone}
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full items-center rounded-[14px] border border-[#f0f1f3] bg-[#fbfbfc] py-3 sm:w-auto">
          <div className="flex-1 text-center sm:w-[100px] sm:flex-none">
            <div className="text-[18px] font-extrabold text-[#5847eb]">{patient.appointments.length}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-[#9aa1ac]">Turnos totales</div>
          </div>
          <div className="flex-1 border-l border-[#eef0f2] text-center sm:w-[100px] sm:flex-none">
            <div className="text-[18px] font-extrabold text-[#171a1f]">{upcoming}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-[#9aa1ac]">Próximos</div>
          </div>
          <div className="flex-1 border-l border-[#eef0f2] text-center sm:w-[130px] sm:flex-none">
            <div className="text-[18px] font-extrabold text-[#16a34a]">{lastVisit ? shortDate(lastVisit.startDatetime) : '—'}</div>
            <div className="mt-0.5 text-[11px] font-semibold text-[#9aa1ac]">Última visita</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* HISTORIAL DE TURNOS */}
        <section className="rounded-[18px] border border-[#eaecef] bg-white p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <Calendar className="h-[19px] w-[19px] text-[#5847eb]" />
            <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Historial de turnos</h3>
          </div>

          {patient.appointments.length === 0 ? (
            <p className="text-[13px] text-[#8a919c]">Sin turnos registrados.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {patient.appointments.map((a) => {
                const statusMeta = STATUS_META[a.status];
                return (
                  <div
                    key={a.id}
                    className="flex flex-col gap-3 rounded-[13px] border border-[#f0f1f3] p-4 sm:flex-row sm:items-start sm:py-3"
                    style={{ borderLeft: `3px solid ${statusMeta.color}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-bold text-[#171a1f]">{a.service?.name ?? 'Servicio'}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#8a919c]">
                        <UserRound className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {a.professional?.user.name ?? 'Profesional'}
                          {a.professional?.specialty && ` · ${a.professional.specialty}`}
                        </span>
                      </div>
                      {a.notes && <p className="mt-1.5 text-[12px] text-[#a3a9b2] italic">"{a.notes}"</p>}
                      {a.status === 'cancelled' && a.cancellationReason && (
                        <p className="mt-1.5 text-[12px] text-[#dc2626] italic">Motivo: {a.cancellationReason}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:flex-col sm:items-end sm:gap-0 sm:text-right">
                      <div>
                        <div className="text-[12.5px] font-bold text-[#4b535e]">{fullDate(a.startDatetime)}</div>
                        <div className="mt-0.5 text-[11.5px] font-semibold text-[#a3a9b2]">{timeLabel(a.startDatetime)}</div>
                      </div>
                      <span
                        className="shrink-0 rounded-[20px] px-[10px] py-[4px] text-[11px] font-bold sm:mt-2"
                        style={{ background: statusMeta.tint, color: statusMeta.color }}
                      >
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* HISTORIA CLÍNICA */}
        <section className="rounded-[18px] border border-[#eaecef] bg-white p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <FileText className="h-[19px] w-[19px] text-[#5847eb]" />
            <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Historia clínica</h3>
            <span className="ml-auto rounded-[20px] bg-[#eef0fe] px-[9px] py-[3px] text-[11.5px] font-bold text-[#5847eb]">
              {records.length}
            </span>
          </div>

          {role === 'professional' && (
            <form onSubmit={handleAddNote} className="mb-4 flex flex-col gap-2.5">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Agregar una nota clínica…"
                rows={3}
                className="min-h-[76px] w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] text-[#171a1f] focus:border-[#5847eb] focus:bg-white focus:outline-none"
              />
              {noteError && <p className="text-xs text-red-600">{noteError}</p>}
              <button
                type="submit"
                disabled={savingNote || noteContent.trim().length < 3}
                className="flex items-center justify-center gap-2 self-end rounded-[11px] bg-[#5847eb] px-4 py-2 text-[13px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.6)] hover:bg-[#4636cf] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {savingNote ? 'Guardando…' : 'Agregar nota'}
              </button>
            </form>
          )}

          {records.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[14px] bg-[#fbfbfc] py-10 text-center">
              <ClipboardPlus className="h-6 w-6 text-[#c3c8d0]" />
              <p className="m-0 text-[13px] text-[#8a919c]">Sin notas clínicas todavía.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="rounded-[13px] border border-[#f0f1f3] p-3.5"
                  style={{ borderLeft: `3px solid ${r.professional?.color ?? '#5847eb'}` }}
                >
                  <p className="m-0 text-[13px] leading-[1.55] text-[#4b535e]">{r.content}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11.5px] font-semibold text-[#8a919c]">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {r.professional?.user.name ?? 'Profesional'}
                    <span className="text-[#c3c8d0]">·</span>
                    {timeAgo(r.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
