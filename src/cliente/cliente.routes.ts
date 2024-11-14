import { Router } from 'express';
import { sanitizeClienteInput, findAll, findOne, add, update, remove, login } from './cliente.controller.js';

export const clienteRouter = Router()

clienteRouter.post("/login", login);

clienteRouter.get('/', findAll);
clienteRouter.get('/:id', findOne);
clienteRouter.post('/', sanitizeClienteInput, add);
clienteRouter.put('/:id', sanitizeClienteInput, update);
clienteRouter.patch('/:id', sanitizeClienteInput, update);
clienteRouter.delete('/:id', remove);