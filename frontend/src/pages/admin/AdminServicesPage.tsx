import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Download,
  Edit2,
  Grid2x2,
  List,
  MoreHorizontal,
  Plus,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import * as servicesApi from '../../api/services';
import * as professionalsApi from '../../api/professionals';
import { getErrorMessage } from '../../api/client';
import { formatMoney, getInitials } from '../../lib/format';
import { avatarStyle } from '../../lib/avatarColor';
import { CATEGORY_META } from '../../lib/serviceCategory';
import { SERVICE_CATEGORIES, type Professional, type Service, type ServiceCategory } from '../../types';
import { createServiceSchema, type CreateServiceFormValues } from '../../validation/adminSchemas';

type ViewMode = 'grid' | 'list';

interface FormPanelProps {
  service: Service | null;
  onSubmit: (values: CreateServiceFormValues) => Promise<void>;
  onClose: () => void;
}

function FormPanel({ service, onSubmit, onClose }: FormPanelProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceFormValues>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: service
      ? {
          name: service.name,
          description: service.description ?? undefined,
          durationMinutes: service.durationMinutes,
          price: Number(service.price),
          category: service.category,
        }
      : { category: SERVICE_CATEGORIES[0] },
  });
  const selectedCategory = watch('category');

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[rgba(23,26,31,.34)] backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative flex h-full w-[440px] max-w-[92vw] flex-col bg-white shadow-[-24px_0_60px_-30px_rgba(23,26,31,.4)]"
      >
        <div className="flex items-center gap-3 border-b border-[#eef0f2] px-6 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#eef0fe] text-[#5847eb]">
            <PlusCircle className="h-[21px] w-[21px]" />
          </span>
          <div className="flex-1">
            <h3 className="m-0 text-[17px] font-extrabold tracking-[-.3px] text-[#171a1f]">
              {service ? 'Editar servicio' : 'Nuevo servicio'}
            </h3>
            <p className="mt-0.5 mb-0 text-[12.5px] text-[#8a919c]">
              {service ? 'Actualizá los datos del tratamiento.' : 'Agregá un tratamiento al catálogo.'}
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
          <div>
            <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">Nombre del servicio</label>
            <input
              className="w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] text-[#171a1f] focus:border-[#5847eb] focus:bg-white focus:outline-none"
              placeholder="Ej. Limpieza dental"
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat, { shouldValidate: true })}
                    className="rounded-[9px] border px-3 py-[7px] text-[12.5px] font-bold"
                    style={
                      active
                        ? { background: '#eef0fe', color: '#5847eb', borderColor: '#d7d4f7' }
                        : { background: '#fff', color: '#6b7480', borderColor: '#eaecef' }
                    }
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
          </div>

          <div>
            <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">
              Descripción <span className="font-medium text-[#b8bec7]">(opcional)</span>
            </label>
            <textarea
              className="min-h-[64px] w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] text-[#171a1f] focus:border-[#5847eb] focus:bg-white focus:outline-none"
              placeholder="Breve descripción del tratamiento…"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">Duración (min)</label>
              <input
                type="number"
                className="w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] text-[#171a1f] focus:border-[#5847eb] focus:bg-white focus:outline-none"
                placeholder="30"
                {...register('durationMinutes', { valueAsNumber: true })}
              />
              {errors.durationMinutes && <p className="mt-1 text-xs text-red-600">{errors.durationMinutes.message}</p>}
            </div>
            <div>
              <label className="mb-[7px] block text-[12.5px] font-bold text-[#4b535e]">Precio</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-[11px] border border-[#e6e8eb] bg-[#fbfbfc] px-[13px] py-[11px] text-[13.5px] text-[#171a1f] focus:border-[#5847eb] focus:bg-white focus:outline-none"
                placeholder="$ 0.00"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
            </div>
          </div>
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
            {service ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface ServiceCardProps {
  service: Service;
  pros: Professional[];
  onEdit: () => void;
  onToggle: () => void;
  toggling: boolean;
}

function ServiceCard({ service, pros, onEdit, onToggle, toggling }: ServiceCardProps) {
  const meta = CATEGORY_META[service.category];
  return (
    <div
      className="flex flex-col gap-[15px] rounded-[18px] border border-[#eaecef] bg-white p-[18px] transition-[border-color,box-shadow,transform] duration-[.18s] hover:-translate-y-0.5 hover:border-[#d7d4f7] hover:shadow-[0_12px_28px_-18px_rgba(88,71,235,.4)]"
      style={{ opacity: service.active ? 1 : 0.62 }}
    >
      <div className="flex items-start gap-[13px]">
        <span
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px]"
          style={{ background: meta.bg, color: meta.color }}
        >
          <meta.icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[15.5px] font-extrabold tracking-[-.3px] text-[#171a1f]">{service.name}</span>
          <div
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-[20px] px-[9px] py-[3px] text-[11.5px] font-bold"
            style={{ background: meta.bg, color: meta.color }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
            {service.category}
          </div>
        </div>
        <span
          className="rounded-[20px] px-[10px] py-[4px] text-[11px] font-bold tracking-[.03em]"
          style={
            service.active ? { background: '#eaf7ef', color: '#16a34a' } : { background: '#eef1f4', color: '#98a0ab' }
          }
        >
          {service.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <p className="m-0 min-h-[38px] text-[13px] leading-[1.5] text-[#8a919c]">
        {service.description || 'Sin descripción.'}
      </p>

      <div className="flex items-center gap-[18px] pt-0.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-[#a3a9b2]">Duración</span>
          <span className="text-[14.5px] font-bold text-[#171a1f]">{service.durationMinutes} min</span>
        </div>
        <div className="h-[30px] w-px bg-[#eef0f2]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-semibold text-[#a3a9b2]">Precio</span>
          <span className="text-[14.5px] font-extrabold text-[#5847eb]">{formatMoney(service.price)}</span>
        </div>
        {pros.length > 0 && (
          <div className="ml-auto flex items-center">
            {pros.slice(0, 3).map((p) => {
              const avatar = avatarStyle(p.id);
              return (
                <div
                  key={p.id}
                  title={p.user.name}
                  className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10.5px] font-bold"
                  style={{ background: avatar.bg, color: avatar.color }}
                >
                  {getInitials(p.user.name)}
                </div>
              );
            })}
            {pros.length > 3 && (
              <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#eef1f4] text-[10px] font-bold text-[#6b7480]">
                +{pros.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-[9px] border-t border-[#f4f5f7] pt-3.5">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] border border-[#eaecef] bg-white py-[9px] text-[13px] font-bold text-[#4b535e] hover:bg-[#f4f5f7]"
        >
          <Edit2 className="h-[18px] w-[18px]" />
          Editar
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={toggling}
          className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] border border-[#eaecef] bg-white py-[9px] text-[13px] font-bold text-[#6b7480] hover:border-[#f4cdcd] hover:bg-[#fdf0f0] hover:text-[#dc2626] disabled:opacity-60"
        >
          {service.active ? <ToggleRight className="h-[18px] w-[18px]" /> : <ToggleLeft className="h-[18px] w-[18px]" />}
          {service.active ? 'Desactivar' : 'Activar'}
        </button>
        <button
          type="button"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-[#eaecef] bg-white text-[#9aa1ac] hover:bg-[#f4f5f7]"
        >
          <MoreHorizontal className="h-[19px] w-[19px]" />
        </button>
      </div>
    </div>
  );
}

function ServiceRow({ service, pros, onEdit, onToggle, toggling }: ServiceCardProps) {
  const meta = CATEGORY_META[service.category];
  return (
    <div
      className="flex flex-wrap items-center gap-2.5 rounded-[14px] border border-[#eaecef] bg-white p-3.5 sm:gap-4 sm:px-4 sm:py-3"
      style={{ opacity: service.active ? 1 : 0.62 }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: meta.bg, color: meta.color }}
      >
        <meta.icon className="h-5 w-5" />
      </span>
      <div className="min-w-[130px] sm:w-[220px] sm:shrink-0">
        <div className="truncate text-[14px] font-bold text-[#171a1f]">{service.name}</div>
        <div className="mt-0.5 text-[11.5px] font-semibold" style={{ color: meta.color }}>
          {service.category}
        </div>
      </div>
      <p className="m-0 hidden min-w-0 flex-1 truncate text-[12.5px] text-[#8a919c] sm:block">
        {service.description || 'Sin descripción.'}
      </p>
      <div className="shrink-0 text-[13px] font-bold text-[#171a1f] sm:w-[70px] sm:text-[13.5px]">{service.durationMinutes} min</div>
      <div className="shrink-0 text-[13px] font-extrabold text-[#5847eb] sm:w-[100px] sm:text-[13.5px]">{formatMoney(service.price)}</div>
      <div className="hidden shrink-0 items-center sm:flex sm:w-[70px]">
        {pros.slice(0, 3).map((p) => {
          const avatar = avatarStyle(p.id);
          return (
            <div
              key={p.id}
              title={p.user.name}
              className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[9.5px] font-bold"
              style={{ background: avatar.bg, color: avatar.color }}
            >
              {getInitials(p.user.name)}
            </div>
          );
        })}
      </div>
      <span
        className="shrink-0 rounded-[20px] px-[10px] py-[4px] text-center text-[11px] font-bold sm:w-[70px]"
        style={service.active ? { background: '#eaf7ef', color: '#16a34a' } : { background: '#eef1f4', color: '#98a0ab' }}
      >
        {service.active ? 'Activo' : 'Inactivo'}
      </span>
      <div className="ml-auto flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#eaecef] bg-white text-[#4b535e] hover:bg-[#f4f5f7]"
          title="Editar"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={toggling}
          className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#eaecef] bg-white text-[#6b7480] hover:border-[#f4cdcd] hover:bg-[#fdf0f0] hover:text-[#dc2626] disabled:opacity-60"
          title={service.active ? 'Desactivar' : 'Activar'}
        >
          {service.active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formService, setFormService] = useState<Service | null | undefined>(undefined);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ServiceCategory | 'Todos'>('Todos');
  const [view, setView] = useState<ViewMode>('grid');

  function load() {
    setLoading(true);
    Promise.all([servicesApi.listAll(), professionalsApi.list()])
      .then(([svc, pros]) => {
        setServices(svc);
        setProfessionals(pros);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const professionalsByService = useMemo(() => {
    const map = new Map<string, Professional[]>();
    professionals.forEach((p) => {
      p.services.forEach((s) => {
        map.set(s.id, [...(map.get(s.id) ?? []), p]);
      });
    });
    return map;
  }, [professionals]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<ServiceCategory, number>();
    services.forEach((s) => counts.set(s.category, (counts.get(s.category) ?? 0) + 1));
    return counts;
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (category !== 'Todos' && s.category !== category) return false;
      if (search.trim() && !s.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [services, category, search]);

  async function handleFormSubmit(values: CreateServiceFormValues) {
    setError(null);
    try {
      if (formService) {
        const updated = await servicesApi.update(formService.id, values);
        setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await servicesApi.create(values);
        setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setFormService(undefined);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function toggleActive(service: Service) {
    setTogglingId(service.id);
    setError(null);
    try {
      const updated = await servicesApi.update(service.id, { active: !service.active });
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;

  const activeCount = services.filter((s) => s.active).length;
  const avgDuration = services.length
    ? Math.round(services.reduce((sum, s) => sum + s.durationMinutes, 0) / services.length)
    : 0;
  const avgPrice = services.length ? services.reduce((sum, s) => sum + Number(s.price), 0) / services.length : 0;

  return (
    <div className="px-4 pt-5 pb-8 lg:px-[28px] lg:pt-[26px] lg:pb-[40px]">
      {formService !== undefined && (
        <FormPanel service={formService} onSubmit={handleFormSubmit} onClose={() => setFormService(undefined)} />
      )}

      {/* PAGE HEADER */}
      <div className="mb-[22px] flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
            <Stethoscope className="h-[17px] w-[17px]" />
            Catálogo de la clínica
          </div>
          <h2 className="mt-[7px] mb-[5px] text-[26px] font-extrabold tracking-[-.6px] text-[#171a1f]">Servicios</h2>
          <p className="m-0 text-[14px] text-[#6b7480]">Gestioná los tratamientos que ofrecés, su duración y precios.</p>
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
            onClick={() => setFormService(null)}
            className="flex items-center gap-[7px] rounded-[11px] bg-[#5847eb] px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(88,71,235,.6)] hover:bg-[#4636cf]"
          >
            <Plus className="h-[19px] w-[19px]" />
            Nuevo servicio
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* KPI STRIP */}
      <div className="mb-[22px] grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { icon: Stethoscope, value: String(services.length), label: 'Servicios totales', bg: '#eef0fe', color: '#5847eb' },
          { icon: ShieldCheck, value: String(activeCount), label: 'Activos', bg: '#eaf7ef', color: '#16a34a' },
          { icon: Syringe, value: `${avgDuration} min`, label: 'Duración promedio', bg: '#fef4e8', color: '#d97706' },
          { icon: Sparkles, value: formatMoney(Math.round(avgPrice)), label: 'Precio promedio', bg: '#eef7f2', color: '#0f9d63' },
        ].map((k) => (
          <div key={k.label} className="flex items-center gap-2.5 rounded-2xl border border-[#eaecef] bg-white px-3.5 py-3.5 sm:gap-3.5 sm:px-[18px] sm:py-[17px]">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
              style={{ background: k.bg, color: k.color }}
            >
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
            placeholder="Buscar servicio…"
            className="w-full text-[13.5px] text-[#171a1f] placeholder:text-[#9aa1ac] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('Todos')}
            className="inline-flex items-center gap-1.5 rounded-[10px] border px-[13px] py-2 text-[13px] font-semibold"
            style={
              category === 'Todos'
                ? { background: '#5847eb', color: '#fff', borderColor: '#5847eb' }
                : { background: '#fff', color: '#4b535e', borderColor: '#eaecef' }
            }
          >
            Todos
            <span className="text-[11.5px] font-bold opacity-70">{services.length}</span>
          </button>
          {SERVICE_CATEGORIES.map((cat) => {
            const active = category === cat;
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className="inline-flex items-center gap-1.5 rounded-[10px] border px-[13px] py-2 text-[13px] font-semibold hover:border-[#d7d4f7] hover:bg-[#eef0fe] hover:text-[#5847eb]"
                style={
                  active
                    ? { background: '#eef0fe', color: '#5847eb', borderColor: '#d7d4f7' }
                    : { background: '#fff', color: '#4b535e', borderColor: '#eaecef' }
                }
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: meta.color }} />
                {cat}
                <span className="text-[11.5px] font-bold opacity-70">{categoryCounts.get(cat) ?? 0}</span>
              </button>
            );
          })}
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

      {filteredServices.length === 0 && <p className="text-sm text-[#8a919c]">No hay servicios que coincidan.</p>}

      {view === 'grid' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-4">
          {filteredServices.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              pros={professionalsByService.get(s.id) ?? []}
              onEdit={() => setFormService(s)}
              onToggle={() => toggleActive(s)}
              toggling={togglingId === s.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredServices.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              pros={professionalsByService.get(s.id) ?? []}
              onEdit={() => setFormService(s)}
              onToggle={() => toggleActive(s)}
              toggling={togglingId === s.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
