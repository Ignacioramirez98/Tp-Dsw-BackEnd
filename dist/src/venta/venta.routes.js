import { Router } from 'express';
import { sanitizeVentaInput, findAll, findOne, add, update, remove } from './venta.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
export const ventaRouter = Router();
ventaRouter.get('/', protectRoute, findAll);
ventaRouter.get('/:id', protectRoute, findOne);
ventaRouter.post('/', protectRoute, sanitizeVentaInput, add);
ventaRouter.put('/:id', protectRoute, sanitizeVentaInput, update);
ventaRouter.patch('/:id', protectRoute, sanitizeVentaInput, update);
ventaRouter.delete('/:id', protectRoute, remove);
//# sourceMappingURL=venta.routes.js.map