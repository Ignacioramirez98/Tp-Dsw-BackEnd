import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './venta.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createVentaSchema, updateVentaSchema } from '../validators/venta.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const ventaRouter = Router();

const validarAlta = validateBody(createVentaSchema);
const validarCambios = validateBody(updateVentaSchema);

// Vendedores y admin gestionan todas las ventas. El cliente ve solo las suyas y puede
// generar un pedido propio (el servicio fuerza su clienteId y el estado "pendiente").
ventaRouter.get('/', protectRoute, requireRole('admin', 'vendedor', 'cliente'), asyncHandler(findAll));
ventaRouter.get('/:id', protectRoute, requireRole('admin', 'vendedor', 'cliente'), asyncHandler(findOne));
ventaRouter.post('/', protectRoute, requireRole('admin', 'vendedor', 'cliente'), validarAlta, asyncHandler(add));
ventaRouter.put('/:id', protectRoute, requireRole('admin', 'vendedor'), validarCambios, asyncHandler(update));
ventaRouter.patch('/:id', protectRoute, requireRole('admin', 'vendedor'), validarCambios, asyncHandler(update));
ventaRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
