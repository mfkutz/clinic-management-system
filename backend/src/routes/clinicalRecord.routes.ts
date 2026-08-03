import { Router } from 'express';
import { listRecent } from '../controllers/clinicalRecordController';
import { authenticate, authorize } from '../middlewares/auth';

export const clinicalRecordRouter = Router();

clinicalRecordRouter.get('/', authenticate, authorize('admin', 'professional'), listRecent);
