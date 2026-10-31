import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './producto.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { uploadImagen } from '../middleware/upload.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createProductoSchema, updateProductoSchema } from '../validators/producto.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const productoRouter = Router();

const validarAlta = validateBody(createProductoSchema);
const validarCambios = validateBody(updateProductoSchema);

// Lectura de catálogo - permitido para cliente, vendedor y admin
productoRouter.get('/', protectRoute, requireRole('cliente', 'vendedor', 'admin'), asyncHandler(findAll));
productoRouter.get('/:id', protectRoute, requireRole('cliente', 'vendedor', 'admin'), asyncHandler(findOne));

// Escritura - solo admin
productoRouter.post('/', protectRoute, requireRole('admin'), uploadImagen, validarAlta, asyncHandler(add));
productoRouter.put('/:id', protectRoute, requireRole('admin'), uploadImagen, validarCambios, asyncHandler(update));
productoRouter.patch('/:id', protectRoute, requireRole('admin'), uploadImagen, validarCambios, asyncHandler(update));
productoRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
