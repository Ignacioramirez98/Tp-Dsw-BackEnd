import { Router } from 'express';
import { sanitizeProductoInput, findAll, findOne, add, update, remove } from '../Producto/producto.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

export const productoRouter = Router()

productoRouter.get('/', protectRoute, findAll);
productoRouter.get('/:id', protectRoute, findOne);
productoRouter.post('/', protectRoute, sanitizeProductoInput, add);
productoRouter.put('/:id', protectRoute, sanitizeProductoInput, update);
productoRouter.patch('/:id', protectRoute, sanitizeProductoInput, update);
productoRouter.delete('/:id', protectRoute, remove);