import { Router } from 'express';
import { sanitizeProductoInput, findAll, findOne, add, update, remove } from '../Producto/producto.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

export const productoRouter = Router()

productoRouter.get('/', protectRoute, requireRole('vendedor', 'admin'), findAll);
productoRouter.get('/:id', protectRoute, requireRole('vendedor', 'admin'), findOne);
productoRouter.post('/', protectRoute, requireRole('admin'), upload.single('imagen'), sanitizeProductoInput, add);
productoRouter.put('/:id', protectRoute, requireRole('admin'), upload.single('imagen'), sanitizeProductoInput, update);
productoRouter.patch('/:id', protectRoute, requireRole('admin'), upload.single('imagen'), sanitizeProductoInput, update);
productoRouter.delete('/:id', protectRoute, requireRole('admin'), remove);