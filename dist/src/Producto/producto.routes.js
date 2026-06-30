import { Router } from 'express';
import { sanitizeProductoInput, findAll, findOne, add, update, remove } from '../Producto/producto.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
export const productoRouter = Router();
// Lectura de catálogo - permitido para cliente, vendedor y admin
productoRouter.get('/', protectRoute, requireRole('cliente', 'vendedor', 'admin'), findAll);
productoRouter.get('/:id', protectRoute, requireRole('cliente', 'vendedor', 'admin'), findOne);
// Escritura - solo admin y vendedor
productoRouter.post('/', protectRoute, requireRole('admin'), upload.single('imagen'), sanitizeProductoInput, add);
productoRouter.put('/:id', protectRoute, requireRole('admin'), upload.single('imagen'), sanitizeProductoInput, update);
productoRouter.patch('/:id', protectRoute, requireRole('admin'), upload.single('imagen'), sanitizeProductoInput, update);
productoRouter.delete('/:id', protectRoute, requireRole('admin'), remove);
//# sourceMappingURL=producto.routes.js.map