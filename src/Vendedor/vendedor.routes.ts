import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './vendedor.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const vendedorRouter = Router();

const sanitize = sanitizeInput(['nombre', 'apellido', 'mail', 'dni', 'telefono', 'rol']);

vendedorRouter.get('/', protectRoute, requireRole('vendedor', 'admin'), asyncHandler(findAll));
vendedorRouter.get('/:id', protectRoute, requireRole('vendedor', 'admin'), asyncHandler(findOne));
vendedorRouter.post('/', protectRoute, requireRole('admin'), sanitize, asyncHandler(add));
vendedorRouter.put('/:id', protectRoute, requireRole('vendedor', 'admin'), sanitize, asyncHandler(update));
vendedorRouter.patch('/:id', protectRoute, requireRole('vendedor', 'admin'), sanitize, asyncHandler(update));
vendedorRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
