import { Router } from 'express';
import { sanitizeServicioInput, findAll, findOne, add, update, remove } from './servicio.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
export const servicioRouter = Router();
servicioRouter.get('/', protectRoute, findAll);
servicioRouter.get('/:id', protectRoute, findOne);
servicioRouter.post('/', protectRoute, sanitizeServicioInput, add);
servicioRouter.put('/:id', protectRoute, sanitizeServicioInput, update);
servicioRouter.patch('/:id', protectRoute, sanitizeServicioInput, update);
servicioRouter.delete('/:id', protectRoute, remove);
//# sourceMappingURL=servicio.routes.js.map