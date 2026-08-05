import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Download,
  Edit2,
  Grid2x2,
  Info,
  List,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Stethoscope,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import * as professionalsApi from '../../api/professionals';
import * as servicesApi from '../../api/services';
import * as appointmentsApi from '../../api/appointments';
import { getErrorMessage } from '../../api/client';
import { getInitials } from '../../lib/format';
import { addDays, dateKeyOf, toDateKey } from '../../lib/dates';
import { specialtyMeta, SPECIALTY_PRESETS } from '../../lib/specialty';
import type { Appointment, Professional, Service } from '../../types';
import {
  createProfessionalSchema,
  type CreateProfessionalFormValues,
  type UpdateProfessionalFormValues,
} from '../../validation/adminSchemas';
import { CATEGORY_META } from '../../lib/serviceCategory';

const AVATAR_ROTATION = ['#5847eb', '#059669', '#db2777', '#d97706', '#0891b2', '#7c4dcb', '#2477c9'];

function mondayOfWeek(date: Date): Date {
  const dow = date.getUTCDay();
  return addDays(date, dow === 0 ? -6 : 1 - dow);
}

type ViewMode = 'grid' | 'list';
type FormMode = { mode: 'create' } | { mode: 'edit'; professional: Professional } | null;

interface FormPanelProps {
  state: Exclude<FormMode, null>;
  services: Service[];
  onCreate: (values: CreateProfessionalFormValues, serviceIds: string[]) => Promise<void>;
  onUpdate: (id: string, values: UpdateProfessionalFormValues) => Promise<void>;
  onClose: () => void;
}

function FormPanel({ state, services, onCreate, onUpdate, onClose }: FormPanelProps) {
  const isEdit = state.mode === 'edit';
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProfessionalFormValues>({
    resolver: isEdit ? undefined : zodResolver(createProfessionalSchema),
    defaultValues: isEdit
      ? { name: state.professional.user.name, specialty: state.professional.specialty ?? '', bio: state.professional.bio ?? '' }
      : { specialty: '' },
  });
  const specialty = watch('specialty');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(values: CreateProfessionalFormValues) {
    if (isEdit) {
      await onUpdate(state.professional.id, { specialty: values.specialty, bio: values.bio });
    } else {
      await onCreate(values, selectedServiceIds);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[rgba(23,26,31,.34)] backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={handleSubmit(submit)}
        className="relative flex h-full w-[460px] max-w-[94vw] flex-col bg-white shadow-[-24px_0_60px_-30px_rgba(23,26,31,.4)]"
      >
        <div className="flex items-center gap-3 border-b border-[#eef0f2] px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#eef0fe] text-[#5847eb]">
            <UserPlus className="h-[21px] w-[21px]" />
          </span>
          <div className="flex-1">
            <h3 className="m-0 text-[17px] font-extrabold tracking-[-.3px] text-[#171a1f]">
              {isEdit ? `Editar a ${state.professional.user.name}` : 'Nuevo profesional'}
            </h3>
            <p className="mt-0.5 mb-0 text-[12.5px] text-[#8a919c]">
              {isEdit ? 'Actualizá especialidad y biografía.' : 'Sumá un integrante al equipo de la clínica.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#eef0f2] bg-white text-[#6b7480] hover:bg-[#f4f5f7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-[18px] overflow-auto px-6 py-[22px]">
          {!isEdit && (
            <div className="flex items-center gap-3.5 rounded-[14px] border border-[#f0f1f3] bg-[#fbfbfc] px-4 py-3.5">
              <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#eef0fe] text-[#5847eb]">
                <UserPlus className="h-6 w-6" />
              </span>
              <div>
                <div className="text-[13.5px] font-bold text-[#171a1f]">Foto de perfil</div>
                <div className="mt-0.5 text-[12px] text-[#8a919c]">Opcional · JPG o PNG hasta 2 MB</div>
              </div>
            </div>
          )}

          {isEdit ? (
            <div className="grid grid-cols-1 gap-3.5 text-[13.5px] sm:grid-cols-2">
              <div>
                <div className="mb-[7px] text-[12.5px] font-bold text-[#4b535e]">Nombre</div>
                <div className="rounded-[11px] border border-[#eef0f2] bg-[#f4f5f7] px-[13px] py-[11px] text-[#8a919c]">
                  {state.professional.user.name}
                </div>
              </div>
              <div>
                <div className="mb-[7px] text-[12.5px] font-bold text-[#4b535e]">Email</div>
                <div className="truncate rounded-[11px] border border-[#eef0f2] bg-[#f4f5f7] px-[13px] py-[11px] text-[#8a919c]">
                  {state.professional.user.email}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">Nombre completo</label>
                <input
                  className="w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] focus:border-[#5847eb] focus:bg-white focus:outline-none"
                  {...register('name')}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">Email</label>
                <input
                  type="email"
                  className="w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] focus:border-[#5847eb] focus:bg-white focus:outline-none"
                  {...register('email')}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">Contraseña</label>
                <input
                  type="password"
                  className="w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] focus:border-[#5847eb] focus:bg-white focus:outline-none"
                  {...register('password')}
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>
              <div>
                <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">
                  Teléfono <span className="font-medium text-[#b8bec7]">(opcional)</span>
                </label>
                <input
                  className="w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] focus:border-[#5847eb] focus:bg-white focus:outline-none"
                  {...register('phone')}
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">
              Especialidad <span className="font-medium text-[#b8bec7]">(opcional)</span>
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {SPECIALTY_PRESETS.map((s) => {
                const active = specialty === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue('specialty', s)}
                    className="rounded-[9px] border px-3 py-[7px] text-[12.5px] font-bold"
                    style={
                      active
                        ? { background: '#eef0fe', color: '#5847eb', borderColor: '#d7d4f7' }
                        : { background: '#fff', color: '#6b7480', borderColor: '#eaecef' }
                    }
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <input
              className="w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] focus:border-[#5847eb] focus:bg-white focus:outline-none"
              placeholder="O escribí una especialidad personalizada"
              {...register('specialty')}
            />
          </div>

          <div>
            <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">
              Bio <span className="font-medium text-[#b8bec7]">(opcional)</span>
            </label>
            <textarea
              className="min-h-[64px] w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] focus:border-[#5847eb] focus:bg-white focus:outline-none"
              {...register('bio')}
            />
          </div>

          {!isEdit && (
            <div>
              <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">
                Servicios que atiende <span className="font-medium text-[#b8bec7]">(opcional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {services
                  .filter((s) => s.active)
                  .map((s) => {
                    const meta = CATEGORY_META[s.category];
                    const active = selectedServiceIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className="inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-[7px] text-[12.5px] font-bold"
                        style={
                          active
                            ? { background: '#eef0fe', color: '#5847eb', borderColor: '#d7d4f7' }
                            : { background: '#fff', color: '#6b7480', borderColor: '#eaecef' }
                        }
                      >
                        <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: meta.color }} />
                        {s.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2.5 border-t border-[#eef0f2] px-6 py-[18px]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[11px] border border-[#eaecef] bg-white py-[11px] text-[13.5px] font-bold text-[#4b535e] hover:bg-[#f4f5f7]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[1.4] rounded-[11px] bg-[#5847eb] py-[11px] text-[13.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.6)] hover:bg-[#4636cf] disabled:opacity-60"
          >
            {isEdit ? 'Guardar cambios' : 'Crear profesional'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface StatsEntry {
  today: number;
  week: number;
}

interface ProCardProps {
  professional: Professional;
  stats: StatsEntry;
  occupancyPct: number | null;
  availableToAdd: Service[];
  addOpen: boolean;
  busy: boolean;
  onOpenAdd: () => void;
  onAddService: (serviceId: string) => void;
  onRemoveService: (serviceId: string) => void;
  onEdit: () => void;
  onToggleActive: () => void;
}

function ProCard({
  professional: p,
  stats,
  occupancyPct,
  availableToAdd,
  addOpen,
  busy,
  onOpenAdd,
  onAddService,
  onRemoveService,
  onEdit,
  onToggleActive,
}: ProCardProps) {
  const meta = specialtyMeta(p.specialty);
  return (
    <div
      onClick={onEdit}
      className="flex cursor-pointer flex-col gap-4 rounded-[20px] border border-[#eaecef] bg-white p-5 transition-[border-color,box-shadow,transform] duration-[.18s] hover:-translate-y-0.5 hover:border-[#d7d4f7] hover:shadow-[0_16px_34px_-22px_rgba(88,71,235,.45)]"
      style={{ opacity: p.active ? 1 : 0.62 }}
    >
      <div className="flex items-start gap-3.5">
        <div className="relative shrink-0">
          <div
            className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl text-[19px] font-extrabold text-white"
            style={{ background: p.color }}
          >
            {getInitials(p.user.name)}
          </div>
          <span
            className="absolute -right-0.5 -bottom-0.5 h-[15px] w-[15px] rounded-full border-[2.5px] border-white"
            style={{ background: p.active ? '#16a34a' : '#c3c8d0' }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[16.5px] font-extrabold tracking-[-.3px] text-[#171a1f]">{p.user.name}</span>
            <span
              className="shrink-0 rounded-[20px] px-[9px] py-[3px] text-[11px] font-bold"
              style={p.active ? { background: '#eaf7ef', color: '#16a34a' } : { background: '#eef1f4', color: '#98a0ab' }}
            >
              {p.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {p.specialty && (
            <div
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-[20px] px-[10px] py-[3px] text-[11.5px] font-bold"
              style={{ background: meta.bg, color: meta.color }}
            >
              <meta.icon className="h-3.5 w-3.5" />
              {p.specialty}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-1.5 truncate text-[12.5px] text-[#8a919c]">
            <Mail className="h-[15px] w-[15px] shrink-0" />
            <span className="truncate">{p.user.email}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border border-[#eef0f2] text-[#9aa1ac] opacity-55 hover:opacity-100"
        >
          <MoreHorizontal className="h-[19px] w-[19px]" />
        </button>
      </div>

      <div className="flex items-center rounded-[14px] border border-[#f0f1f3] bg-[#fbfbfc] py-3">
        <div className="flex-1 text-center">
          <div className="text-[16px] font-extrabold text-[#5847eb]">{stats.today}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-[#9aa1ac]">Turnos hoy</div>
        </div>
        <div className="flex-1 border-l border-[#eef0f2] text-center">
          <div className="text-[16px] font-extrabold text-[#171a1f]">{stats.week}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-[#9aa1ac]">Esta semana</div>
        </div>
        <div className="flex-1 border-l border-[#eef0f2] text-center">
          <div className="text-[16px] font-extrabold text-[#16a34a]">{occupancyPct != null ? `${occupancyPct}%` : '—'}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-[#9aa1ac]">Ocupación</div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[.06em] text-[#9aa1ac] uppercase">Servicios que atiende</span>
          <span className="text-[11.5px] font-bold text-[#5847eb]">
            {p.services.length} servicio{p.services.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex flex-wrap gap-[7px]" onClick={(e) => e.stopPropagation()}>
          {p.services.map((s) => {
            const catMeta = CATEGORY_META[s.category];
            return (
              <span
                key={s.id}
                className="group inline-flex items-center gap-[6px] rounded-[9px] border border-[#eef0f2] bg-[#f4f5f7] px-[11px] py-[6px] text-[12px] font-semibold text-[#4b535e]"
              >
                <span className="inline-block h-[7px] w-[7px] rounded-full" style={{ background: catMeta.color }} />
                {s.name}
                <button
                  type="button"
                  onClick={() => onRemoveService(s.id)}
                  disabled={busy}
                  className="text-[#b8bec7] opacity-0 group-hover:opacity-100 hover:text-[#dc2626]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
          {addOpen ? (
            <select
              autoFocus
              disabled={busy}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) onAddService(e.target.value);
              }}
              className="rounded-[9px] border border-[#d7d4f7] bg-white px-2 py-[6px] text-[12px] font-semibold text-[#4b535e] focus:outline-none"
            >
              <option value="" disabled>
                Elegir servicio…
              </option>
              {availableToAdd.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={onOpenAdd}
              disabled={availableToAdd.length === 0}
              className="inline-flex items-center gap-[5px] rounded-[9px] border border-dashed border-[#d3d7dd] bg-white px-[11px] py-[6px] text-[12px] font-bold text-[#8a919c] hover:border-[#d7d4f7] hover:bg-[#eef0fe] hover:text-[#5847eb] disabled:opacity-50"
            >
              <Plus className="h-[15px] w-[15px]" />
              Agregar
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-[9px] border-t border-[#f4f5f7] pt-[15px]" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] border border-[#eaecef] bg-white py-[9px] text-[13px] font-bold text-[#4b535e] hover:bg-[#f4f5f7]"
        >
          <Edit2 className="h-[17px] w-[17px]" />
          Editar
        </button>
        <Link
          to={`/agenda?profesional=${p.id}`}
          className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] border border-[#eaecef] bg-white py-[9px] text-[13px] font-bold text-[#4b535e] hover:bg-[#f4f5f7]"
        >
          <CalendarDays className="h-[17px] w-[17px]" />
          Agenda
        </Link>
        <button
          type="button"
          onClick={onToggleActive}
          disabled={busy}
          className="flex shrink-0 items-center justify-center gap-[7px] rounded-[10px] border border-[#eaecef] bg-white px-3 py-[9px] text-[13px] font-bold text-[#6b7480] hover:border-[#f4cdcd] hover:bg-[#fdf0f0] hover:text-[#dc2626] disabled:opacity-60"
        >
          {p.active ? <ToggleRight className="h-[17px] w-[17px]" /> : <ToggleLeft className="h-[17px] w-[17px]" />}
        </button>
      </div>
    </div>
  );
}

export function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('Todos');
  const [view, setView] = useState<ViewMode>('grid');
  const [form, setForm] = useState<FormMode>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addOpenId, setAddOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  function load() {
    setLoading(true);
    Promise.all([professionalsApi.listAll(), servicesApi.listAll(), appointmentsApi.listMine()])
      .then(([profs, servs, appts]) => {
        setProfessionals(profs);
        setServices(servs);
        setAppointments(appts);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }

  const statsByProfessional = useMemo(() => {
    const map = new Map<string, StatsEntry>();
    const today = toDateKey(new Date());
    const monday = mondayOfWeek(new Date());
    const weekStart = toDateKey(monday);
    const weekEnd = toDateKey(addDays(monday, 5));
    appointments.forEach((a) => {
      if (a.status === 'cancelled') return;
      const key = dateKeyOf(a.startDatetime);
      const entry = map.get(a.professionalId) ?? { today: 0, week: 0 };
      if (key === today) entry.today += 1;
      if (key >= weekStart && key <= weekEnd) entry.week += 1;
      map.set(a.professionalId, entry);
    });
    return map;
  }, [appointments]);

  const maxWeekCount = Math.max(1, ...Array.from(statsByProfessional.values()).map((s) => s.week));
  const weekTotal = Array.from(statsByProfessional.values()).reduce((sum, s) => sum + s.week, 0);

  const specialtyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    professionals.forEach((p) => {
      if (p.specialty) counts.set(p.specialty, (counts.get(p.specialty) ?? 0) + 1);
    });
    return counts;
  }, [professionals]);
  const inactiveCount = professionals.filter((p) => !p.active).length;

  const filtered = useMemo(() => {
    return professionals.filter((p) => {
      if (filter === 'Inactivos') {
        if (p.active) return false;
      } else if (filter !== 'Todos' && p.specialty !== filter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!p.user.name.toLowerCase().includes(q) && !(p.specialty ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [professionals, filter, search]);

  async function handleCreate(values: CreateProfessionalFormValues, serviceIds: string[]) {
    setError(null);
    const color = AVATAR_ROTATION[professionals.length % AVATAR_ROTATION.length];
    const created = await professionalsApi.create({ ...values, color });
    for (const serviceId of serviceIds) {
      await professionalsApi.addService(created.id, { serviceId });
    }
    setForm(null);
    showToast(`${values.name} agregado al equipo`);
    load();
  }

  async function handleUpdate(id: string, values: UpdateProfessionalFormValues) {
    setError(null);
    const updated = await professionalsApi.update(id, values);
    setProfessionals((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    setForm(null);
    showToast('Perfil actualizado');
  }

  async function toggleActive(p: Professional) {
    setBusyId(p.id);
    setError(null);
    try {
      const updated = await professionalsApi.update(p.id, { active: !p.active });
      setProfessionals((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: updated.active } : x)));
      showToast(`${p.user.name} ${updated.active ? 'activado' : 'desactivado'}`);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddService(professionalId: string, serviceId: string) {
    setBusyId(professionalId);
    setAddOpenId(null);
    setError(null);
    try {
      await professionalsApi.addService(professionalId, { serviceId });
      const service = services.find((s) => s.id === serviceId);
      setProfessionals((prev) =>
        prev.map((p) =>
          p.id === professionalId && service
            ? {
                ...p,
                services: [
                  ...p.services,
                  { ...service, ProfessionalService: { id: '', professionalId, serviceId, priceOverride: null, durationOverride: null } },
                ],
              }
            : p
        )
      );
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveService(professionalId: string, serviceId: string) {
    setBusyId(professionalId);
    setError(null);
    try {
      await professionalsApi.removeService(professionalId, serviceId);
      setProfessionals((prev) =>
        prev.map((p) => (p.id === professionalId ? { ...p, services: p.services.filter((s) => s.id !== serviceId) } : p))
      );
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;

  return (
    <div className="px-4 pt-5 pb-8 lg:px-[28px] lg:pt-[26px] lg:pb-[40px]">
      {form && (
        <FormPanel state={form} services={services} onCreate={handleCreate} onUpdate={handleUpdate} onClose={() => setForm(null)} />
      )}

      {/* PAGE HEADER */}
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
            <Users className="h-[17px] w-[17px]" />
            Equipo de la clínica
          </div>
          <h2 className="mt-[7px] mb-[5px] text-[26px] font-extrabold tracking-[-.6px] text-[#171a1f]">Profesionales</h2>
          <p className="m-0 text-[14px] text-[#6b7480]">
            Gestioná el equipo, sus especialidades y los servicios que atiende cada uno.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            className="flex items-center gap-[7px] rounded-[11px] border border-[#eaecef] bg-white px-[15px] py-2.5 text-[13.5px] font-semibold text-[#4b535e] hover:bg-[#f4f5f7]"
          >
            <Download className="h-[19px] w-[19px]" />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => setForm({ mode: 'create' })}
            className="flex items-center gap-[7px] rounded-[11px] bg-[#5847eb] px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.6)] hover:bg-[#4636cf]"
          >
            <UserPlus className="h-[19px] w-[19px]" />
            Nuevo profesional
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* KPI STRIP */}
      <div className="mb-[22px] grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { icon: Users, value: String(professionals.length), label: 'Profesionales', bg: '#eef0fe', color: '#5847eb' },
          { icon: CheckCircle2, value: String(professionals.length - inactiveCount), label: 'Activos', bg: '#eaf7ef', color: '#16a34a' },
          { icon: Calendar, value: String(weekTotal), label: 'Turnos esta semana', bg: '#fef4e8', color: '#d97706' },
          { icon: Stethoscope, value: String(specialtyCounts.size), label: 'Especialidades', bg: '#eef7f2', color: '#0f9d63' },
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

      {/* TOOLBAR */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] max-w-[360px] flex-1 items-center gap-2 rounded-[11px] border border-[#eaecef] bg-white px-[13px] py-2.5 text-[#9aa1ac]">
          <Search className="h-[19px] w-[19px] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o especialidad…"
            className="w-full text-[13.5px] text-[#171a1f] placeholder:text-[#9aa1ac] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('Todos')}
            className="inline-flex items-center gap-1.5 rounded-[10px] border px-[13px] py-2 text-[13px] font-semibold"
            style={
              filter === 'Todos'
                ? { background: '#5847eb', color: '#fff', borderColor: '#5847eb' }
                : { background: '#fff', color: '#4b535e', borderColor: '#eaecef' }
            }
          >
            Todos
            <span className="text-[11.5px] font-bold opacity-70">{professionals.length}</span>
          </button>
          {Array.from(specialtyCounts.entries()).map(([spec, count]) => {
            const meta = specialtyMeta(spec);
            const active = filter === spec;
            return (
              <button
                key={spec}
                type="button"
                onClick={() => setFilter(spec)}
                className="inline-flex items-center gap-1.5 rounded-[10px] border px-[13px] py-2 text-[13px] font-semibold hover:border-[#d7d4f7] hover:bg-[#eef0fe] hover:text-[#5847eb]"
                style={
                  active
                    ? { background: '#eef0fe', color: '#5847eb', borderColor: '#d7d4f7' }
                    : { background: '#fff', color: '#4b535e', borderColor: '#eaecef' }
                }
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: meta.color }} />
                {spec}
                <span className="text-[11.5px] font-bold opacity-70">{count}</span>
              </button>
            );
          })}
          {inactiveCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('Inactivos')}
              className="inline-flex items-center gap-1.5 rounded-[10px] border px-[13px] py-2 text-[13px] font-semibold hover:border-[#d7d4f7] hover:bg-[#eef0fe] hover:text-[#5847eb]"
              style={
                filter === 'Inactivos'
                  ? { background: '#eef0fe', color: '#5847eb', borderColor: '#d7d4f7' }
                  : { background: '#fff', color: '#4b535e', borderColor: '#eaecef' }
              }
            >
              <span className="inline-block h-2 w-2 rounded-full bg-[#c3c8d0]" />
              Inactivos
              <span className="text-[11.5px] font-bold opacity-70">{inactiveCount}</span>
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-[10px] border border-[#eaecef] bg-white p-1">
          <button
            type="button"
            onClick={() => setView('grid')}
            className="rounded-[7px] p-1.5"
            style={view === 'grid' ? { background: '#5847eb', color: '#fff' } : { color: '#9aa1ac' }}
          >
            <Grid2x2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className="rounded-[7px] p-1.5"
            style={view === 'list' ? { background: '#5847eb', color: '#fff' } : { color: '#9aa1ac' }}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {filtered.length === 0 && <p className="text-sm text-[#8a919c]">No hay profesionales que coincidan.</p>}

      <div
        className={
          view === 'grid'
            ? 'grid grid-cols-[repeat(auto-fill,minmax(min(400px,100%),1fr))] gap-[18px]'
            : 'flex flex-col gap-2.5'
        }
      >
        {filtered.map((p) => {
          const stats = statsByProfessional.get(p.id) ?? { today: 0, week: 0 };
          const occupancyPct = p.active ? Math.round((stats.week / maxWeekCount) * 100) : null;
          const availableToAdd = services.filter((s) => s.active && !p.services.some((ps) => ps.id === s.id));
          return (
            <ProCard
              key={p.id}
              professional={p}
              stats={stats}
              occupancyPct={occupancyPct}
              availableToAdd={availableToAdd}
              addOpen={addOpenId === p.id}
              busy={busyId === p.id}
              onOpenAdd={() => setAddOpenId(p.id)}
              onAddService={(serviceId) => handleAddService(p.id, serviceId)}
              onRemoveService={(serviceId) => handleRemoveService(p.id, serviceId)}
              onEdit={() => setForm({ mode: 'edit', professional: p })}
              onToggleActive={() => toggleActive(p)}
            />
          );
        })}
      </div>

      {toast && (
        <div className="fixed bottom-7 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-[#171a1f] px-[18px] py-3 text-[13px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,.4)]">
          <Info className="h-[18px] w-[18px] text-[#8a7ff0]" />
          {toast}
        </div>
      )}
    </div>
  );
}
