import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './cliente.controller.js';
import { protectRoute, requireRole, soloPropio } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createClienteSchema, updateClienteSchema } from '../validators/cliente.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const clienteRouter = Router();

const validarAlta = validateBody(createClienteSchema);
const validarCambios = validateBody(updateClienteSchema);

const propio = soloPropio('cliente', 'clienteId');

// Alta pública (registro de datos del cliente)
clienteRouter.post('/', validarAlta, asyncHandler(add));

// Listado: personal de la empresa. El cliente solo accede a su propia ficha
clienteRouter.get('/', protectRoute, requireRole('admin', 'vendedor', 'operario'), asyncHandler(findAll));
clienteRouter.get('/:id', protectRoute, requireRole('admin', 'vendedor', 'operario', 'cliente'), propio, asyncHandler(findOne));
clienteRouter.put('/:id', protectRoute, requireRole('admin', 'vendedor', 'cliente'), propio, validarCambios, asyncHandler(update));
clienteRouter.patch('/:id', protectRoute, requireRole('admin', 'vendedor', 'cliente'), propio, validarCambios, asyncHandler(update));
clienteRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
