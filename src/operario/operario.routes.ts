import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './operario.controller.js';
import { protectRoute, requireRole, soloPropio } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createOperarioSchema, updateOperarioSchema } from '../validators/persona.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const operarioRouter = Router();

const validarAlta = validateBody(createOperarioSchema);
const validarCambios = validateBody(updateOperarioSchema);

const propio = soloPropio('operario', 'operarioId');

// El admin gestiona operarios; el vendedor los consulta; cada operario edita solo su perfil
operarioRouter.get('/', protectRoute, requireRole('admin', 'vendedor', 'operario'), asyncHandler(findAll));
operarioRouter.get('/:id', protectRoute, requireRole('admin', 'vendedor', 'operario'), asyncHandler(findOne));
operarioRouter.post('/', protectRoute, requireRole('admin'), validarAlta, asyncHandler(add));
operarioRouter.put('/:id', protectRoute, requireRole('admin', 'operario'), propio, validarCambios, asyncHandler(update));
operarioRouter.patch('/:id', protectRoute, requireRole('admin', 'operario'), propio, validarCambios, asyncHandler(update));
operarioRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
