import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './vendedor.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createVendedorSchema, updateVendedorSchema } from '../validators/persona.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const vendedorRouter = Router();

const validarAlta = validateBody(createVendedorSchema);
const validarCambios = validateBody(updateVendedorSchema);

vendedorRouter.get('/', protectRoute, requireRole('vendedor', 'admin'), asyncHandler(findAll));
vendedorRouter.get('/:id', protectRoute, requireRole('vendedor', 'admin'), asyncHandler(findOne));
vendedorRouter.post('/', protectRoute, requireRole('admin'), validarAlta, asyncHandler(add));
vendedorRouter.put('/:id', protectRoute, requireRole('vendedor', 'admin'), validarCambios, asyncHandler(update));
vendedorRouter.patch('/:id', protectRoute, requireRole('vendedor', 'admin'), validarCambios, asyncHandler(update));
vendedorRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
