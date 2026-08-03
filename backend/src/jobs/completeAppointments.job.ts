import cron from 'node-cron';
import { Op } from 'sequelize';
import { Appointment } from '../models';

async function completePastAppointments() {
  const [count] = await Appointment.update(
    { status: 'completed' },
    {
      where: {
        status: 'confirmed',
        endDatetime: { [Op.lt]: new Date() },
      },
    }
  );

  if (count > 0) {
    console.log(`[completeAppointments] ${count} turno(s) marcado(s) como completed`);
  }
}

export function scheduleCompleteAppointmentsJob() {
  // corre cada 15 minutos
  cron.schedule('*/15 * * * *', () => {
    completePastAppointments().catch((err) => console.error('[completeAppointments] error', err));
  });
}
