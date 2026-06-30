import { Router } from 'express';
import { sanitizeClienteInput, findAll, findOne, add, update, remove, login } from './cliente.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';

export const clienteRouter = Router()

clienteRouter.post("/login", login);          // público
clienteRouter.post('/', sanitizeClienteInput, add);  // público (registro)

clienteRouter.get('/', protectRoute, requireRole('cliente', 'admin'), findAll);
clienteRouter.get('/:id', protectRoute, requireRole('cliente', 'admin'), findOne);
clienteRouter.put('/:id', protectRoute, requireRole('cliente', 'admin'), sanitizeClienteInput, update);
clienteRouter.patch('/:id', protectRoute, requireRole('cliente', 'admin'), sanitizeClienteInput, update);
clienteRouter.delete('/:id', protectRoute, requireRole('admin'), remove);