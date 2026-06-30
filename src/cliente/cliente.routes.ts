import { Router } from 'express';
import { sanitizeClienteInput, findAll, findOne, add, update, remove, login } from './cliente.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

export const clienteRouter = Router()

clienteRouter.post("/login", login);          // público
clienteRouter.post('/', sanitizeClienteInput, add);  // público (registro)

clienteRouter.get('/', protectRoute, findAll);
clienteRouter.get('/:id', protectRoute, findOne);
clienteRouter.put('/:id', protectRoute, sanitizeClienteInput, update);
clienteRouter.patch('/:id', protectRoute, sanitizeClienteInput, update);
clienteRouter.delete('/:id', protectRoute, remove);