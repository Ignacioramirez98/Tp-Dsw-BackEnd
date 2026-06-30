import { Router } from 'express';
import { sanitizeOperarioInput, findAll, findOne, add, update, remove } from './operario.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
export const operarioRouter = Router();
operarioRouter.get('/', protectRoute, requireRole('operario', 'admin'), findAll);
operarioRouter.get('/:id', protectRoute, requireRole('operario', 'admin'), findOne);
operarioRouter.post('/', protectRoute, requireRole('admin'), sanitizeOperarioInput, add);
operarioRouter.put('/:id', protectRoute, requireRole('operario', 'admin'), sanitizeOperarioInput, update);
operarioRouter.patch('/:id', protectRoute, requireRole('operario', 'admin'), sanitizeOperarioInput, update);
operarioRouter.delete('/:id', protectRoute, requireRole('admin'), remove);
//# sourceMappingURL=operario.routes.js.map