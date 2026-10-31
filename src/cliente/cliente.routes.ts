import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './cliente.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createClienteSchema, updateClienteSchema } from '../validators/cliente.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const clienteRouter = Router();

const validarAlta = validateBody(createClienteSchema);
const validarCambios = validateBody(updateClienteSchema);

clienteRouter.post('/', validarAlta, asyncHandler(add)); // público (registro de datos del cliente)

clienteRouter.get('/', protectRoute, requireRole('cliente', 'admin'), asyncHandler(findAll));
clienteRouter.get('/:id', protectRoute, requireRole('cliente', 'admin'), asyncHandler(findOne));
clienteRouter.put('/:id', protectRoute, requireRole('cliente', 'admin'), validarCambios, asyncHandler(update));
clienteRouter.patch('/:id', protectRoute, requireRole('cliente', 'admin'), validarCambios, asyncHandler(update));
clienteRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
