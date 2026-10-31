import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './operario.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createOperarioSchema, updateOperarioSchema } from '../validators/persona.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const operarioRouter = Router();

const validarAlta = validateBody(createOperarioSchema);
const validarCambios = validateBody(updateOperarioSchema);

operarioRouter.get('/', protectRoute, requireRole('operario', 'admin'), asyncHandler(findAll));
operarioRouter.get('/:id', protectRoute, requireRole('operario', 'admin'), asyncHandler(findOne));
operarioRouter.post('/', protectRoute, requireRole('admin'), validarAlta, asyncHandler(add));
operarioRouter.put('/:id', protectRoute, requireRole('operario', 'admin'), validarCambios, asyncHandler(update));
operarioRouter.patch('/:id', protectRoute, requireRole('operario', 'admin'), validarCambios, asyncHandler(update));
operarioRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
