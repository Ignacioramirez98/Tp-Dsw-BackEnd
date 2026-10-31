import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './cliente.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const clienteRouter = Router();

const sanitize = sanitizeInput(['nombre', 'apellido', 'dni', 'mail', 'telefono', 'direccion', 'razon_social', 'localidadId']);

clienteRouter.post('/', sanitize, asyncHandler(add)); // público (registro de datos del cliente)

clienteRouter.get('/', protectRoute, requireRole('cliente', 'admin'), asyncHandler(findAll));
clienteRouter.get('/:id', protectRoute, requireRole('cliente', 'admin'), asyncHandler(findOne));
clienteRouter.put('/:id', protectRoute, requireRole('cliente', 'admin'), sanitize, asyncHandler(update));
clienteRouter.patch('/:id', protectRoute, requireRole('cliente', 'admin'), sanitize, asyncHandler(update));
clienteRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
