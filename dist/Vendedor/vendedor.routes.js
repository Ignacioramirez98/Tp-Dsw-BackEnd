import { Router } from 'express';
import { sanitizeVendedorInput, findAll, findOne, add, update, remove } from './vendedor.controller.js';
export const vendedorRouter = Router();
vendedorRouter.get('/', findAll);
vendedorRouter.get('/:id', findOne);
vendedorRouter.post('/', sanitizeVendedorInput, add);
vendedorRouter.put('/:id', sanitizeVendedorInput, update);
vendedorRouter.patch('/:id', sanitizeVendedorInput, update);
vendedorRouter.delete('/:id', remove);
//# sourceMappingURL=vendedor.routes.js.map