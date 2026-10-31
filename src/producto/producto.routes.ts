import { Router } from 'express';
import { sanitizeProductoInput, findAll, findOne, add, update, remove } from './producto.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { uploadImagen } from '../middleware/upload.middleware.js';

export const productoRouter = Router()

// Lectura de catálogo - permitido para cliente, vendedor y admin
productoRouter.get('/', protectRoute, requireRole('cliente', 'vendedor', 'admin'), findAll);
productoRouter.get('/:id', protectRoute, requireRole('cliente', 'vendedor', 'admin'), findOne);

// Escritura - solo admin
productoRouter.post('/', protectRoute, requireRole('admin'), uploadImagen, sanitizeProductoInput, add);
productoRouter.put('/:id', protectRoute, requireRole('admin'), uploadImagen, sanitizeProductoInput, update);
productoRouter.patch('/:id', protectRoute, requireRole('admin'), uploadImagen, sanitizeProductoInput, update);
productoRouter.delete('/:id', protectRoute, requireRole('admin'), remove);