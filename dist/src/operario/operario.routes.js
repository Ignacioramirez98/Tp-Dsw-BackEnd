import { Router } from 'express';
import { sanitizeOperarioInput, findAll, findOne, add, update, remove } from './operario.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
export const operarioRouter = Router();
operarioRouter.get('/', protectRoute, findAll);
operarioRouter.get('/:id', protectRoute, findOne);
operarioRouter.post('/', protectRoute, sanitizeOperarioInput, add);
operarioRouter.put('/:id', protectRoute, sanitizeOperarioInput, update);
operarioRouter.patch('/:id', protectRoute, sanitizeOperarioInput, update);
operarioRouter.delete('/:id', protectRoute, remove);
//# sourceMappingURL=operario.routes.js.map