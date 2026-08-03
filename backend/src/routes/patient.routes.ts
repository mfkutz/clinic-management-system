import { Router } from 'express';
import { createForPatient, listForPatient } from '../controllers/clinicalRecordController';
import { getById, list } from '../controllers/patientController';
import { authenticate, authorize } from '../middlewares/auth';

export const patientRouter = Router();

patientRouter.get('/', authenticate, authorize('admin', 'professional'), list);
patientRouter.get('/:id', authenticate, authorize('admin', 'professional'), getById);

patientRouter.get('/:id/clinical-records', authenticate, authorize('admin', 'professional'), listForPatient);
patientRouter.post('/:id/clinical-records', authenticate, authorize('professional'), createForPatient);
