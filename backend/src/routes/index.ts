import { Router } from 'express';
import { appointmentRouter } from './appointment.routes';
import { authRouter } from './auth.routes';
import { clinicalRecordRouter } from './clinicalRecord.routes';
import { patientRouter } from './patient.routes';
import { professionalRouter } from './professional.routes';
import { serviceRouter } from './service.routes';
import { supportRequestRouter } from './supportRequest.routes';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/services', serviceRouter);
router.use('/professionals', professionalRouter);
router.use('/appointments', appointmentRouter);
router.use('/patients', patientRouter);
router.use('/clinical-records', clinicalRecordRouter);
router.use('/support-requests', supportRequestRouter);
