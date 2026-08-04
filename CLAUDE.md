# Clinic Management System — CLAUDE.md

Repo: `clinic-management-system`. Ver estado general del portfolio en el repo separado `workana-portfolio-tracker` (`../workana-portfolio-tracker/PORTFOLIO.md`, privado, github.com/mfkutz/workana-portfolio-tracker) — se movió ahí para poder sincronizarlo entre PCs con git en vez de copiarlo a mano.

Empezó como un "sistema de turnos" genérico (el branding dentro de la app todavía dice "Sistema de Turnos") y fue creciendo hasta ser un sistema de gestión de clínica más completo — de ahí el nombre del repo, elegido a propósito para que se vea más competitivo en el portfolio que un simple booking system.

## Alcance definido

- **Un solo negocio**, con **varios profesionales** atendiendo (ej: consultorio con varios odontólogos, peluquería con varios estilistas).
- **Self-service**: el cliente se registra y reserva su propio turno viendo la disponibilidad real del profesional (tipo Calendly).

## Stack

- Front: React + TypeScript, Zustand, React Hook Form + Zod, Axios, TailwindCSS
- Back: Node + Express + TypeScript, PostgreSQL + Sequelize, JWT (auth)

## Referencia de sistema similar (GenaSIS, gestión odontológica) — solo anotado, no implementado

El usuario mostró un sistema real de gestión para consultorios (odontología) como referencia de qué tan completo puede llegar a ser un sistema de este tipo. Se anota el menú para tenerlo en cuenta a futuro (no implica que se vaya a construir todo esto, es una lista de ideas):

- Panel de control
- Agenda de hoy
- Agenda semanal
- Agenda mensual
- Pacientes
- Prestaciones
- Historias clínicas
- Cobros
- Reportes

**Vista de agenda a tener en cuenta para más adelante** (no implementar todavía, solo referencia visual): calendario tipo "columnas por día" con franjas horarias en el eje vertical (cada 30min) y una barra de color por turno indicando su estado (gris = pendiente, azul = confirma que asiste, naranja = urgente/ausente con aviso), con el nombre del paciente/cliente dentro de cada bloque. Es una forma más visual de mostrar la agenda que la lista simple que tiene hoy `ProfessionalAgendaPage`.

## Modelo de datos

### User
| campo | tipo | notas |
|---|---|---|
| id | UUID/PK | |
| name | string | |
| email | string, unique | |
| password_hash | string | |
| phone | string | nullable, útil para WhatsApp |
| role | enum: `admin`, `professional`, `client` | |
| active | boolean | default true |
| created_at / updated_at | timestamp | |

### Professional
Perfil extendido, 1:1 con `User` cuando `role = professional`.

| campo | tipo | notas |
|---|---|---|
| id | UUID/PK | |
| user_id | FK → User, unique | |
| specialty | string | ej. "Odontología general" |
| bio | text | nullable |
| color | string | color para el calendario en el front |
| active | boolean | permite desactivar sin borrar |

### Service (servicio)
| campo | tipo | notas |
|---|---|---|
| id | UUID/PK | |
| name | string | ej. "Consulta general", "Corte + barba" |
| description | text | nullable |
| duration_minutes | integer | duración default |
| price | decimal | |
| active | boolean | |

### ProfessionalService (N:M)
Un profesional puede ofrecer varios servicios; un servicio puede ser ofrecido por varios profesionales, con posibilidad de override.

| campo | tipo | notas |
|---|---|---|
| id | UUID/PK | |
| professional_id | FK → Professional | |
| service_id | FK → Service | |
| price_override | decimal | nullable, si no usa el precio del Service |
| duration_override | integer | nullable |

### Availability (disponibilidad recurrente semanal)
| campo | tipo | notas |
|---|---|---|
| id | UUID/PK | |
| professional_id | FK → Professional | |
| day_of_week | integer 0-6 | 0=domingo |
| start_time | time | |
| end_time | time | |

### AvailabilityException (excepciones puntuales)
Feriados, días libres, horario extendido un día específico.

| campo | tipo | notas |
|---|---|---|
| id | UUID/PK | |
| professional_id | FK → Professional | |
| date | date | |
| start_time | time | nullable si bloquea el día completo |
| end_time | time | nullable si bloquea el día completo |
| is_blocked | boolean | true = no disponible en ese rango, false = disponibilidad extra |

### Appointment (turno)
| campo | tipo | notas |
|---|---|---|
| id | UUID/PK | |
| client_id | FK → User (role client) | |
| professional_id | FK → Professional | |
| service_id | FK → Service | |
| start_datetime | timestamp | |
| end_datetime | timestamp | calculado a partir de la duración del servicio |
| status | enum: `confirmed`, `cancelled`, `completed`, `no_show` | se crea directamente en `confirmed` |
| notes | text | nullable, notas del cliente al reservar |
| cancellation_reason | text | nullable |
| created_at / updated_at | timestamp | |

### Notification (log) — fase 2
| campo | tipo | notas |
|---|---|---|
| id | UUID/PK | |
| appointment_id | FK → Appointment | |
| channel | enum: `email`, `whatsapp` | |
| status | enum: `sent`, `failed` | |
| sent_at | timestamp | |

## Relaciones (resumen)

- `User` 1:1 `Professional` (solo si role=professional)
- `Professional` N:M `Service` vía `ProfessionalService`
- `Professional` 1:N `Availability`
- `Professional` 1:N `AvailabilityException`
- `User(client)` 1:N `Appointment`
- `Professional` 1:N `Appointment`
- `Service` 1:N `Appointment`

## Reglas de negocio clave

- **Flujo de estado del turno**: `confirmed` (automático al reservar, no pasa por `pending`) → `completed` (automático vía cron al pasar `end_datetime`) | `cancelled` (el cliente puede cancelar hasta 24hs antes de `start_datetime`; el profesional/admin puede cancelar en cualquier momento) | `no_show` (el profesional lo marca manualmente post-horario, para los casos en que el cliente no se presentó y no cancela).
- **Cancelación del cliente**: solo permitida si `start_datetime - now() >= 24h`. Se valida en el backend al recibir la request de cancelación (no confiar en el front).
- **Cron de cierre automático**: job periódico (ej. cada 15-30 min) que busca turnos `confirmed` con `end_datetime < now()` y los pasa a `completed`.
- **Anti solapamiento**: antes de crear un turno, verificar que el rango `[start_datetime, end_datetime)` no se superponga con otro turno `confirmed` del mismo profesional. Se valida en una transacción en el backend (no alcanza con validar en el front).
- La disponibilidad real de un profesional en una fecha = `Availability` del día de la semana correspondiente, menos lo bloqueado por `AvailabilityException`, menos los `Appointment` ya ocupados.

## Decisiones confirmadas

- Turno queda `confirmed` automáticamente al reservar (no requiere aprobación del profesional).
- El cliente puede cancelar hasta 24hs antes del turno.
- El pase a `completed` es automático vía cron (no manual).

## Backend — estado actual

Carpeta: `backend/`. Node v24 + TypeScript 7 (moduleResolution/module: `node16`), Express 5.

- `src/config/env.ts` y `env.example` — variables de entorno (server, DB, JWT, CORS).
- `src/config/database.ts` — instancia de Sequelize para runtime.
- `config/config.js` + `.sequelizerc` — config de `sequelize-cli` (migraciones en `src/database/migrations`, seeders en `src/database/seeders`).
- `src/models/` — los 7 modelos del modelo de datos (User, Professional, Service, ProfessionalService, Availability, AvailabilityException, Appointment) con asociaciones en `models/index.ts`. `Notification` (fase 2) todavía no se creó.
- `src/database/migrations/` — migración por tabla, ya escritas y listas para correr contra una DB real.
- `src/middlewares/auth.ts` — `authenticate` (verifica JWT) y `authorize(...roles)` (guard por rol).
- `src/middlewares/errorHandler.ts` — manejo centralizado de errores (incluye `ZodError`).
- `src/jobs/completeAppointments.job.ts` — cron cada 15 min que pasa turnos `confirmed` vencidos a `completed`.
- `src/app.ts` / `src/server.ts` — Express app + bootstrap (conecta a DB, agenda el cron, levanta el server).
- Verificado: `npx tsc --noEmit` sin errores, y `node dist/server.js` arranca y falla solo por `ECONNREFUSED` (no hay Postgres local corriendo todavía) — el código está OK.

**Base de datos**: PostgreSQL corre vía Docker (`docker-compose.yml` en la raíz del proyecto, servicio `db`, puerto 5432, credenciales dev en `.env`). Levantar con `docker compose up -d` desde `sistema-turnos/`. Las 7 migraciones ya corrieron OK contra esta base (`npm run migrate` desde `backend/`). Verificado además que el server completo (`node dist/server.js`) conecta a la DB y queda escuchando en `:4000` sin errores.

- `src/utils/password.ts` / `src/utils/jwt.ts` — hashing (bcrypt) y firma de JWT.
- `src/validation/authSchemas.ts` — schemas Zod de registro/login.
- `src/controllers/authController.ts` + `src/routes/auth.routes.ts` — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (protegida). El registro público siempre crea `role: client` (no se puede elegir rol desde el body, por seguridad); `admin`/`professional` se van a crear por otra vía (seed o panel admin), todavía no implementada.
- Probado end-to-end contra la DB real: registro, login, `/me` con el JWT, y registro duplicado devolviendo 409.

- `src/validation/serviceSchemas.ts` + `src/controllers/serviceController.ts` + `src/routes/service.routes.ts` — `GET /api/services` y `GET /api/services/:id` (públicos, solo activos en el listado), `POST/PATCH/DELETE` (admin). `DELETE` es soft delete (`active: false`), no borra la fila.
- `src/validation/professionalSchemas.ts` + `src/controllers/professionalController.ts` + `src/routes/professional.routes.ts` — `GET /api/professionals` y `GET /api/professionals/:id` (públicos, con `user` y `services` anidados), `POST` (admin, crea `User(role=professional)` + `Professional` en una transacción), `PATCH`/`DELETE` (admin, soft delete), `POST/DELETE /api/professionals/:id/services` (admin, asigna/desasigna servicios vía `ProfessionalService`, 409 si ya estaba asignado).
- `src/database/seeders/20260802130001-demo-admin.js` — seeder de un usuario `admin` para dev (`admin@sistema-turnos.dev` / `admin12345`). No hay endpoint público para crear admins (por diseño, es un riesgo de seguridad); se crean solo por seeder o directo en DB.
- Probado end-to-end: login admin → crear servicio → 401 sin token → crear profesional (con transacción) → asignar servicio → listado público con datos anidados → 403 cuando un `client` intenta un endpoint de admin.

- `src/validation/availabilitySchemas.ts` + `src/controllers/availabilityController.ts` — endpoints anidados bajo `/api/professionals/:id/availability` y `/api/professionals/:id/availability-exceptions`, montados en `professional.routes.ts`.
  - `GET` de ambos es público (necesario para que el cliente vea horarios al reservar).
  - `POST`/`DELETE` requieren estar autenticado **y** ser `admin` **o** el propio profesional dueño del recurso (chequeo `loadOwnedProfessional` comparando `professional.userId` con `req.user.id`, no un `authorize(role)` fijo).
  - Crear `Availability` valida que no se solape con otra franja ya cargada para el mismo `dayOfWeek` (409 si se superpone).
  - Crear `AvailabilityException` valida vía Zod: si `isBlocked: false` (disponibilidad extra) requiere `startTime`/`endTime`; si `isBlocked: true` puede bloquear el día completo (sin horario) o un rango.
  - Probado end-to-end: alta propia, solapamiento (409), alta por admin en nombre del profesional, otro profesional bloqueado (403), listado público, excepción de día completo, excepción inválida (400), borrado (204).

## Arquitectura: capa de servicio

Todo el backend sigue el mismo patrón: `controllers/` es una capa fina (valida input con Zod, llama al service correspondiente, arma la respuesta HTTP) y `services/` tiene toda la lógica de negocio y acceso a datos, sin conocer Express. Se armó primero para turnos (la lógica más compleja) y después se llevó `auth`, `services` (catálogo) y `professionals`/`availability` al mismo patrón para que el proyecto quede consistente de cara al portfolio.

- `src/services/authService.ts` — `register`, `login`, `getCurrentUser`. Serialización de usuario (`toPublicUser`, sin `passwordHash`) en `src/utils/serializers.ts`.
- `src/services/catalogService.ts` — CRUD del catálogo de `Service` (se llama "catalog" y no "service" para no confundir con el modelo `Service`).
- `src/services/professionalService.ts` — CRUD de `Professional` + alta/baja de `ProfessionalService`. Expone `getOrThrow(id)`, reutilizado por `availabilityService`.
- `src/services/availabilityService.ts` — CRUD de `Availability`/`AvailabilityException`, con el chequeo de ownership (`admin` o el propio profesional) centralizado en `assertOwnerOrAdmin`.
- `src/services/scheduleService.ts` + `src/services/appointmentService.ts` — como se describe abajo.
- Verificado: `npx tsc --noEmit` sin errores y una regresión completa end-to-end (auth, servicios, profesionales, disponibilidad, turnos) contra la DB real dio exactamente el mismo comportamiento que antes del refactor.

## Turnos (booking)

- `src/services/scheduleService.ts` — lógica **pura** (sin DB, sin Express) de cálculo de horarios: dado un set de `Availability` + `AvailabilityException` + rangos ocupados, calcula los slots libres para una duración de servicio dada. Fácil de testear unitariamente aislado.
- `src/services/appointmentService.ts` — capa de negocio con acceso a datos: `getFreeSlots`, `createAppointment` (valida que el slot siga libre, corre en una transacción con `isolationLevel: SERIALIZABLE` y reintenta como 409 si Postgres detecta una condición de carrera — dos clientes reservando el mismo horario en simultáneo), `cancelAppointment` (reglas de 24hs para `client`, sin restricción para `professional`/`admin`, valida ownership), `listForRequester` (devuelve turnos según el rol de quien pregunta).
- `src/validation/appointmentSchemas.ts` + `src/controllers/appointmentController.ts` + `src/routes/appointment.routes.ts`:
  - `GET /api/appointments/available-slots?professionalId=&serviceId=&date=` (público)
  - `POST /api/appointments` (autenticado, solo `client`)
  - `GET /api/appointments/me` (autenticado, cualquier rol — devuelve lo que le corresponde)
  - `PATCH /api/appointments/:id/cancel` (autenticado, ownership + regla de 24hs validada en el service)
- **Simplificación conocida**: no hay manejo de zona horaria — todas las fechas/horas se calculan e interpretan en UTC (`date + 'T' + time + 'Z'`). Para un negocio real en una sola zona horaria (ej. Argentina) esto es una limitación a resolver antes de producción; no bloquea el uso como pieza de portfolio.
- Probado end-to-end contra la DB real: generación de 18 slots (ventana de 9hs / servicio de 30min), reserva, slot desaparece del listado tras reservar, doble reserva del mismo horario (409, incluso bajo la transacción serializable), reserva en el pasado (400), listado `/me`, cancelación propia con +24hs (200), cancelación con -24hs por `client` (400) vs. por `professional` sin esa restricción (200), re-cancelar un turno ya cancelado (400), y bloqueo total de slots por excepción de día completo.

## Frontend — estado actual

Carpeta: `frontend/`. Vite + React 19 + TypeScript, Tailwind v4 (vía `@tailwindcss/vite`, sin `postcss.config`/`tailwind.config` — configuración por defecto de v4).

- **Stack instalado**: `zustand`, `react-hook-form` + `@hookform/resolvers` + `zod`, `axios`, `react-router-dom`.
- `src/api/client.ts` — instancia de Axios (`VITE_API_URL`, default `http://localhost:4000/api`), interceptor que agrega el JWT desde el store y hace `logout()` automático en un 401. `getErrorMessage()` extrae el `message` del backend para mostrar errores de forma consistente.
- `src/stores/authStore.ts` — Zustand con `persist` (localStorage) para `token`/`user`.
- `src/api/auth.ts` + `src/validation/authSchemas.ts` — llamadas a `/auth/*` y schemas Zod que espejan los del backend (mismo mensaje de validación, para UX consistente).
- `src/routes/ProtectedRoute.tsx` — redirige a `/login` si no hay sesión; soporta `allowedRoles` para restringir por rol (todavía no usado, pensado para el panel admin/profesional).
- `src/pages/LoginPage.tsx` / `RegisterPage.tsx` — formularios con RHF + `zodResolver`, muestran errores de validación por campo y errores del server.
- `src/pages/HomePage.tsx` — placeholder post-login con saludo y rol.
- `src/components/layout/Layout.tsx` + `src/App.tsx` — nav con estado de sesión (login/registro vs. nombre+logout) y router (`/login`, `/register`, `/` protegida).
- **Nota de seguridad aceptada**: `npm audit` marca un advisory "alto" en `react-router-dom` sobre CSRF en modo RSC (React Server Components/server actions). No aplica: esta es una SPA 100% client-side con `<BrowserRouter>`, sin RSC ni server actions. Se dejó en la última versión (7.18.2) a propósito, en vez de bajar a una versión vieja que sí tiene vulnerabilidades reales aplicables.
- Verificado: `npm run build` (type-check + build) sin errores. Probado en un browser real (Playwright headless, ad-hoc, no forma parte del repo): login renderiza con estilos, registro → redirect a `/` con saludo personalizado, logout → redirect a `/login`, re-login funciona, y visitar `/` sin sesión redirige a `/login`. Cero errores de consola.

## Reserva de turnos (cliente) — frontend

- `src/api/professionals.ts` + `src/api/appointments.ts` — llamadas a `/professionals`, `/appointments/available-slots`, `/appointments` (crear), `/appointments/me`, `/appointments/:id/cancel`.
- `src/pages/BookingPage.tsx` (`/reservar`, protegida para `client`) — wizard de 5 pasos: profesional → servicio (con precio/duración, respetando `ProfessionalService.priceOverride`/`durationOverride`) → fecha → horario libre (`available-slots`) → confirmar con notas opcionales. Pantalla de éxito al confirmar.
- `src/pages/MyAppointmentsPage.tsx` (`/mis-turnos`, protegida para `client`) — lista todos los turnos del cliente con badge de estado (`confirmed`/`cancelled`/`completed`/`no_show`), motivo de cancelación si existe, y botón "Cancelar turno" (solo visible si `status === 'confirmed'`; el backend valida la regla de 24hs y devuelve el error si corresponde).
- Se le agregaron los `include` de `professional`+`user`+`service` a `appointmentService.listForRequester`/`createAppointment`/`cancelAppointment` en el backend, que antes devolvían solo IDs — sin eso el frontend no podía mostrar nombres.
- `ProtectedRoute` ahora soporta `allowedRoles` (usado para restringir `/reservar` y `/mis-turnos` a `client`).
- Probado end-to-end con Playwright headless real (login → reservar con las 5 elecciones → pantalla de confirmación → ver en "Mis turnos" con estado Confirmado → cancelar → ver estado Cancelado). Cero errores de consola en todo el flujo.

## Panel admin — frontend

- Backend: se agregaron `GET /api/services/all` y `GET /api/professionals/all` (admin-only), porque los endpoints públicos existentes solo devuelven registros `active`, y un admin necesita ver también los que desactivó (para poder reactivarlos). Registrados **antes** de la ruta `/:id` en ambos routers — si no, Express matchea `/all` como si `all` fuera un `:id`.
- `src/api/services.ts` (`listAll`, `create`, `update`) y `src/api/professionals.ts` (`listAll`, `create`, `update`, `addService`, `removeService`).
- `src/components/admin/AdminNav.tsx` — tabs Servicios/Profesionales.
- `src/pages/admin/AdminServicesPage.tsx` (`/admin/servicios`) — formulario crear/editar (mismo componente `ServiceForm`, alterna entre modos) + lista con toggle Activar/Desactivar (soft delete/restore).
- `src/pages/admin/AdminProfessionalsPage.tsx` (`/admin/profesionales`) — formulario de alta + lista con toggle activo, chips de servicios asignados (con quitar) y selector para asignar un nuevo servicio del catálogo.
- Rutas `/admin`, `/admin/servicios`, `/admin/profesionales` protegidas con `ProtectedRoute allowedRoles={['admin']}`. Nav link "Panel admin" y botón en `HomePage` visibles solo para `role === 'admin'`.

**Bugs encontrados y arreglados durante la verificación visual (Playwright)**, ninguno se hubiera visto solo con `tsc`/build:
1. `professionalService.create` en el backend no incluía `services` en el objeto devuelto (solo `user`) → el frontend asumía que `professional.services` siempre existe y crasheaba React al crear un profesional nuevo. Fix: reusar el include `withUserAndServices` también en `create`.
2. Los formularios de "Nuevo servicio" y "Nuevo profesional" no se vaciaban después de un submit exitoso — `reset()` de React Hook Form con campos en `undefined` no limpiaba los inputs numéricos como se esperaba. Fix: en vez de pelear con `reset()` imperativo, el formulario se extrajo a un componente hijo (`ServiceForm`/`ProfessionalForm`) montado con un `key` que cambia en cada submit exitoso — el remount de React garantiza un formulario limpio sin depender de la semántica de `reset()`.

Probado end-to-end con Playwright: crear servicio → editar (cambia precio) → desactivar → reactivar → crear profesional → asignar servicio → quitar servicio, todo sin errores de consola y con los formularios limpiándose correctamente.

## Panel profesional — frontend

- Backend: nuevo `GET /api/professionals/me` (autenticado, solo `professional`) para que el propio profesional resuelva su `professionalId` sin depender del listado público. Registrado antes de `/:id` en el router, mismo motivo que `/all`. Se agregó también el include de `client` (`user`) a `appointmentDetailIncludes` en `appointmentService`, que antes solo traía `professional`+`service` — sin eso la agenda del profesional no podía mostrar quién era el cliente.
- `src/api/professionals.ts` (`getMe`) y `src/api/availability.ts` (nuevo: CRUD de `Availability`/`AvailabilityException`, no existía ninguna llamada del frontend a esos endpoints hasta ahora).
- `src/components/professional/ProfessionalNav.tsx` — tabs Disponibilidad/Agenda.
- `src/pages/professional/ProfessionalAvailabilityPage.tsx` (`/profesional/disponibilidad`) — dos secciones: franjas horarias semanales (día + desde/hasta) y excepciones (fecha + bloquear día completo o cargar horario extra), cada una con su form (patrón de remount por `key`, mismo fix que en el panel admin) y lista con "Quitar".
- `src/pages/professional/ProfessionalAgendaPage.tsx` (`/profesional/agenda`) — reutiliza `GET /api/appointments/me` (ya filtraba por profesional en el backend) pero ahora muestra nombre/teléfono del cliente y notas del turno; permite cancelar sin la restricción de 24hs que sí aplica al cliente.
- Rutas `/profesional`, `/profesional/disponibilidad`, `/profesional/agenda` protegidas con `allowedRoles={['professional']}`. Nav link y CTA en `HomePage` solo para ese rol.
- Probado end-to-end con Playwright (dos sesiones de browser en paralelo: cliente reserva un turno nuevo → profesional lo ve en su agenda con nombre/teléfono → lo cancela sin problema pese a estar a menos de 24hs; además alta/baja de disponibilidad semanal y de una excepción). Cero errores de consola.

Con esto el frontend cubre los tres roles (`client`, `admin`, `professional`) de punta a punta.

## Layout: sidebar por rol

A pedido explícito (los tabs sueltos por panel se veían poco profesionales), se reemplazó el nav horizontal + `AdminNav`/`ProfessionalNav` por un layout de sidebar persistente, más parecido a un dashboard real (Stripe/Vercel style):

- `src/components/layout/Sidebar.tsx` — sidebar fijo de 240px con logo arriba, ítems de navegación según `user.role` (`navByRole`), y abajo un bloque con avatar (iniciales), nombre, rol y botón de logout. Item activo resaltado con `NavLink`.
- `src/components/layout/Layout.tsx` — si no hay sesión, layout centrado simple (para `/login` y `/register`, sin sidebar); si hay sesión, `flex` de `Sidebar` + `<main>` con el contenido de la ruta activa.
- Se eliminaron `AdminNav.tsx` y `ProfessionalNav.tsx` (ya no hacían falta) y los títulos redundantes "Panel admin"/"Panel profesional" en cada página — ahora cada página tiene su propio título corto (Servicios, Profesionales, Disponibilidad, Agenda) y el contexto de "estás en el panel de X" lo da el sidebar.
- `HomePage` se simplificó (sin botones CTA duplicados, la navegación ya está en el sidebar).
- Probado visualmente con Playwright en los tres roles + la pantalla de login sin sesión. Sin errores de consola.

## Rediseño visual: shell tipo dashboard profesional (referencia "Zendenta")

El usuario pasó una captura de un template real de gestión de clínicas (Zendenta) pidiendo replicar el shell (sidebar + header) "casi pixel perfect", autorizando explícitamente hardcodear secciones/datos que no existen todavía si eso ayuda a que se vea más completo — la prioridad es la impresión visual para el portfolio, no que cada ítem del menú tenga funcionalidad real.

- Se agregó `lucide-react` (librería de íconos) — necesaria para el look de la referencia, no estaba en el stack original.
- `src/lib/navConfig.ts` — configuración centralizada: `navSections` (secciones + ítems de menú por rol, con ícono) y `pageTitles` (mapeo ruta → título, usado por el header). Cada ítem puede ser real (`to` a una ruta funcional) o `comingSoon: true` (decorativo, con badge "Pronto").
- **Sidebar** (`src/components/layout/Sidebar.tsx`, reescrito): logo + botón de colapsar (funcional, icon-only cuando está colapsado), tarjeta de "clínica" hardcodeada (Building2 + "Clínica Dental Sonrisas" / dirección — no existe un modelo de negocio/clínica en el backend, es puramente decorativo), navegación agrupada por secciones con label uppercase, ítem activo con `bg-indigo-600` sólido. Los ítems `comingSoon` (Pacientes, Historias clínicas, Cobros, Reportes, Soporte — nombres tomados del menú de GenaSIS que se había anotado antes) navegan a una página real `/proximamente` en vez de ser links muertos.
- **`src/pages/ComingSoonPage.tsx`** + ruta `/proximamente` (protegida, cualquier rol) — evita 404 en los ítems decorativos.
- **Header** (`src/components/layout/TopHeader.tsx`, nuevo): título de página dinámico (desde `pageTitles`), buscador decorativo (sin backend), botón "+" de acción rápida (link contextual según rol: cliente→reservar, admin→servicios, profesional→disponibilidad), íconos de ayuda/notificaciones/configuración (decorativos), y el bloque de usuario (avatar con iniciales + nombre + rol + dropdown) — antes estaba abajo del sidebar, ahora está arriba a la derecha como en la referencia. El logout se movió al dropdown del usuario.
- **`Layout.tsx`**: orquesta el estado de colapso del sidebar (`useState`, compartido entre `Sidebar` y el botón hamburguesa del header), y envuelve el contenido de cada página en una card blanca (`rounded-2xl border shadow-sm`) sobre fondo gris claro — mismo patrón que la referencia. Los invitados (login/registro) siguen sin sidebar, con una card centrada simple.
- Se sacaron los `<h1>` redundantes de cada página (Servicios, Profesionales, Disponibilidad, Agenda, Mis turnos, Reservar turno) porque el título ahora vive en el header — evita duplicación.
- Probado end-to-end con Playwright en los tres roles + colapsar/expandir sidebar + dropdown de usuario + logout + navegación a un ítem "Próximamente". Cero errores de consola.

**Feedback del usuario tras probarlo**: el login/registro se había quedado con el estilo viejo (inputs grises básicos, sin la marca) mientras el resto de la app ya tenía el rediseño — se sentía inconsistente ("todo azul", "no veo cambios"). Se actualizaron `LoginPage.tsx`/`RegisterPage.tsx` (inputs `rounded-lg` con focus ring indigo, error inline con fondo, botón con el mismo estilo que el resto) y `Layout.tsx` (rama sin sesión) para mostrar el mismo brand mark (ícono `CalendarClock` en cuadrado indigo) que el sidebar, en vez de solo texto.

## Pacientes (primera sección "Pronto" que se volvió real)

El sistema no tenía un concepto separado de "paciente" — los `client` que reservan turnos son, en la práctica, los pacientes. En vez de crear un modelo nuevo, "Pacientes" se construyó como una vista agregada sobre datos que ya existían (`User` + `Appointment`), sin hardcodear nada.

- `backend/src/services/patientService.ts` — `listForRequester` (admin ve todos los `User` con `role: client`; profesional ve solo los clientes con los que tuvo al menos un turno, vía `GROUP BY client_id` sobre `Appointment` con su `professionalId`) y `getDetailForRequester` (info del paciente + historial de turnos; si un profesional pide el detalle de alguien con quien nunca tuvo turnos, 404 — es la forma natural de aplicar el scope sin un chequeo aparte). Devuelve `appointmentsCount` y `lastVisit` calculados con `fn('COUNT', ...)`/`fn('MAX', ...)` de Sequelize.
- `GET /api/patients` y `GET /api/patients/:id` (autenticado, `admin` o `professional` — nunca `client`), montadas en `patient.routes.ts`.
- Frontend: `src/api/patients.ts`, `src/pages/PatientsPage.tsx` (primera vez que se usa una `<table>` real en vez de listas de `<li>`, para que se vea más "dashboard" — columnas Paciente/Teléfono/Turnos/Última visita), `src/pages/PatientDetailPage.tsx` (historial completo con estado de cada turno).
- Se extrajo `src/lib/appointmentStatus.ts` (labels/clases de los badges de estado) porque ya se repetía en 3 páginas distintas (`MyAppointmentsPage`, `ProfessionalAgendaPage`, y ahora `PatientDetailPage`) — recién ahí se justificaba sacarlo a un helper compartido.
- En `navConfig.ts`, "Pacientes" pasó de `comingSoon: true` a un link real (`/pacientes`) para `admin` y `professional`. "Historias clínicas", "Cobros", "Reportes" y "Soporte" siguen como "Pronto".
- Probado end-to-end con Playwright: admin ve todos los pacientes, profesional ve solo los suyos (verificado que la lista da distinto tamaño para cada rol), detalle con historial completo. Cero errores de consola.

## Bug de modo oscuro (resuelto)

El usuario reportó "todo se ve azul oscuro" después del rediseño — no era un bug de código sino que el navegador/SO del usuario está en modo oscuro del sistema, y Tailwind por defecto activa las clases `dark:` según `prefers-color-scheme`. Como el objetivo es que la app coincida pixel a pixel con la referencia (que es clara) sin importar el SO del usuario, se agregó en `src/index.css`:
```css
@custom-variant dark (&:where(.dark, .dark *));
```
Esto hace que las clases `dark:` (que quedaron en el código) solo se activen si algo le agrega la clase `dark` al `<html>` — cosa que hoy no pasa nunca, así que la app siempre se ve en modo claro. Verificado con Playwright forzando `colorScheme: 'dark'` a nivel navegador: la app se mantiene clara.

## Historias clínicas y Soporte (segunda y tercera sección "Pronto" que se volvieron reales)

A diferencia de Pacientes (que reusaba datos existentes), estas dos necesitaron modelos nuevos.

**Historias clínicas** — notas clínicas por paciente, cargadas por el profesional que lo atendió:
- Migración `20260802120008-create-clinical-records.js` + modelo `ClinicalRecord.ts` (`patientId`, `professionalId`, `content`). Asociaciones: `User.hasMany(ClinicalRecord, as: 'clinicalRecords')` / `Professional.hasMany(...)`.
- `backend/src/services/clinicalRecordService.ts` — `listForPatient` (admin ve todo; profesional solo si atendió a ese paciente, mismo patrón de "404 si nunca lo atendió" que ya se usaba en `patientService`), `createForPatient` (solo `professional`, valida que haya atendido a ese paciente antes de dejarlo escribir una nota), `listRecentForRequester` (actividad global: admin ve todas, profesional solo las suyas). Reutiliza `professionalService.getByUserId` en vez de redefinir el helper de "resolver profesional desde userId" por cuarta vez.
- Rutas: `GET/POST /api/patients/:id/clinical-records` (anidadas, en `patient.routes.ts`) y `GET /api/clinical-records` (actividad reciente, `clinicalRecord.routes.ts`).
- Frontend: `PatientDetailPage` ahora tiene una sección "Historia clínica" (lista + form para agregar nota, solo visible si `role === 'professional'`); nueva `ClinicalRecordsPage.tsx` en `/historias-clinicas` (actividad reciente entre pacientes, cada nota linkea al detalle del paciente).

**Soporte** — solicitudes de soporte reales (no un formulario que no hace nada):
- Migración `20260802120009-create-support-requests.js` + modelo `SupportRequest.ts` (`userId`, `subject`, `message`, `status: open|closed`).
- `backend/src/services/supportRequestService.ts` — `create` (cualquier rol autenticado), `listForRequester` (admin ve todas con el nombre de quien la mandó; el resto solo ve las propias — mismo patrón `where` condicional que ya se usa en `appointmentService`/`patientService`), `resolve` (solo admin, pasa a `closed`).
- Rutas en `supportRequest.routes.ts`: `POST/GET /api/support-requests`, `PATCH /api/support-requests/:id/resolve`.
- Frontend: `SupportPage.tsx` en `/soporte` — formulario de contacto arriba (para todos) + lista abajo ("Mis solicitudes" o "Todas las solicitudes" si es admin, con botón "Marcar resuelta").
- "Soporte" se agregó también a la navegación de `client` (antes solo tenía Reservar turno/Mis turnos) — tiene sentido que cualquier usuario pueda pedir ayuda, no solo staff.

Con esto, de los 5 ítems "Pronto" que se armaron con el menú de GenaSIS como referencia, quedan **Cobros** y **Reportes** como los únicos todavía decorativos.

## Refactors chicos hechos de paso

- `src/lib/appointmentStatus.ts` — labels/clases de los badges de estado de turno, extraído porque ya se repetía igual en 3 páginas (`MyAppointmentsPage`, `ProfessionalAgendaPage`, `PatientDetailPage`). Recién ahí se justificaba sacarlo a un helper compartido (antes, con 2 usos, no valía la pena).

## Cobros (cuarta sección "Pronto" que se volvió real)

A diferencia de Historias clínicas/Soporte (modelos nuevos), Cobros se construyó agregando campos de pago directo al `Appointment` existente — no se creó una tabla `Payment` separada (se lo planteamos al usuario como alternativa — "versión simple con campos en Appointment" vs. "modelo de pagos separado con historial/pagos parciales" — y se optó por la simple, más rápida y suficiente para portfolio).

- Migración `20260802120010-add-payment-fields-to-appointments.js`: agrega `amount` (decimal, nullable — los turnos viejos anteriores a esta migración quedan sin monto), `payment_status` (enum `pending`/`paid`, default `pending`), `payment_method` (string nullable), `paid_at` (nullable).
- **Importante**: `amount` se guarda como *snapshot* en el momento de crear el turno (no se calcula en vivo desde `Service.price`), igual que ya se hacía con `durationMinutes`. `appointmentService.resolveDurationMinutes` se renombró a `resolveServiceDetails` y ahora devuelve `{ durationMinutes, price }` en una sola resolución (usa `ProfessionalService.priceOverride ?? Service.price`), evitando una consulta duplicada. Esto es más correcto que derivarlo en vivo: si el precio del servicio cambia después, los turnos ya cobrados/pendientes mantienen el monto que correspondía en el momento de la reserva.
- `appointmentService.markAsPaid(appointmentId, paymentMethod?)` — solo admin (`PATCH /api/appointments/:id/pay`), 400 si ya estaba pagado.
- Frontend: `src/pages/admin/BillingPage.tsx` en `/cobros` (admin-only) — reutiliza `appointmentsApi.listMine()` (que para admin ya devolvía *todos* los turnos) filtrando a `confirmed`/`completed`, con un resumen arriba (total cobrado / pendiente + barra segmentada, mismo patrón visual que el widget de la referencia Zendenta) y una tabla con selector de método de pago + botón "Marcar cobrado" por fila.
- Probado end-to-end: turno nuevo queda con `amount` seteado automáticamente, admin lo marca cobrado con método, re-marcar como pagado falla (400), cliente no puede marcarlo (403).

## Dataset de prueba (seed completo)

El seeder original (`20260802130001-demo-admin.js`) solo creaba el usuario admin, dejando el sistema "pelado" para mostrarlo. Se agregó `backend/src/database/seeders/20260802130002-demo-full-dataset.js`, que genera un dataset completo como si la clínica estuviera en uso real: 5 profesionales (con especialidad/color/disponibilidad semanal propia), 14 pacientes, 11 servicios del catálogo, asignaciones profesional-servicio (algunas con override de precio/duración), 3 excepciones de disponibilidad, ~112 turnos (mezcla de `completed`/`cancelled`/`no_show` en el pasado y `confirmed` a futuro, con pagos `paid`/`pending`), ~37 historias clínicas y 6 solicitudes de soporte.

- Las fechas de turnos/excepciones se calculan en relación a `new Date()` al momento de correr el seed (no son fechas hardcodeadas), así que el dataset siempre tiene turnos pasados y futuros vigentes sin importar cuándo se ejecute.
- Se deja siempre un horario libre por día por profesional en el rango futuro, a propósito, para poder probar el flujo de reserva en vivo sin que esté todo ocupado.
- Credenciales (admin/profesionales/clientes) documentadas en `CREDENCIALES_DEMO.md` en la raíz del repo — todos los profesionales comparten password `profesional123` y todos los clientes `cliente123`.
- Correr con `npx sequelize-cli db:seed:all` desde `backend/`.
- **Bug corregido**: los loops de pasado (offset 14→1) y futuro (offset 1→14) nunca generaban turnos en el offset 0 (el día exacto en que se corre el seed), dejando "hoy" siempre vacío. Se agregó un bloque específico para el día de hoy que resuelve el estado según la hora actual (`completed`/pagado si el turno ya terminó, `confirmed` si no) — esto es lo que permite que el dashboard de Inicio (admin) tenga datos reales de "hoy", incluyendo el caso "en curso".

**Todavía no implementado / ideas anotadas para más adelante** (explícitamente fuera de scope por ahora):
- Vista de agenda tipo calendario (columnas por día, franjas horarias, barras de color por estado) — se mostró como referencia visual (capturas de GenaSIS) pero no se va a construir todavía; hoy `ProfessionalAgendaPage` sigue siendo una lista simple.
- **Reportes** sigue como el único ítem "Pronto" decorativo que queda en el sidebar — si se implementa, sacarle `comingSoon: true` en `navConfig.ts` y darle una página real (mismo patrón que el resto).

## Rediseño de UI — sección por sección (handoff desde Claude Design)

El usuario está rediseñando la app sección por sección a partir de mockups hechos con el design tool de Claude. El flujo de trabajo es: el usuario genera un "design handoff" (carpeta con `README.md` + `<Pantalla>.dc.html` con markup/estilos/datos mock + un `.html` standalone para previsualizar) y lo comparte; la tarea es recrear el diseño con fidelidad alta usando los patrones/librerías ya establecidos en el codebase (React + Tailwind arbitrary values para los tokens exactos, `lucide-react` en vez de Material Symbols — los nombres de ícono del handoff son solo orientativos), no copiar el HTML/CSS tal cual.

**Primera sección: Inicio (dashboard admin).** Reemplazó la pantalla vacía anterior (solo un saludo) por un dashboard operativo. Como el shell (sidebar/topbar) del mockup traía otra paleta/tipografía, se actualizó también `Sidebar.tsx`/`TopHeader.tsx`/`Layout.tsx` globalmente (decisión explícita del usuario) a los nuevos tokens: color primario `#5847eb`, tipografía "Plus Jakarta Sans" (Google Fonts, cargada en `index.html` + `@theme` en `index.css`), radios/espaciados del handoff. `Layout.tsx` ahora salta el wrapper de card blanca (`isFullBleed`) para una lista de rutas admin ya rediseñadas (`FULL_BLEED_ADMIN_PATHS`, hoy `/` y `/admin/servicios`), porque esas páginas manejan sus propias cards; el resto sigue con el wrapper de siempre. Cada vez que se rediseña una sección nueva con este mismo criterio, agregarla a esa lista.

- `src/pages/admin/AdminHomePage.tsx` — todo el contenido del dashboard. `HomePage.tsx` renderiza este componente solo si `role === 'admin'`; profesional/cliente por ahora conservan el saludo simple original (les toca el rediseño en otra iteración).
- Fetching simple (`appointmentsApi.listMine()` que para admin trae *todos* los turnos + `professionalsApi.list()`), todo el cómputo de KPIs/agenda/tendencia es client-side con `useMemo`, mismo patrón que `BillingPage`.
- **Qué quedó real** (derivado de datos existentes, sin endpoints nuevos): turnos de hoy/mañana/semana con estados reales y detección de "en curso" comparando contra la hora actual; ingresos del día y su variación vs. ayer; tasa de ausentismo (últimos 7 días vs. los 7 anteriores); cobros pendientes (monto real, link a `/cobros`); turno cancelado más reciente; carga de cada profesional hoy (real, normalizado contra el más ocupado del día, no una capacidad inventada); tendencia semanal (barras atendidos/programados).
- **Qué quedó mock/hardcodeado a propósito** (marcado con comentario `// Mock:` en el código, y con un `*` visible en la card de KPI): "Ocupación de agenda" (requeriría cruzar disponibilidad + excepciones + turnos, no implementado), "3 turnos sin confirmar" y "Insumo bajo: anestesia local" (no existen los conceptos de confirmación pendiente ni de inventario en el sistema), "Cumpleaños esta semana" (no hay campo de fecha de nacimiento en `User`; el propio handoff marca este widget como decorativo/placeholder a propósito).
- **Botones sin destino real todavía** (apuntan a `/proximamente`): "Exportar", "Ver agenda completa" (no existe una vista de agenda unificada para admin, solo `ProfessionalAgendaPage` por profesional), "Agendar turno" y "Nuevo paciente" desde Acciones rápidas (admin no tiene un flujo para crear turnos/pacientes manualmente, solo el auto-registro de clientes y la reserva self-service). "Nueva historia" apunta a `/pacientes` (lo más cercano real) pero el admin no puede crear historias clínicas directamente — el backend restringe `POST .../clinical-records` a `role: professional`.
- `src/lib/format.ts` (nuevo) — `formatMoney`, `getInitials`, `formatLongDateLabel` (fecha real del saludo, zona horaria del visitante) y `formatTimeLabel` (horario de turnos, fuerza `timeZone:'UTC'` y `hour12:false` para ser consistente con la convención UTC-naive del resto de la app).
- Verificado con Playwright: captura pixel-a-pixel contra el mockup, tabs Hoy/Mañana/Semana funcionando con datos reales, y regresión visual de que profesional/cliente y otra página de admin (`/admin/servicios`) no se rompieron. Cero errores de consola.

**Segunda sección: Servicios (catálogo, admin).** Reescrito completo (`AdminServicesPage.tsx`), agregado a `ADMIN_ONLY_FULL_BLEED_PATHS`.

- **Campo nuevo real agregado a propósito**: `category` en `Service` (enum `Consulta`/`Estética`/`Ortodoncia`/`Cirugía`/`Prevención`) — migración `20260803140001-add-category-to-services.js`, modelo (`SERVICE_CATEGORIES` exportado desde `models/Service.ts`), Zod (`serviceSchemas.ts` backend, `adminSchemas.ts` frontend). A diferencia de otros datos "de adorno" del handoff de Inicio, este campo se decidió hacer real (no heurística por nombre) porque es central a toda la pantalla (filtros, tarjetas, KPI, formulario) — se le preguntó al usuario y eligió esta opción explícitamente. El seeder de datos de prueba (`20260802130002-demo-full-dataset.js`) ya asigna categoría a los 11 servicios.
- **Todo lo demás quedó real, sin mocks nuevos**: KPIs (totales/activos/duración promedio/precio promedio, calculados de los servicios reales), búsqueda y filtro por categoría con contadores reales, toggle grilla/lista (ambas vistas implementadas — el handoff solo especificaba la de grilla, la de lista es una extensión simple en el mismo espíritu), alta/edición vía slide-over (`FormPanel`, mismo componente para ambos casos) con Zod real, activar/desactivar (ya existía, solo restyleado). Los avatares de profesionales asignados por servicio se derivan cruzando `professionalsApi.list()` (cada profesional trae su `services[]`) contra el `id` del servicio — sin endpoint nuevo.
- **Sin función todavía**: botón "Exportar" (decorativo, iguales a Inicio) y el botón `more_horiz` de cada tarjeta (sin menú, sin acción — no hay un "eliminar" real, el soft-delete ya es "Desactivar").
- Verificado con Playwright: grilla y lista con datos reales, filtro por categoría, alta de un servicio de prueba end-to-end (aparece en el catálogo, KPIs y contadores se recalculan) y edición pre-cargando los datos existentes — después se borró el servicio de prueba de la DB para no dejar basura en el dataset demo. Cero errores de consola.

**Tercera sección: Agenda completa (calendario semanal/diario).** Reemplaza el botón "Ver agenda completa" del dashboard (antes sin destino) y también **reemplaza y elimina** la vieja `ProfessionalAgendaPage` (lista plana) — `src/pages/AgendaPage.tsx` es una sola página compartida entre `admin` y `professional` en `/agenda`, agregada a `SHARED_FULL_BLEED_PATHS` en `Layout.tsx` (a diferencia de Inicio/Servicios, no es solo-admin).

- **Endpoints nuevos agregados a propósito** (se le preguntó al usuario, igual que con `category`): `PATCH /appointments/:id/complete` y `PATCH /appointments/:id/no-show` (`appointmentService.completeAppointment`/`markNoShow`). Antes solo el cron de 15 min podía pasar un turno a `completed`; no había forma manual. `no-show` además exige que `endDatetime` ya haya pasado (regla de negocio "se marca post-horario"); ambos requieren que el turno esté en `confirmed` y que quien los ejecuta sea `admin` o el profesional dueño del turno (mismo patrón de `assertProfessionalOwnership` que ya usaba `cancelAppointment`).
- **Reinterpretación real del modelo Admin/Profesional del mock**: el handoff tenía un toggle "Admin/Profesional" que en el prototipo solo alternaba a un profesional hardcodeado (`currentPro = 0`). Eso no mapea a nuestro control de acceso real (`GET /appointments/me` ya devuelve *todos* los turnos para admin y *solo los propios* para un profesional — un profesional nunca puede pedir la agenda de otro). Se reemplazó por: **admin** ve "Todos los profesionales" (coloreado por `professional.color`, el campo que existe desde el diseño original justo para esto) con un `<select>` real para filtrar a un profesional puntual (al filtrar, cambia a coloreado por estado); **profesional** siempre ve solo la propia, coloreada por estado, sin selector (no tiene sentido mostrarlo si no hay nada para elegir).
- **Todo lo demás quedó real**: turnos traídos de `appointmentsApi.listMine()` + `professionalsApi.list()` (mismo patrón que Inicio), packing de solapamientos portado tal cual del mock (algoritmo puro, ver `packOverlaps` en el archivo), franja horaria extendida a **08:00–20:00** (el mock usaba 08–19, pero Sofía Medina trabaja hasta las 20 en nuestros datos reales — se ajustó el rango para no recortarla), línea de "ahora" real, navegación prev/next/hoy con fechas reales (no un array fijo de 6 días como el mock), vista Día/Semana real. El drawer de detalle: 3 de 4 acciones de un turno `confirmed` son reales (marcar atendido, marcar no asistió, cancelar); "Registrar cobro" navega a `/cobros` (reutiliza esa pantalla en vez de duplicar el selector de método de pago); en `completed`, "Ver historia clínica" navega a `/pacientes/:clientId`.
- **Sin función todavía** (mismo criterio, toast "próximamente"): click en una celda vacía para crear un turno manualmente (no existe ese flujo para admin/profesional, solo la reserva self-service del cliente), botón "Nuevo turno", y "Reprogramar turno" en el drawer para un turno `no_show` (no hay endpoint de reprogramación).
- **Refactor de paso**: `avatarStyle`/paleta (duplicada en Inicio y Servicios) se extrajo a `src/lib/avatarColor.ts`; helpers de fecha (`dateKeyOf`, `addDays`, `toDateKey`, `addDaysKey`, `minutesOfDayUTC`) a `src/lib/dates.ts`. Era la 3ª vez que se necesitaban, mismo criterio que ya se usó para extraer `appointmentStatus.ts` en su momento.
- Verificado con Playwright en ambos roles: vista semana con solapamientos reales resueltos en columnas, filtro por profesional (cambia color de por-profesional a por-estado), vista día, y el flujo completo de abrir un turno confirmado → marcar como atendido → ver el drawer actualizarse en vivo con el nuevo set de acciones → toast de confirmación. Se revirtió el turno de prueba mutado a su estado original para no dejar el dataset demo inconsistente. Cero errores de consola.

**Cuarta sección: Profesionales.** Reescrito completo (`AdminProfessionalsPage.tsx`), agregado a `ADMIN_ONLY_FULL_BLEED_PATHS`. A diferencia de Servicios/Agenda, esta sección **no necesitó ningún campo ni endpoint nuevo** — todo lo que el diseño pedía ya existía en el backend (`specialty`/`bio`/`color` en `Professional`, y `addService`/`removeService` para el catálogo por profesional), así que prácticamente todo quedó real de una:

- **"Agregar"/quitar servicio por profesional**: el mock lo mockeaba como toast "próximamente", pero el backend ya soporta esto (`POST`/`DELETE /professionals/:id/services`, ya usado por la versión vieja de esta página) — se conectó real en vez de mockearlo, con un `<select>` inline que aparece al click del chip "Agregar".
- **Alta de profesional con servicios preasignados**: el form de creación del mock incluye selección de servicios, pero `POST /professionals` no acepta una lista de servicios en el mismo request. Se resolvió encadenando llamadas reales ya existentes: crear el profesional y después `addService` por cada servicio elegido, sin inventar un endpoint nuevo.
- **Edición real pero acotada**: `PATCH /professionals/:id` solo soporta `specialty`/`bio`/`color`/`active` (no nombre/email/teléfono, que viven en `User` y no tienen endpoint de edición). El slide-over de "Editar" refleja exactamente eso: especialidad y bio son campos editables reales; nombre y email se muestran de solo lectura en vez de mockear una edición que no existe.
- **`specialty` sigue siendo texto libre** (no se convirtió a enum, a diferencia de `category` en Servicios) — los chips de especialidad del formulario son solo accesos rápidos que rellenan el input de texto real, así que sigue admitiendo cualquier valor (incluida "Cirugía maxilofacial", que no está en la lista de 5 especialidades del mock). `SPECIALTY_META` en el propio archivo mapea ícono/color por especialidad conocida, con fallback neutro para cualquier otra.
- **KPIs y stats por tarjeta, todos reales**: turnos hoy/semana por profesional y el total semanal salen de `appointmentsApi.listMine()`; "Ocupación" es relativa (turnos de la semana de ese profesional / el más ocupado de la lista × 100), mismo criterio que ya se usó en el widget "Profesionales hoy" de Inicio — no una capacidad inventada.
- **Integración nueva entre secciones**: el botón "Agenda" de cada tarjeta linkea a `/agenda?profesional=<id>`; se le agregó soporte a `AgendaPage.tsx` para leer ese query param y preseleccionar el filtro del profesional al entrar.
- **Sin función todavía**: el bloque "Foto de perfil" del formulario de alta es puramente decorativo (no hay upload de archivos en ningún lado del proyecto); el botón `more_horiz` de cada tarjeta no tiene menú (igual que en Servicios).
- Verificado con Playwright: alta de un profesional de prueba end-to-end (con especialidad y un servicio preasignado, aparece correctamente en la grilla con sus KPIs recalculados), edición pre-cargando datos reales, toggle grilla/lista, y el link "Agenda" preseleccionando el filtro correcto en la otra pantalla. Se borró el profesional de prueba de la DB al terminar. Cero errores de consola.

## Landing pública + reorganización del acceso

El sistema no tenía puerta de entrada pública: `/` era directamente el dashboard autenticado. Se agregó una landing de marketing (handoff de Claude Design, carpeta `Landing page profesional de turnos/design_handoff_landing_clinica/`, 11 secciones a 1200px) como primera pantalla que ve cualquier visitante, con un flujo de "sacar turno" tipo Calendly: landing pública → registro/login → reserva.

- **Reorganización de rutas**: `/` pasó a ser la landing pública (fuera del `<Layout>` de la app, con su propio navbar/footer); el dashboard autenticado que antes vivía en `/` se movió a `/inicio`. Se actualizaron todos los puntos que asumían `/` como home autenticado: `navConfig.ts` (nav "Inicio" + `pageTitles`), `Layout.tsx` (`ADMIN_ONLY_FULL_BLEED_PATHS`), `LoginPage.tsx`/`RegisterPage.tsx` (redirect post-login), `ProtectedRoute.tsx` (redirect por rol no permitido), `Sidebar.tsx` (logo) y `ComingSoonPage.tsx` (link "volver").
- `src/pages/LandingPage.tsx` — recrea el handoff con Tailwind arbitrary values (mismos tokens que el resto de la app: `#5847eb`, Plus Jakarta Sans) e íconos `lucide-react` en vez de los emojis del prototipo. Si `useAuthStore` ya tiene sesión, redirige a `/inicio` (no tiene sentido mostrarle la landing a alguien logueado).
- **Datos reales, no hardcodeados** (como pide el handoff): sección "Servicios" muestra los primeros 3 servicios activos vía `servicesApi.list()` (se agregó este `list()` público en `api/services.ts`, pegándole a `GET /services`, que ya existía en el backend pero no se usaba desde el frontend); sección "Profesionales" muestra los primeros 4 vía `professionalsApi.list()` (ya existía). El widget de reserva del hero es una vista previa **estática** (no funcional, como pide el handoff) que muestra el primer profesional/servicio real para que no se vea con nombres inventados.
- **Contenido de marca hardcodeado a propósito** (mismo criterio que la tarjeta de clínica del sidebar): stats de la banda oscura (+20 años, 8 especialistas, etc.), testimonios (no existe un modelo de reseñas), datos de contacto/horarios de la barra utilitaria y el footer. Es contenido de marketing ficticio de "Clínica Dental Sonrisas", no datos que debieran salir del backend.
- **CTAs simplificados a propósito**: todos los botones "Reservar turno" (incluido el botón "Reservar" de cada profesional) apuntan a `/register`, no a un flujo de reserva con el profesional preseleccionado — eso requeriría extender `BookingPage` para aceptar un profesional inicial vía query param/state, y quedó fuera del alcance acordado ("no tocar más que la landing y el acceso").
- `src/components/landing/ImagePlaceholder.tsx` — placeholder rayado reutilizable (mismo patrón visual que el handoff) para las fotos que todavía no existen: 3 de servicios, hasta 4 de profesionales, 3 avatares de testimonios. **Pendiente**: generarlas con IA y reemplazar los placeholders por `<img>` reales.
- Verificado con Playwright headless contra el dev server real (con datos de la seed): las 3 secciones con datos dinámicos cargan bien, acordeón de FAQ funciona, CTAs navegan a `/login`/`/register` correctamente, cero errores de consola. `npm run build` (type-check + build) sin errores.
- **Fix de layout (feedback del usuario)**: la primera versión envolvía toda la landing en un único `<div className="mx-auto max-w-[1200px] bg-white">` sobre un fondo de página gris (`#e9e7f2`, tal como lo pedía el handoff) — a pantalla ancha se veía como "una foto pegada" flotando sobre un fondo de otro color, no como una landing real. Se refactorizó a secciones **full-bleed**: cada sección (barra utilitaria, hero, banda de stats, CTA final, footer) ocupa el ancho completo del viewport con su propio color, y un wrapper interno (`const inner = 'mx-auto max-w-[1200px] px-6 sm:px-10'`) centra y limita el *contenido* a 1200px adentro — mismo patrón que Stripe/Linear. Se sacó el fondo gris de página (ya no hace falta, no queda ningún borde visible).
- **Fotos reales generadas con IA** (reemplazando los `ImagePlaceholder`), matcheadas por nombre en diccionarios dentro de `LandingPage.tsx` (`SERVICE_IMAGES`, `PROFESSIONAL_IMAGES`, campo `avatar` en `TESTIMONIALS`), con fallback al placeholder si todavía no existe la foto de ese nombre — assets en `frontend/src/assets/landing/`. Las 10 imágenes (3 servicios, 4 profesionales, 3 testimonios) se generaron con Gemini y traían la marca de agua característica (un sparkle blanco, siempre cerca de la esquina inferior derecha) — se limpiaron a mano con OpenCV (`cv2.inpaint` para fondos con estructura/pliegues de tela, `medianBlur` dirigido para fondos lisos), verificando siempre el resultado al tamaño real de display antes de aceptarlo, no solo con zoom.
- **Bug de encuadre (Nicolás Paredes)**: su foto original era una toma de cuerpo entero (a diferencia de las otras 3, que ya venían como retrato de pecho para arriba), así que la cara quedaba muy arriba en el frame — el `object-cover` de la card la recortaba a la mitad. Se corrigió recortando la imagen fuente para que la altura de los ojos quede en la misma posición relativa (~45% de la altura) que en las otras fotos, en vez de depender de `object-position` para compensar.
- **Pantalla intermedia de acceso (feedback del usuario)**: los CTAs "Reservar turno"/"Reservar" de la landing apuntaban directo a `/register`, asumiendo que todo visitante es nuevo — un paciente que ya tiene cuenta terminaba en el formulario de registro igual. El usuario mostró como referencia la landing de un sanatorio real (Duarte Quirós) que resuelve esto con una pantalla intermedia de opciones antes de registro/login; se tomó la idea (no el estilo visual). Se agregó `src/pages/BookingGatewayPage.tsx` en `/acceso` (pública, reutiliza la card centrada de guest en `Layout.tsx`, mismo patrón que Login/Register) con dos opciones: "Soy nuevo" → `/register` y "Ya tengo cuenta" → `/login`. Todos los CTAs de "Reservar" en `LandingPage.tsx` (navbar, hero, "Ver todos" de servicios, botón por profesional, CTA final, footer) ahora apuntan a `/acceso` en vez de `/register` directo; los botones "Ya soy paciente"/"Ingresar" siguen yendo directo a `/login` (ya eran la opción correcta para quien ya tiene cuenta). También se agregó un link "← Volver al inicio" (a `/`) al pie de `LoginPage`/`RegisterPage`, mismo estilo que el que ya tenía `/acceso`.
- **Rediseño del hero (feedback del usuario)**: el widget de reserva mockeado (vista previa estática del flujo de turnos) se sacó por completo — el usuario notó que en una clínica real (con pacientes grandes, poco tech-savvy) un elemento que parece interactivo pero no responde al click genera desconfianza, no la transmite. En su lugar, el hero pasó a ser una foto real de fondo a pantalla completa (`heroClinica`, `src/assets/landing/hero-clinica.jpg`) con un degradé oscuro (`from-[#0d0b1f]/90 via-[#0d0b1f]/60 to-[#0d0b1f]/15`, de izquierda a derecha) y el texto/CTAs superpuestos en blanco sobre el tercio izquierdo — mismo patrón que la referencia del sanatorio. Se agregó `secondaryBtnOnDark` (botón translúcido reutilizado también en el CTA final, que antes duplicaba los mismos estilos a mano) para los botones secundarios sobre fondos oscuros/fotos.
- **Mostrar/ocultar contraseña**: en `LoginPage.tsx` y `RegisterPage.tsx` el input de contraseña alterna entre `type="password"`/`type="text"` con un botón ícono (`Eye`/`EyeOff` de `lucide-react`) superpuesto a la derecha del input (`absolute inset-y-0 right-0`), con `tabIndex={-1}` para que no interrumpa el orden de tabulación del formulario.

**Quinta sección: Historias clínicas.** A diferencia de las anteriores, no hubo handoff de Claude Design — el usuario pidió directamente aplicar el lenguaje visual ya establecido (tokens de Inicio/Servicios/Agenda/Profesionales) a esta pantalla, que había quedado con el estilo genérico original. Se agregó a `SHARED_FULL_BLEED_PATHS` (es de `admin`+`professional`, mismo criterio que Agenda).

- Layout propio: header + KPIs (notas totales, esta semana, pacientes con historia, "último registro" con tiempo relativo — todo real, calculado de los mismos registros) + buscador (paciente/contenido) + filtro por profesional (solo admin, igual que en Agenda/Historias) + **timeline agrupado por día** ("Hoy"/"Ayer"/fecha), en vez de la lista plana anterior.
- Cada nota es una card con: borde izquierdo del color real del profesional (`professional.color`, dato que ya venía en la respuesta del endpoint aunque el tipo del frontend no lo declaraba — se extendió `ClinicalRecord.professional` en `types.ts` para incluir `specialty`/`color`, sin tocar el backend), avatar del paciente, pill de profesional con ícono por especialidad (`specialtyMeta`, ver abajo) y hora + tiempo relativo.
- **Refactor de paso**: `SPECIALTY_META`/`specialtyMeta`/`SPECIALTY_PRESETS` (antes locales a `AdminProfessionalsPage.tsx`) se extrajeron a `src/lib/specialty.ts` — 2ª pantalla que los necesita, y de paso ya quedan listos para una 3ª.
- **Alcance acotado a propósito**: no se tocó la sección "Historia clínica" embebida en `PatientDetailPage.tsx` (todavía con el estilo viejo) — el pedido fue puntualmente sobre la pantalla de Historias Clínicas; esa página es parte del futuro rediseño de "Pacientes", no de esta sección.
- Verificado con Playwright en ambos roles: admin ve el feed completo con filtro por profesional funcionando, profesional ve solo sus propias notas sin el selector (no tiene sentido mostrarlo si no hay nada para elegir), agrupación por fecha correcta. Cero errores de consola.
- **Extensión inmediata: `PatientDetailPage.tsx` (detalle de un paciente)** también se restyleó con el mismo criterio — el usuario pidió explícitamente seguir con esta pantalla apenas se vio el resultado de arriba, ya que la sección "Historia clínica" vive ahí embebida junto con el historial de turnos. Se agregó a los full-bleed vía `location.pathname.startsWith('/pacientes/')` en `Layout.tsx` (ruta dinámica, no entra en el array de paths exactos). `STATUS_META` (antes local a `AgendaPage.tsx`) se extrajo a `src/lib/appointmentStatusMeta.ts` para reusar los mismos colores de estado en las tarjetas de turnos de esta pantalla. Los stats del header (turnos totales/próximos/última visita) son reales, calculados de `patient.appointments` — sin endpoint nuevo. La lista de turnos y las notas ya venían correctamente scopeadas por rol desde el backend (un profesional solo ve su propio historial con ese paciente); eso no cambió, solo se le dio estilo. **Todavía sin tocar**: `PatientsPage.tsx` (la lista de pacientes) sigue con el estilo viejo — es la única pieza que falta para que todo el flujo de "Pacientes" quede consistente.

**Sexta sección: Reportes.** Sin handoff de Claude Design (a diferencia de todas las anteriores) — el usuario pidió avanzar con esta sección sin tener un mockup todavía, así que se diseñó de cero reusando el mismo lenguaje visual y los helpers ya extraídos (`STATUS_META`, `CATEGORY_META`, `formatMoney`, `dates.ts`). Antes de escribir código se investigó qué datos reales hay disponibles: no existe (ni existía) ningún endpoint de agregación/dashboard en el backend — `GET /appointments/me` (admin ve todo, sin filtros ni paginado) ya trae todo lo necesario con `service`/`professional` completos, así que **toda la página es cálculo client-side sobre esa misma lista**, sin ningún endpoint nuevo.

- Nuevo archivo `frontend/src/pages/admin/ReportsPage.tsx`, ruta `/reportes` (antes apuntaba a `/proximamente` con `comingSoon: true` en `navConfig.ts`, ahora es una ruta real). Agregada a `ADMIN_ONLY_FULL_BLEED_PATHS` en `Layout.tsx`.
- Se extendió `Appointment` en `types.ts` (`professional.color`, `service.category`) porque el backend ya los devolvía en la respuesta (el include de Sequelize no restringe `attributes` en esos dos modelos) — mismo patrón que ya se había encontrado con `ClinicalRecord.professional` en la sección de Historias clínicas: el tipo del frontend under-declaraba datos que ya venían reales.
- Selector de rango (7 días / 30 días / Todo) 100% real: recalcula todo client-side filtrando por `startDatetime` (turnos) o `paidAt` (ingresos, mismo criterio que ya usaba `AdminHomePage` para "ingresos del día"). Los deltas contra el período anterior se ocultan en "Todo" porque no hay un período previo comparable.
- KPIs reales: ingresos cobrados (suma de `amount` con `paymentStatus: paid`, atribuido a `paidAt`), turnos completados, ticket promedio, % de ausentismo (mismo cálculo que ya usaba `AdminHomePage`), pacientes nuevos.
- **Definición a tener presente**: "Pacientes nuevos" es una aproximación real (no mock) — se calcula como la fecha del *primer turno registrado* de cada cliente, porque no hay un timestamp de "alta de paciente" separado expuesto por el backend (`User.createdAt` no viene en `GET /api/patients`). Es un proxy razonable, no un dato inventado, pero vale la aclaración si se refina más adelante.
- Gráfico de ingresos por día con barras (mismo estilo que el gráfico de "Turnos de la semana" de Inicio), desglose de turnos por estado (reusa `STATUS_META`), top 5 servicios más solicitados (reusa `CATEGORY_META`) y ranking de rendimiento por profesional (revenue + turnos atendidos, barra con el color real de cada profesional).
- El botón "Exportar" es decorativo (→ `/proximamente`), mismo criterio que el resto de botones no implementados en `AdminHomePage`.
- Limitación conocida (igual que `AdminHomePage`/`BillingPage`): como `GET /appointments/me` no pagina ni filtra por fecha, todo el cálculo es sobre el historial completo traído al cliente — funciona bien a la escala del dataset demo, no escalaría a un historial real de producción.
- Verificado con Playwright como admin: los 3 rangos (7d/30d/Todo) recalculan correctamente KPIs, gráfico, desglose por estado, top servicios y ranking por profesional. Sin errores de consola, `tsc -b` y `oxlint` limpios.

## Roadmap técnico (próximos pasos)

1. ~~Refactor a capa de servicio en todos los módulos (backend).~~ ✅
2. ~~Frontend: setup + auth (login/registro, store, rutas protegidas).~~ ✅
3. ~~Vista de reserva de turnos + "Mis turnos" (cliente).~~ ✅
4. ~~Panel admin: gestión de servicios y profesionales.~~ ✅
5. ~~Panel profesional: gestión de disponibilidad/excepciones y agenda de turnos propios.~~ ✅
6. (Opcional, fase 2) Notificaciones por email/WhatsApp al confirmar/cancelar un turno (modelo `Notification` ya diseñado, no implementado).
7. ~~Marcar turnos como `completed`/`no_show` manualmente~~ ✅ (vía el drawer de la vista Agenda — `PATCH /appointments/:id/complete` y `/no-show`).
8. (Opcional) Tests automatizados — `scheduleService.ts` es el candidato ideal por ser lógica pura sin I/O.
9. (Opcional) Deploy — el proyecto corre 100% local (Docker Postgres + Node + Vite); falta decidir dónde alojarlo para mostrarlo en Workana sin depender de la PC local.
