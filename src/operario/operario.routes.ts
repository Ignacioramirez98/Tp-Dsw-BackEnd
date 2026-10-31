import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './operario.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const operarioRouter = Router();

const sanitize = sanitizeInput(['nombre', 'apellido', 'mail', 'dni', 'telefono']);

operarioRouter.get('/', protectRoute, requireRole('operario', 'admin'), asyncHandler(findAll));
operarioRouter.get('/:id', protectRoute, requireRole('operario', 'admin'), asyncHandler(findOne));
operarioRouter.post('/', protectRoute, requireRole('admin'), sanitize, asyncHandler(add));
operarioRouter.put('/:id', protectRoute, requireRole('operario', 'admin'), sanitize, asyncHandler(update));
operarioRouter.patch('/:id', protectRoute, requireRole('operario', 'admin'), sanitize, asyncHandler(update));
operarioRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
