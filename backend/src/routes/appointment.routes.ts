import { Router } from 'express';
import { availableSlots, cancel, create, listMine, markAsPaid } from '../controllers/appointmentController';
import { authenticate, authorize } from '../middlewares/auth';

export const appointmentRouter = Router();

appointmentRouter.get('/available-slots', availableSlots);
appointmentRouter.get('/me', authenticate, listMine);
appointmentRouter.post('/', authenticate, authorize('client'), create);
appointmentRouter.patch('/:id/cancel', authenticate, cancel);
appointmentRouter.patch('/:id/pay', authenticate, authorize('admin'), markAsPaid);
