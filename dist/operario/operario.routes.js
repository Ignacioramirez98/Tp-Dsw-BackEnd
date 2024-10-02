import { Router } from 'express';
import { sanitizeOperarioInput, findAll, findOne, add, update, remove } from './operario.controller.js';
export const operarioRouter = Router();
operarioRouter.get('/', findAll);
operarioRouter.get('/:id', findOne);
operarioRouter.post('/', sanitizeOperarioInput, add);
operarioRouter.put('/:id', sanitizeOperarioInput, update);
operarioRouter.patch('/:id', sanitizeOperarioInput, update);
operarioRouter.delete('/:id', remove);
//# sourceMappingURL=operario.routes.js.map