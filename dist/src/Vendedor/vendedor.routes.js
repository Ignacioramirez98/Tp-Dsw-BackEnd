import { Router } from 'express';
import { sanitizeVendedorInput, findAll, findOne, add, update, remove } from './vendedor.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
export const vendedorRouter = Router();
vendedorRouter.get('/', protectRoute, requireRole('vendedor', 'admin'), findAll);
vendedorRouter.get('/:id', protectRoute, requireRole('vendedor', 'admin'), findOne);
vendedorRouter.post('/', protectRoute, requireRole('admin'), sanitizeVendedorInput, add);
vendedorRouter.put('/:id', protectRoute, requireRole('vendedor', 'admin'), sanitizeVendedorInput, update);
vendedorRouter.patch('/:id', protectRoute, requireRole('vendedor', 'admin'), sanitizeVendedorInput, update);
vendedorRouter.delete('/:id', protectRoute, requireRole('admin'), remove);
//# sourceMappingURL=vendedor.routes.js.map