import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as appointmentsApi from '../api/appointments';
import { getErrorMessage } from '../api/client';
import * as professionalsApi from '../api/professionals';
import type { Appointment, Professional, Slot } from '../types';

const todayStr = new Date().toISOString().slice(0, 10);

export function BookingPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [professionalId, setProfessionalId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);

  useEffect(() => {
    professionalsApi
      .list()
      .then((data) => setProfessionals(data.filter((p) => p.services.length > 0)))
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setLoadingProfessionals(false));
  }, []);

  const selectedProfessional = useMemo(
    () => professionals.find((p) => p.id === professionalId) ?? null,
    [professionals, professionalId]
  );

  const selectedService = useMemo(
    () => selectedProfessional?.services.find((s) => s.id === serviceId) ?? null,
    [selectedProfessional, serviceId]
  );

  function resetFrom(step: 'professional' | 'service' | 'date') {
    if (step === 'professional') {
      setServiceId('');
    }
    if (step === 'professional' || step === 'service') {
      setDate('');
    }
    setSlots([]);
    setSelectedSlot(null);
    setBookingError(null);
  }

  useEffect(() => {
    if (!professionalId || !serviceId || !date) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);
    setSelectedSlot(null);

    appointmentsApi
      .getAvailableSlots({ professionalId, serviceId, date })
      .then(setSlots)
      .catch((err) => setSlotsError(getErrorMessage(err)))
      .finally(() => setLoadingSlots(false));
  }, [professionalId, serviceId, date]);

  async function handleConfirm() {
    if (!selectedSlot) return;
    setBooking(true);
    setBookingError(null);
    try {
      const appointment = await appointmentsApi.create({
        professionalId,
        serviceId,
        date,
        startTime: selectedSlot.startTime,
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
      <div className="mx-auto mt-16 max-w-md text-center">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
          <h1 className="text-xl font-semibold text-green-800 dark:text-green-300">¡Turno confirmado!</h1>
          <p className="mt-2 text-sm text-green-700 dark:text-green-400">
            {confirmed.service?.name} con {confirmed.professional?.user.name}
            <br />
            {new Date(confirmed.startDatetime).toLocaleString('es-AR', {
              dateStyle: 'full',
              timeStyle: 'short',
              timeZone: 'UTC',
            })}
          </p>
        </div>
        <Link to="/mis-turnos" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
          Ver mis turnos
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {loadError && <p className="mb-4 text-sm text-red-600">{loadError}</p>}

      {/* Paso 1: profesional */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">1. Elegí un profesional</h2>
        {loadingProfessionals ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : professionals.length === 0 ? (
          <p className="text-sm text-gray-500">No hay profesionales disponibles todavía.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {professionals.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProfessionalId(p.id);
                  resetFrom('professional');
                }}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                  professionalId === p.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-gray-300 hover:border-indigo-400 dark:border-gray-700'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{p.user.name}</div>
                {p.specialty && <div className="text-gray-500 dark:text-gray-400">{p.specialty}</div>}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Paso 2: servicio */}
      {selectedProfessional && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">2. Elegí un servicio</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {selectedProfessional.services.map((s) => {
              const price = s.ProfessionalService.priceOverride ?? s.price;
              const duration = s.ProfessionalService.durationOverride ?? s.durationMinutes;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setServiceId(s.id);
                    resetFrom('service');
                  }}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                    serviceId === s.id
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-gray-300 hover:border-indigo-400 dark:border-gray-700'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {duration} min · ${price}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Paso 3: fecha */}
      {selectedService && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">3. Elegí una fecha</h2>
          <input
            type="date"
            min={todayStr}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(null);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
        </section>
      )}

      {/* Paso 4: horario */}
      {date && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">4. Elegí un horario</h2>
          {loadingSlots ? (
            <p className="text-sm text-gray-500">Buscando horarios…</p>
          ) : slotsError ? (
            <p className="text-sm text-red-600">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500">No hay horarios libres ese día. Probá con otra fecha.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${
                    selectedSlot?.startTime === slot.startTime
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-300 hover:border-indigo-400 dark:border-gray-700'
                  }`}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Paso 5: confirmar */}
      {selectedSlot && (
        <section className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">5. Confirmar</h2>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            {selectedService?.name} con {selectedProfessional?.user.name}, el {date} a las {selectedSlot.startTime}.
          </p>
          <textarea
            placeholder="Notas para el profesional (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            rows={2}
          />
          {bookingError && <p className="mb-3 text-sm text-red-600">{bookingError}</p>}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={booking}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {booking ? 'Confirmando…' : 'Confirmar turno'}
          </button>
        </section>
      )}
    </div>
  );
}
