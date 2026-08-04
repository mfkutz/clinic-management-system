// No hay noción de "sucursal"/consultorio en el modelo de datos — una sola clínica real,
// reusada acá en vez de inventar consultorios/direcciones distintas por turno.
export const CLINIC_INFO = {
  name: 'Clínica Dental Sonrisas',
  address: 'Av. Rivadavia 1234, CABA',
  shortAddress: 'Av. Rivadavia 1234',
  phone: '+54 11 4567-8900',
  hours: 'Lun a Vie · 9:00–19:00 · Sáb 9:00–13:00',
};

/** Embed de Google Maps sin API key (el modo "output=embed" de una búsqueda normal es gratuito). */
export function clinicMapEmbedUrl(): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(CLINIC_INFO.address)}&z=15&output=embed`;
}
