import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './venta.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createVentaSchema, updateVentaSchema } from '../validators/venta.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const ventaRouter = Router();

const validarAlta = validateBody(createVentaSchema);
const validarCambios = validateBody(updateVentaSchema);

ventaRouter.get('/', protectRoute, requireRole('vendedor', 'admin'), asyncHandler(findAll));
ventaRouter.get('/:id', protectRoute, requireRole('vendedor', 'admin'), asyncHandler(findOne));
ventaRouter.post('/', protectRoute, requireRole('vendedor', 'admin'), validarAlta, asyncHandler(add));
ventaRouter.put('/:id', protectRoute, requireRole('vendedor', 'admin'), validarCambios, asyncHandler(update));
ventaRouter.patch('/:id', protectRoute, requireRole('vendedor', 'admin'), validarCambios, asyncHandler(update));
ventaRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
