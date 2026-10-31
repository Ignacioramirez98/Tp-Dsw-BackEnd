import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './venta.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const ventaRouter = Router();

const sanitize = sanitizeInput([
    'estado', 'fechaContacto', 'fechaDeVenta', 'fechaEntrega', 'fechaCancelacion',
    'clienteId', 'vendedorId', 'items', 'productoIds', 'servicioIds',
]);

ventaRouter.get('/', protectRoute, requireRole('vendedor', 'admin'), asyncHandler(findAll));
ventaRouter.get('/:id', protectRoute, requireRole('vendedor', 'admin'), asyncHandler(findOne));
ventaRouter.post('/', protectRoute, requireRole('vendedor', 'admin'), sanitize, asyncHandler(add));
ventaRouter.put('/:id', protectRoute, requireRole('vendedor', 'admin'), sanitize, asyncHandler(update));
ventaRouter.patch('/:id', protectRoute, requireRole('vendedor', 'admin'), sanitize, asyncHandler(update));
ventaRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
