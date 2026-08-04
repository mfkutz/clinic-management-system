import { Router } from 'express';
import {
  availableSlots,
  cancel,
  complete,
  confirmAttendance,
  create,
  listMine,
  markAsPaid,
  markNoShow,
} from '../controllers/appointmentController';
import { authenticate, authorize } from '../middlewares/auth';

export const appointmentRouter = Router();

appointmentRouter.get('/available-slots', availableSlots);
appointmentRouter.get('/me', authenticate, listMine);
appointmentRouter.post('/', authenticate, authorize('client'), create);
appointmentRouter.patch('/:id/cancel', authenticate, cancel);
appointmentRouter.patch('/:id/confirm', authenticate, authorize('client'), confirmAttendance);
appointmentRouter.patch('/:id/pay', authenticate, authorize('admin'), markAsPaid);
appointmentRouter.patch('/:id/complete', authenticate, authorize('admin', 'professional'), complete);
appointmentRouter.patch('/:id/no-show', authenticate, authorize('admin', 'professional'), markNoShow);
