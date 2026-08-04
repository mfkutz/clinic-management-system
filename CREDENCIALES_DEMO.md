# Credenciales de datos de prueba (seed)

Generadas por `backend/src/database/seeders/20260802130001-demo-admin.js` y
`backend/src/database/seeders/20260802130002-demo-full-dataset.js`.

Para cargar/recargar estos datos desde `backend/`:

```bash
npx sequelize-cli db:seed:all        # cargar
npx sequelize-cli db:seed:undo:all   # borrar todo lo cargado por seed (menos admin, ver nota)
```

> Nota: `db:seed:undo:all` deshace ambos seeders, incluido el admin. Si solo querés
> limpiar el dataset completo pero conservar el admin, usá:
> `npx sequelize-cli db:seed:undo --seed 20260802130002-demo-full-dataset.js`

## Admin

| Email | Password |
|---|---|
| admin@sistema-turnos.dev | admin12345 |

## Profesionales (todos con la misma contraseña: `profesional123`)

| Nombre | Email | Especialidad |
|---|---|---|
| Valentina Rojas | valentina.rojas@sistema-turnos.dev | Odontología general |
| Martín Aguirre | martin.aguirre@sistema-turnos.dev | Ortodoncia |
| Carla Fernández | carla.fernandez@sistema-turnos.dev | Endodoncia |
| Nicolás Paredes | nicolas.paredes@sistema-turnos.dev | Odontopediatría |
| Sofía Medina | sofia.medina@sistema-turnos.dev | Cirugía maxilofacial |

## Clientes / pacientes (todos con la misma contraseña: `cliente123`)

| Nombre | Email |
|---|---|
| Ana Gómez | ana.gomez@example.com |
| Bruno Sosa | bruno.sosa@example.com |
| Camila Torres | camila.torres@example.com |
| Diego Herrera | diego.herrera@example.com |
| Elena Vidal | elena.vidal@example.com |
| Facundo Ibarra | facundo.ibarra@example.com |
| Gabriela Núñez | gabriela.nunez@example.com |
| Hernán Castro | hernan.castro@example.com |
| Iris Molina | iris.molina@example.com |
| Joaquín Silva | joaquin.silva@example.com |
| Karina Ríos | karina.rios@example.com |
| Lucas Bravo | lucas.bravo@example.com |
| Melina Acosta | melina.acosta@example.com |
| Nahuel Ferreyra | nahuel.ferreyra@example.com |

## Qué generó el dataset completo

- 11 servicios (consulta general, limpieza, blanqueamiento, extracción, endodoncia,
  ortodoncia/brackets, empaste, pediátrica, cirugía de muela, radiografía).
- Cada profesional con sus servicios asignados (algunos con precio/duración
  override) y disponibilidad semanal recurrente.
- 3 excepciones de disponibilidad: un día bloqueado (Valentina), un bloqueo
  parcial (Sofía) y una disponibilidad extra de sábado (Martín).
- ~112 turnos: 14 días hacia atrás (mayormente `completed`, algunos `cancelled`
  y `no_show`, con pagos mezclados `paid`/`pending`) y 14 días hacia adelante
  (`confirmed`, dejando siempre un segundo horario libre por día para poder
  probar la reserva en vivo).
- ~37 historias clínicas ligadas a turnos completados.
- 6 solicitudes de soporte (3 abiertas, 3 cerradas).

Las fechas de los turnos/excepciones se calculan en relación a la fecha en que
se corre el seed (no son fechas fijas), así que siempre vas a tener turnos
pasados y futuros "frescos" sin importar cuándo lo ejecutes.
