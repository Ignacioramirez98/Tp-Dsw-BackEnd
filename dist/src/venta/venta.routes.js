import { Router } from 'express';
import { sanitizeVentaInput, findAll, findOne, add, update, remove } from './venta.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
export const ventaRouter = Router();
ventaRouter.get('/', protectRoute, requireRole('vendedor', 'admin'), findAll);
ventaRouter.get('/:id', protectRoute, requireRole('vendedor', 'admin'), findOne);
ventaRouter.post('/', protectRoute, requireRole('vendedor', 'admin'), sanitizeVentaInput, add);
ventaRouter.put('/:id', protectRoute, requireRole('vendedor', 'admin'), sanitizeVentaInput, update);
ventaRouter.patch('/:id', protectRoute, requireRole('vendedor', 'admin'), sanitizeVentaInput, update);
ventaRouter.delete('/:id', protectRoute, requireRole('admin'), remove);
//# sourceMappingURL=venta.routes.js.map