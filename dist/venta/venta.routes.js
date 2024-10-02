import { Router } from 'express';
import { sanitizeVentaInput, findAll, findOne, add, update, remove } from './venta.controller.js';
export const ventaRouter = Router();
ventaRouter.get('/', findAll);
ventaRouter.get('/:id', findOne);
ventaRouter.post('/', sanitizeVentaInput, add);
ventaRouter.put('/:id', sanitizeVentaInput, update);
ventaRouter.patch('/:id', sanitizeVentaInput, update);
ventaRouter.delete('/:id', remove);
//# sourceMappingURL=venta.routes.js.map