import { Router } from 'express';
import { sanitizeServicioInput, findAll, findOne, add, update, remove } from './servicio.controller.js';
export const servicioRouter = Router();
servicioRouter.get('/', findAll);
servicioRouter.get('/:id', findOne);
servicioRouter.post('/', sanitizeServicioInput, add);
servicioRouter.put('/:id', sanitizeServicioInput, update);
servicioRouter.patch('/:id', sanitizeServicioInput, update);
servicioRouter.delete('/:id', remove);
//# sourceMappingURL=servicio.routes.js.map