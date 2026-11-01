import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './vendedor.controller.js';
import { protectRoute, requireRole, soloPropio } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createVendedorSchema, updateVendedorSchema } from '../validators/persona.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const vendedorRouter = Router();

const validarAlta = validateBody(createVendedorSchema);
const validarCambios = validateBody(updateVendedorSchema);

const propio = soloPropio('vendedor', 'vendedorId');

// El admin gestiona vendedores; cada vendedor puede ver la lista y editar solo su perfil
vendedorRouter.get('/', protectRoute, requireRole('admin', 'vendedor'), asyncHandler(findAll));
vendedorRouter.get('/:id', protectRoute, requireRole('admin', 'vendedor'), asyncHandler(findOne));
vendedorRouter.post('/', protectRoute, requireRole('admin'), validarAlta, asyncHandler(add));
vendedorRouter.put('/:id', protectRoute, requireRole('admin', 'vendedor'), propio, validarCambios, asyncHandler(update));
vendedorRouter.patch('/:id', protectRoute, requireRole('admin', 'vendedor'), propio, validarCambios, asyncHandler(update));
vendedorRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
