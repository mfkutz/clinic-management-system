'use strict';

const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const PROFESSIONAL_PASSWORD = 'profesional123';
const CLIENT_PASSWORD = 'cliente123';

const PAST_DAYS = 14;
const FUTURE_DAYS = 14;

const PROFESSIONALS = [
  {
    name: 'Valentina Rojas',
    email: 'valentina.rojas@sistema-turnos.dev',
    phone: '+54 9 11 5501-1001',
    specialty: 'Odontología general',
    bio: 'Más de 10 años de experiencia en odontología general y estética.',
    color: '#4f46e5',
    dayOfWeek: [1, 2, 3, 4, 5],
    windows: [['09:00', '13:00'], ['14:00', '18:00']],
    slots: ['09:30', '15:00'],
    serviceKeys: [
      { key: 'consulta' },
      { key: 'limpieza' },
      { key: 'blanqueamiento' },
      { key: 'extraccion' },
      { key: 'empaste' },
      { key: 'radiografia' },
    ],
  },
  {
    name: 'Martín Aguirre',
    email: 'martin.aguirre@sistema-turnos.dev',
    phone: '+54 9 11 5501-1002',
    specialty: 'Ortodoncia',
    bio: 'Especialista en ortodoncia y alineación dental para adultos y adolescentes.',
    color: '#059669',
    dayOfWeek: [1, 2, 4, 5],
    windows: [['10:00', '19:00']],
    slots: ['10:30', '16:00'],
    serviceKeys: [
      { key: 'consulta' },
      { key: 'control_ortodoncia' },
      { key: 'brackets', durationOverride: 120 },
    ],
  },
  {
    name: 'Carla Fernández',
    email: 'carla.fernandez@sistema-turnos.dev',
    phone: '+54 9 11 5501-1003',
    specialty: 'Endodoncia',
    bio: 'Especialista en tratamientos de conducto y salud pulpar.',
    color: '#db2777',
    dayOfWeek: [2, 3, 4],
    windows: [['08:00', '16:00']],
    slots: ['08:30', '12:30'],
    serviceKeys: [{ key: 'consulta' }, { key: 'endodoncia' }, { key: 'empaste' }],
  },
  {
    name: 'Nicolás Paredes',
    email: 'nicolas.paredes@sistema-turnos.dev',
    phone: '+54 9 11 5501-1004',
    specialty: 'Odontopediatría',
    bio: 'Atención odontológica especializada en niños y adolescentes.',
    color: '#d97706',
    dayOfWeek: [1, 3, 5],
    windows: [['09:00', '13:00']],
    slots: ['09:15', '11:15'],
    serviceKeys: [{ key: 'pediatrica' }, { key: 'limpieza' }, { key: 'empaste' }],
  },
  {
    name: 'Sofía Medina',
    email: 'sofia.medina@sistema-turnos.dev',
    phone: '+54 9 11 5501-1005',
    specialty: 'Cirugía maxilofacial',
    bio: 'Especialista en cirugías orales y maxilofaciales complejas.',
    color: '#0891b2',
    dayOfWeek: [1, 2, 3, 4],
    windows: [['14:00', '20:00']],
    slots: ['14:30', '17:30'],
    serviceKeys: [
      { key: 'cirugia_muela' },
      { key: 'extraccion' },
      { key: 'consulta', priceOverride: 10000 },
    ],
  },
];

const CLIENTS = [
  { name: 'Ana Gómez', email: 'ana.gomez@example.com', phone: '+54 9 11 4400-2001' },
  { name: 'Bruno Sosa', email: 'bruno.sosa@example.com', phone: '+54 9 11 4400-2002' },
  { name: 'Camila Torres', email: 'camila.torres@example.com', phone: '+54 9 11 4400-2003' },
  { name: 'Diego Herrera', email: 'diego.herrera@example.com', phone: '+54 9 11 4400-2004' },
  { name: 'Elena Vidal', email: 'elena.vidal@example.com', phone: '+54 9 11 4400-2005' },
  { name: 'Facundo Ibarra', email: 'facundo.ibarra@example.com', phone: '+54 9 11 4400-2006' },
  { name: 'Gabriela Núñez', email: 'gabriela.nunez@example.com', phone: '+54 9 11 4400-2007' },
  { name: 'Hernán Castro', email: 'hernan.castro@example.com', phone: '+54 9 11 4400-2008' },
  { name: 'Iris Molina', email: 'iris.molina@example.com', phone: '+54 9 11 4400-2009' },
  { name: 'Joaquín Silva', email: 'joaquin.silva@example.com', phone: '+54 9 11 4400-2010' },
  { name: 'Karina Ríos', email: 'karina.rios@example.com', phone: '+54 9 11 4400-2011' },
  { name: 'Lucas Bravo', email: 'lucas.bravo@example.com', phone: '+54 9 11 4400-2012' },
  { name: 'Melina Acosta', email: 'melina.acosta@example.com', phone: '+54 9 11 4400-2013' },
  { name: 'Nahuel Ferreyra', email: 'nahuel.ferreyra@example.com', phone: '+54 9 11 4400-2014' },
];

const SERVICES = [
  { key: 'consulta', name: 'Consulta general', description: 'Evaluación odontológica general.', durationMinutes: 30, price: 8000, category: 'Consulta' },
  { key: 'limpieza', name: 'Limpieza dental', description: 'Profilaxis y remoción de sarro.', durationMinutes: 45, price: 12000, category: 'Prevención' },
  { key: 'blanqueamiento', name: 'Blanqueamiento dental', description: 'Blanqueamiento dental profesional.', durationMinutes: 60, price: 35000, category: 'Estética' },
  { key: 'extraccion', name: 'Extracción simple', description: 'Extracción de pieza dental.', durationMinutes: 30, price: 15000, category: 'Cirugía' },
  { key: 'control_ortodoncia', name: 'Control de ortodoncia', description: 'Ajuste y control mensual de brackets.', durationMinutes: 30, price: 10000, category: 'Ortodoncia' },
  { key: 'brackets', name: 'Colocación de brackets', description: 'Colocación inicial de brackets metálicos.', durationMinutes: 90, price: 180000, category: 'Ortodoncia' },
  { key: 'endodoncia', name: 'Endodoncia', description: 'Tratamiento de conducto.', durationMinutes: 60, price: 45000, category: 'Cirugía' },
  { key: 'empaste', name: 'Empaste / resina', description: 'Restauración con resina compuesta.', durationMinutes: 45, price: 18000, category: 'Prevención' },
  { key: 'pediatrica', name: 'Consulta odontopediátrica', description: 'Consulta odontológica para niños.', durationMinutes: 30, price: 9000, category: 'Consulta' },
  { key: 'cirugia_muela', name: 'Cirugía de muela de juicio', description: 'Extracción quirúrgica de muela de juicio.', durationMinutes: 90, price: 60000, category: 'Cirugía' },
  { key: 'radiografia', name: 'Radiografía panorámica', description: 'Radiografía panorámica dental.', durationMinutes: 15, price: 6000, category: 'Consulta' },
];

const NOTE_OPTIONS = [
  'Dolor leve en la zona tratada.',
  'Primera consulta, paciente algo nervioso/a.',
  'Control de rutina.',
  null,
  null,
];

const CANCEL_REASONS = [
  'El paciente reprogramó por un imprevisto laboral.',
  'Cancelado por el paciente, se sintió indispuesto.',
];

const PAYMENT_METHODS = ['efectivo', 'tarjeta', 'transferencia'];

const CLINICAL_NOTE_TEMPLATES = [
  (serviceName) => `${serviceName} realizado sin complicaciones. Se indica control en la próxima visita.`,
  (serviceName) => `Se realizó ${serviceName.toLowerCase()}. Paciente evoluciona favorablemente.`,
  (serviceName) => `${serviceName}: buena tolerancia del paciente, sin dolor post-procedimiento.`,
];

const addDays = (base, days) => new Date(base.getTime() + days * 86400000);

const atTime = (day, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m));
};

const nextActiveDate = (base, activeDays) => {
  let d = base;
  while (!activeDays.includes(d.getUTCDay())) d = addDays(d, 1);
  return d;
};

const nextDateWithDow = (base, targetDow) => {
  let d = base;
  while (d.getUTCDay() !== targetDow) d = addDays(d, 1);
  return d;
};

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayKeyStr = today.toISOString().slice(0, 10);

    const professionalPasswordHash = await bcrypt.hash(PROFESSIONAL_PASSWORD, 10);
    const clientPasswordHash = await bcrypt.hash(CLIENT_PASSWORD, 10);

    // ---- users + professionals ----
    const professionalRecords = PROFESSIONALS.map((p) => ({
      ...p,
      userId: randomUUID(),
      professionalId: randomUUID(),
    }));

    const clientRecords = CLIENTS.map((c) => ({ ...c, userId: randomUUID() }));

    await queryInterface.bulkInsert(
      'users',
      professionalRecords.map((p) => ({
        id: p.userId,
        name: p.name,
        email: p.email,
        password_hash: professionalPasswordHash,
        phone: p.phone,
        role: 'professional',
        active: true,
        created_at: now,
        updated_at: now,
      })),
    );

    await queryInterface.bulkInsert(
      'users',
      clientRecords.map((c) => ({
        id: c.userId,
        name: c.name,
        email: c.email,
        password_hash: clientPasswordHash,
        phone: c.phone,
        role: 'client',
        active: true,
        created_at: now,
        updated_at: now,
      })),
    );

    await queryInterface.bulkInsert(
      'professionals',
      professionalRecords.map((p) => ({
        id: p.professionalId,
        user_id: p.userId,
        specialty: p.specialty,
        bio: p.bio,
        color: p.color,
        active: true,
        created_at: now,
        updated_at: now,
      })),
    );

    // ---- services ----
    const serviceRecords = SERVICES.map((s) => ({ ...s, id: randomUUID() }));
    const serviceByKey = new Map(serviceRecords.map((s) => [s.key, s]));

    await queryInterface.bulkInsert(
      'services',
      serviceRecords.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration_minutes: s.durationMinutes,
        price: s.price,
        category: s.category,
        active: true,
        created_at: now,
        updated_at: now,
      })),
    );

    // ---- professional_services (+ resolved service list per professional) ----
    const professionalServiceRows = [];
    professionalRecords.forEach((prof) => {
      prof.resolvedServices = prof.serviceKeys.map((entry) => {
        const base = serviceByKey.get(entry.key);
        professionalServiceRows.push({
          id: randomUUID(),
          professional_id: prof.professionalId,
          service_id: base.id,
          price_override: entry.priceOverride ?? null,
          duration_override: entry.durationOverride ?? null,
          created_at: now,
          updated_at: now,
        });
        return {
          id: base.id,
          name: base.name,
          price: entry.priceOverride ?? base.price,
          durationMinutes: entry.durationOverride ?? base.durationMinutes,
        };
      });
    });

    await queryInterface.bulkInsert('professional_services', professionalServiceRows);

    // ---- availabilities ----
    const availabilityRows = [];
    professionalRecords.forEach((prof) => {
      prof.dayOfWeek.forEach((dow) => {
        prof.windows.forEach(([start, end]) => {
          availabilityRows.push({
            id: randomUUID(),
            professional_id: prof.professionalId,
            day_of_week: dow,
            start_time: `${start}:00`,
            end_time: `${end}:00`,
            created_at: now,
            updated_at: now,
          });
        });
      });
    });

    await queryInterface.bulkInsert('availabilities', availabilityRows);

    // ---- availability exceptions (also used to keep appointment generation consistent) ----
    const blockedDatesByProfessional = new Map();
    const exceptionRows = [];

    const valentina = professionalRecords.find((p) => p.email === 'valentina.rojas@sistema-turnos.dev');
    const martin = professionalRecords.find((p) => p.email === 'martin.aguirre@sistema-turnos.dev');
    const sofia = professionalRecords.find((p) => p.email === 'sofia.medina@sistema-turnos.dev');

    const valentinaBlockedDate = nextActiveDate(addDays(today, 7), valentina.dayOfWeek);
    exceptionRows.push({
      id: randomUUID(),
      professional_id: valentina.professionalId,
      date: valentinaBlockedDate.toISOString().slice(0, 10),
      start_time: null,
      end_time: null,
      is_blocked: true,
      created_at: now,
      updated_at: now,
    });
    blockedDatesByProfessional.set(valentina.email, new Set([valentinaBlockedDate.toISOString().slice(0, 10)]));

    const sofiaBlockedDate = nextActiveDate(addDays(today, 3), sofia.dayOfWeek);
    exceptionRows.push({
      id: randomUUID(),
      professional_id: sofia.professionalId,
      date: sofiaBlockedDate.toISOString().slice(0, 10),
      start_time: '14:00:00',
      end_time: '16:00:00',
      is_blocked: true,
      created_at: now,
      updated_at: now,
    });
    blockedDatesByProfessional.set(sofia.email, new Set([sofiaBlockedDate.toISOString().slice(0, 10)]));

    const martinExtraDate = nextDateWithDow(addDays(today, 2), 6);
    exceptionRows.push({
      id: randomUUID(),
      professional_id: martin.professionalId,
      date: martinExtraDate.toISOString().slice(0, 10),
      start_time: '09:00:00',
      end_time: '13:00:00',
      is_blocked: false,
      created_at: now,
      updated_at: now,
    });

    await queryInterface.bulkInsert('availability_exceptions', exceptionRows);

    // ---- appointments + clinical records ----
    const appointmentRows = [];
    const clinicalRecordRows = [];
    let clientCursor = 0;
    const nextClient = () => {
      const client = clientRecords[clientCursor % clientRecords.length];
      clientCursor += 1;
      return client;
    };

    professionalRecords.forEach((prof) => {
      const blocked = blockedDatesByProfessional.get(prof.email) ?? new Set();
      let serviceCursor = 0;
      let apptCounter = 0;
      const nextService = () => {
        const service = prof.resolvedServices[serviceCursor % prof.resolvedServices.length];
        serviceCursor += 1;
        return service;
      };

      // past appointments: two slots per active day, mostly completed
      for (let offset = PAST_DAYS; offset >= 1; offset -= 1) {
        const day = addDays(today, -offset);
        if (!prof.dayOfWeek.includes(day.getUTCDay())) continue;
        if (blocked.has(day.toISOString().slice(0, 10))) continue;

        prof.slots.forEach((slot) => {
          apptCounter += 1;
          const service = nextService();
          const client = nextClient();
          const start = atTime(day, slot);
          const end = new Date(start.getTime() + service.durationMinutes * 60000);

          let status = 'completed';
          if (apptCounter % 11 === 0) status = 'cancelled';
          else if (apptCounter % 9 === 0) status = 'no_show';

          const isPaid = status === 'completed' && apptCounter % 5 !== 0;

          const appointmentId = randomUUID();
          appointmentRows.push({
            id: appointmentId,
            client_id: client.userId,
            professional_id: prof.professionalId,
            service_id: service.id,
            start_datetime: start,
            end_datetime: end,
            status,
            notes: NOTE_OPTIONS[apptCounter % NOTE_OPTIONS.length],
            cancellation_reason: status === 'cancelled' ? CANCEL_REASONS[apptCounter % CANCEL_REASONS.length] : null,
            amount: service.price,
            payment_status: isPaid ? 'paid' : 'pending',
            payment_method: isPaid ? PAYMENT_METHODS[apptCounter % PAYMENT_METHODS.length] : null,
            paid_at: isPaid ? new Date(start.getTime() + 30 * 60000) : null,
            created_at: start,
            updated_at: start,
          });

          if (status === 'completed' && apptCounter % 2 === 0) {
            const template = CLINICAL_NOTE_TEMPLATES[apptCounter % CLINICAL_NOTE_TEMPLATES.length];
            clinicalRecordRows.push({
              id: randomUUID(),
              patient_id: client.userId,
              professional_id: prof.professionalId,
              content: template(service.name),
              created_at: new Date(start.getTime() + 60 * 60000),
              updated_at: new Date(start.getTime() + 60 * 60000),
            });
          }
        });
      }

      // today's appointments: elapsed slots are resolved (completed/paid), later ones stay confirmed —
      // this is the one day the past/future loops above never touch (offset 0), and it's what lets the
      // "en curso" / "por atender hoy" widgets show something real instead of an empty day.
      if (prof.dayOfWeek.includes(today.getUTCDay()) && !blocked.has(todayKeyStr)) {
        prof.slots.forEach((slot, slotIndex) => {
          const service = nextService();
          const client = nextClient();
          const start = atTime(today, slot);
          const end = new Date(start.getTime() + service.durationMinutes * 60000);
          const elapsed = end.getTime() <= now.getTime();
          const status = elapsed ? 'completed' : 'confirmed';
          const isPaid = elapsed && (prof.slots.length * professionalRecords.indexOf(prof) + slotIndex) % 3 !== 0;

          appointmentRows.push({
            id: randomUUID(),
            client_id: client.userId,
            professional_id: prof.professionalId,
            service_id: service.id,
            start_datetime: start,
            end_datetime: end,
            status,
            notes: null,
            cancellation_reason: null,
            amount: service.price,
            payment_status: isPaid ? 'paid' : 'pending',
            payment_method: isPaid ? PAYMENT_METHODS[slotIndex % PAYMENT_METHODS.length] : null,
            paid_at: isPaid ? new Date(start.getTime() + 30 * 60000) : null,
            created_at: start,
            updated_at: start,
          });

          if (elapsed) {
            const template = CLINICAL_NOTE_TEMPLATES[slotIndex % CLINICAL_NOTE_TEMPLATES.length];
            clinicalRecordRows.push({
              id: randomUUID(),
              patient_id: client.userId,
              professional_id: prof.professionalId,
              content: template(service.name),
              created_at: new Date(start.getTime() + 60 * 60000),
              updated_at: new Date(start.getTime() + 60 * 60000),
            });
          }
        });
      }

      // future appointments: one slot per active day (leaves the 2nd slot free to demo booking)
      for (let offset = 1; offset <= FUTURE_DAYS; offset += 1) {
        const day = addDays(today, offset);
        if (!prof.dayOfWeek.includes(day.getUTCDay())) continue;
        if (blocked.has(day.toISOString().slice(0, 10))) continue;

        const service = nextService();
        const client = nextClient();
        const start = atTime(day, prof.slots[0]);
        const end = new Date(start.getTime() + service.durationMinutes * 60000);

        appointmentRows.push({
          id: randomUUID(),
          client_id: client.userId,
          professional_id: prof.professionalId,
          service_id: service.id,
          start_datetime: start,
          end_datetime: end,
          status: 'confirmed',
          notes: null,
          cancellation_reason: null,
          amount: service.price,
          payment_status: 'pending',
          payment_method: null,
          paid_at: null,
          created_at: now,
          updated_at: now,
        });
      }
    });

    await queryInterface.bulkInsert('appointments', appointmentRows);
    await queryInterface.bulkInsert('clinical_records', clinicalRecordRows);

    // ---- support requests ----
    const adminUsers = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@sistema-turnos.dev' LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const adminId = adminUsers[0]?.id ?? null;

    const supportRows = [
      {
        userId: clientRecords[0].userId,
        subject: 'Consulta sobre horarios de atención',
        message: '¿Los sábados hay turnos disponibles con algún profesional?',
        status: 'open',
        daysAgo: 6,
      },
      {
        userId: clientRecords[1].userId,
        subject: 'Necesito reprogramar un turno',
        message: 'Me surgió un imprevisto y necesito cambiar la fecha de mi próximo turno.',
        status: 'closed',
        daysAgo: 9,
      },
      {
        userId: professionalRecords[1].userId,
        subject: 'Problema al cargar disponibilidad',
        message: 'Tuve un error al intentar agregar una franja horaria nueva, ¿podrían revisar?',
        status: 'closed',
        daysAgo: 8,
      },
      {
        userId: clientRecords[4].userId,
        subject: 'No recibí confirmación por email',
        message: 'Reservé un turno pero no me llegó ningún correo de confirmación.',
        status: 'open',
        daysAgo: 3,
      },
      {
        userId: clientRecords[7].userId,
        subject: 'Consulta sobre métodos de pago',
        message: '¿Puedo pagar el turno con transferencia antes de la consulta?',
        status: 'open',
        daysAgo: 1,
      },
      {
        userId: professionalRecords[3].userId,
        subject: 'Agregar nuevo servicio a mi perfil',
        message: 'Quisiera ofrecer también radiografías, ¿cómo lo solicito?',
        status: 'closed',
        daysAgo: 12,
      },
    ];

    if (adminId) {
      await queryInterface.bulkInsert(
        'support_requests',
        supportRows.map((r) => {
          const createdAt = addDays(now, -r.daysAgo);
          return {
            id: randomUUID(),
            user_id: r.userId,
            subject: r.subject,
            message: r.message,
            status: r.status,
            created_at: createdAt,
            updated_at: r.status === 'closed' ? new Date(createdAt.getTime() + 3600000) : createdAt,
          };
        }),
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('support_requests', null, {});
    await queryInterface.bulkDelete('clinical_records', null, {});
    await queryInterface.bulkDelete('appointments', null, {});
    await queryInterface.bulkDelete('availability_exceptions', null, {});
    await queryInterface.bulkDelete('availabilities', null, {});
    await queryInterface.bulkDelete('professional_services', null, {});
    await queryInterface.bulkDelete('services', null, {});
    await queryInterface.bulkDelete('professionals', null, {});
    await queryInterface.bulkDelete('users', { role: ['professional', 'client'] });
  },
};
