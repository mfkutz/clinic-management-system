import { Router } from 'express';
import { create, getById, list, listAll, remove, update } from '../controllers/serviceController';
import { authenticate, authorize } from '../middlewares/auth';

export const serviceRouter = Router();

serviceRouter.get('/', list);
serviceRouter.get('/all', authenticate, authorize('admin'), listAll);
serviceRouter.get('/:id', getById);
serviceRouter.post('/', authenticate, authorize('admin'), create);
serviceRouter.patch('/:id', authenticate, authorize('admin'), update);
serviceRouter.delete('/:id', authenticate, authorize('admin'), remove);
