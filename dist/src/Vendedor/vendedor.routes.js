import { Router } from 'express';
import { sanitizeVendedorInput, findAll, findOne, add, update, remove } from './vendedor.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
export const vendedorRouter = Router();
vendedorRouter.get('/', protectRoute, findAll);
vendedorRouter.get('/:id', protectRoute, findOne);
vendedorRouter.post('/', protectRoute, sanitizeVendedorInput, add);
vendedorRouter.put('/:id', protectRoute, sanitizeVendedorInput, update);
vendedorRouter.patch('/:id', protectRoute, sanitizeVendedorInput, update);
vendedorRouter.delete('/:id', protectRoute, remove);
//# sourceMappingURL=vendedor.routes.js.map