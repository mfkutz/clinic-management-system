import { Router } from 'express';
import { create, list, resolve } from '../controllers/supportRequestController';
import { authenticate, authorize } from '../middlewares/auth';

export const supportRequestRouter = Router();

supportRequestRouter.get('/', authenticate, list);
supportRequestRouter.post('/', authenticate, create);
supportRequestRouter.patch('/:id/resolve', authenticate, authorize('admin'), resolve);
