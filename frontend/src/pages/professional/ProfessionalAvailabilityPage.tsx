import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarOff, Clock, Plus, X } from 'lucide-react';
import * as availabilityApi from '../../api/availability';
import { getErrorMessage } from '../../api/client';
import * as professionalsApi from '../../api/professionals';
import type { Availability, AvailabilityException } from '../../types';
import {
  createAvailabilitySchema,
  createExceptionSchema,
  type CreateAvailabilityFormValues,
  type CreateExceptionFormValues,
} from '../../validation/availabilitySchemas';

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const inputClass =
  'w-full rounded-[10px] border border-[#eaecef] bg-white px-3 py-2 text-[13.5px] text-[#171a1f] focus:border-[#5847eb] focus:outline-none';
const labelClass = 'mb-1.5 block text-[12.5px] font-semibold text-[#4b535e]';

function AvailabilityForm({ onSubmit }: { onSubmit: (values: CreateAvailabilityFormValues) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAvailabilityFormValues>({
    resolver: zodResolver(createAvailabilitySchema),
    defaultValues: { dayOfWeek: 1, startTime: '09:00', endTime: '13:00' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-[#eaecef] bg-white p-5">
      <h3 className="mb-3.5 text-[15px] font-extrabold tracking-[-.2px] text-[#171a1f]">Agregar franja horaria</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Día</label>
          <select className={inputClass} {...register('dayOfWeek', { valueAsNumber: true })}>
            {dayNames.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Desde</label>
          <input type="time" className={inputClass} {...register('startTime')} />
        </div>
        <div>
          <label className={labelClass}>Hasta</label>
          <input type="time" className={inputClass} {...register('endTime')} />
        </div>
      </div>
      {errors.endTime && <p className="mt-2 text-[12.5px] text-red-600">{errors.endTime.message}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3.5 flex items-center gap-1.5 rounded-[11px] bg-[#5847eb] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#4636cf] disabled:opacity-60"
      >
        <Plus className="h-[18px] w-[18px]" />
        Agregar
      </button>
    </form>
  );
}

function ExceptionForm({ onSubmit }: { onSubmit: (values: CreateExceptionFormValues) => Promise<void> }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateExceptionFormValues>({
    resolver: zodResolver(createExceptionSchema),
    defaultValues: { date: '', isBlocked: true, startTime: '', endTime: '' },
  });
  const isBlocked = watch('isBlocked');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-[#eaecef] bg-white p-5">
      <h3 className="mb-3.5 text-[15px] font-extrabold tracking-[-.2px] text-[#171a1f]">Agregar excepción</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Fecha</label>
          <input type="date" className={inputClass} {...register('date')} />
          {errors.date && <p className="mt-1.5 text-[12.5px] text-red-600">{errors.date.message}</p>}
        </div>
        <label className="flex items-center gap-2 pt-6 text-[13px] font-semibold text-[#4b535e]">
          <input type="checkbox" className="h-4 w-4 accent-[#5847eb]" {...register('isBlocked')} />
          Bloquear el día completo
        </label>
      </div>

      {!isBlocked && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Desde</label>
            <input type="time" className={inputClass} {...register('startTime')} />
            {errors.startTime && <p className="mt-1.5 text-[12.5px] text-red-600">{errors.startTime.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Hasta</label>
            <input type="time" className={inputClass} {...register('endTime')} />
            {errors.endTime && <p className="mt-1.5 text-[12.5px] text-red-600">{errors.endTime.message}</p>}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3.5 flex items-center gap-1.5 rounded-[11px] bg-[#5847eb] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#4636cf] disabled:opacity-60"
      >
        <Plus className="h-[18px] w-[18px]" />
        Agregar excepción
      </button>
    </form>
  );
}

export function ProfessionalAvailabilityPage() {
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [availabilityFormKey, setAvailabilityFormKey] = useState(0);
  const [exceptionFormKey, setExceptionFormKey] = useState(0);

  useEffect(() => {
    professionalsApi
      .getMe()
      .then(async (professional) => {
        setProfessionalId(professional.id);
        const [avail, exc] = await Promise.all([
          availabilityApi.listAvailability(professional.id),
          availabilityApi.listExceptions(professional.id),
        ]);
        setAvailabilities(avail);
        setExceptions(exc);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddAvailability(values: CreateAvailabilityFormValues) {
    if (!professionalId) return;
    setError(null);
    try {
      const created = await availabilityApi.createAvailability(professionalId, values);
      setAvailabilities((prev) =>
        [...prev, created].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime))
      );
      setAvailabilityFormKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleRemoveAvailability(id: string) {
    if (!professionalId) return;
    setBusyId(id);
    setError(null);
    try {
      await availabilityApi.removeAvailability(professionalId, id);
      setAvailabilities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddException(values: CreateExceptionFormValues) {
    if (!professionalId) return;
    setError(null);
    try {
      const created = await availabilityApi.createException(professionalId, {
        date: values.date,
        isBlocked: values.isBlocked,
        startTime: values.isBlocked ? undefined : values.startTime,
        endTime: values.isBlocked ? undefined : values.endTime,
      });
      setExceptions((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      setExceptionFormKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleRemoveException(id: string) {
    if (!professionalId) return;
    setBusyId(id);
    setError(null);
    try {
      await availabilityApi.removeException(professionalId, id);
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const availabilityByDay = dayNames
    .map((name, dayOfWeek) => ({ dayOfWeek, name, slots: availabilities.filter((a) => a.dayOfWeek === dayOfWeek) }))
    .filter((d) => d.slots.length > 0);

  if (loading) return <p className="p-7 text-sm text-gray-500">Cargando…</p>;
  if (error && !professionalId) return <p className="p-7 text-sm text-red-600">{error}</p>;

  return (
    <div className="px-[28px] pt-[26px] pb-[40px]">
      <div className="mb-[22px]">
        <div className="flex items-center gap-[7px] text-[13px] font-semibold text-[#8a919c]">
          <Clock className="h-[17px] w-[17px]" />
          Tu agenda
        </div>
        <h2 className="mt-[7px] mb-[5px] text-[26px] font-extrabold tracking-[-.6px] text-[#171a1f]">Disponibilidad</h2>
        <p className="m-0 text-[14px] text-[#6b7480]">Definí tu horario semanal recurrente y los días excepcionales.</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {professionalId && (
        <div className="grid grid-cols-2 gap-5">
          <section className="flex flex-col gap-4">
            <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Disponibilidad semanal</h3>
            <AvailabilityForm key={availabilityFormKey} onSubmit={handleAddAvailability} />

            {availabilityByDay.length === 0 ? (
              <p className="text-[13px] text-[#8a919c]">Todavía no cargaste horarios.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {availabilityByDay.map((d) => (
                  <div key={d.dayOfWeek} className="rounded-[14px] border border-[#eaecef] bg-white px-4 py-3.5">
                    <div className="mb-2 text-[13px] font-bold text-[#171a1f]">{d.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {d.slots.map((a) => (
                        <span
                          key={a.id}
                          className="flex items-center gap-1.5 rounded-[20px] bg-[#eef0fe] px-3 py-1.5 text-[12.5px] font-bold text-[#5847eb]"
                        >
                          {a.startTime.slice(0, 5)} – {a.endTime.slice(0, 5)}
                          <button
                            type="button"
                            onClick={() => handleRemoveAvailability(a.id)}
                            disabled={busyId === a.id}
                            className="rounded-full p-0.5 hover:bg-[#5847eb] hover:text-white disabled:opacity-60"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="m-0 text-[16px] font-extrabold tracking-[-.3px] text-[#171a1f]">Excepciones</h3>
            <ExceptionForm key={exceptionFormKey} onSubmit={handleAddException} />

            {exceptions.length === 0 ? (
              <p className="text-[13px] text-[#8a919c]">Sin excepciones cargadas.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {exceptions.map((e) => (
                  <div key={e.id} className="flex items-center gap-3.5 rounded-[14px] border border-[#eaecef] bg-white px-4 py-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                      style={e.isBlocked ? { background: '#fdecec', color: '#dc2626' } : { background: '#eaf7ef', color: '#16a34a' }}
                    >
                      <CalendarOff className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-[#171a1f]">
                        {new Date(`${e.date}T00:00:00Z`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: 'UTC' })}
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#8a919c]">
                        {e.isBlocked
                          ? e.startTime && e.endTime
                            ? `Bloqueado ${e.startTime.slice(0, 5)}–${e.endTime.slice(0, 5)}`
                            : 'Día completo bloqueado'
                          : `Horario extra ${e.startTime?.slice(0, 5)}–${e.endTime?.slice(0, 5)}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveException(e.id)}
                      disabled={busyId === e.id}
                      className="rounded-[9px] border border-[#f0d4d4] px-3 py-1.5 text-[12.5px] font-bold text-[#dc2626] hover:bg-[#fdecec] disabled:opacity-60"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
