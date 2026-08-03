import { app } from './app';
import { env } from './config/env';
import { sequelize } from './models';
import { scheduleCompleteAppointmentsJob } from './jobs/completeAppointments.job';

async function main() {
  await sequelize.authenticate();
  console.log('Conexión a la base de datos OK');

  scheduleCompleteAppointmentsJob();

  app.listen(env.port, () => {
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('Error al iniciar el servidor', err);
  process.exit(1);
});
