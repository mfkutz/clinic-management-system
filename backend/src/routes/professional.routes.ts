import { Router } from 'express';
import {
  createAvailability,
  createException,
  listAvailability,
  listExceptions,
  removeAvailability,
  removeException,
} from '../controllers/availabilityController';
import {
  addService,
  create,
  getById,
  list,
  listAll,
  me,
  remove,
  removeService,
  update,
} from '../controllers/professionalController';
import { authenticate, authorize } from '../middlewares/auth';

export const professionalRouter = Router();

professionalRouter.get('/', list);
professionalRouter.get('/all', authenticate, authorize('admin'), listAll);
professionalRouter.get('/me', authenticate, authorize('professional'), me);
professionalRouter.get('/:id', getById);
professionalRouter.post('/', authenticate, authorize('admin'), create);
professionalRouter.patch('/:id', authenticate, authorize('admin'), update);
professionalRouter.delete('/:id', authenticate, authorize('admin'), remove);
professionalRouter.post('/:id/services', authenticate, authorize('admin'), addService);
professionalRouter.delete('/:id/services/:serviceId', authenticate, authorize('admin'), removeService);

// Disponibilidad recurrente: gestionable por admin o por el propio profesional (ver loadOwnedProfessional).
professionalRouter.get('/:id/availability', listAvailability);
professionalRouter.post('/:id/availability', authenticate, createAvailability);
professionalRouter.delete('/:id/availability/:availabilityId', authenticate, removeAvailability);

// Excepciones puntuales (feriados, días libres, horario extra).
professionalRouter.get('/:id/availability-exceptions', listExceptions);
professionalRouter.post('/:id/availability-exceptions', authenticate, createException);
professionalRouter.delete('/:id/availability-exceptions/:exceptionId', authenticate, removeException);
