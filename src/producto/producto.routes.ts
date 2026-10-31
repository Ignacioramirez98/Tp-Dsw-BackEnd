import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './producto.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { uploadImagen } from '../middleware/upload.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { toNumber } from '../shared/utils/to-number.js';

export const productoRouter = Router();

const sanitize = sanitizeInput(
    ['nombre', 'descripcion', 'importe_compra', 'importe_venta', 'stock'],
    { importe_compra: toNumber, importe_venta: toNumber, stock: toNumber },
);

// Lectura de catálogo - permitido para cliente, vendedor y admin
productoRouter.get('/', protectRoute, requireRole('cliente', 'vendedor', 'admin'), asyncHandler(findAll));
productoRouter.get('/:id', protectRoute, requireRole('cliente', 'vendedor', 'admin'), asyncHandler(findOne));

// Escritura - solo admin
productoRouter.post('/', protectRoute, requireRole('admin'), uploadImagen, sanitize, asyncHandler(add));
productoRouter.put('/:id', protectRoute, requireRole('admin'), uploadImagen, sanitize, asyncHandler(update));
productoRouter.patch('/:id', protectRoute, requireRole('admin'), uploadImagen, sanitize, asyncHandler(update));
productoRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
