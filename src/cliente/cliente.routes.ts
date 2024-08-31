import { Router } from 'express';
import { sanitizeLocalidadInput, findAll, findOne, add, update, remove } from './cliente.controller.js';

export const clienteRouter = Router()

clienteRouter.get('/', findAll);
clienteRouter.get('/:id', findOne);
clienteRouter.post('/', sanitizeLocalidadInput, add);
clienteRouter.put('/:id', sanitizeLocalidadInput, update);
clienteRouter.patch('/:id', sanitizeLocalidadInput, update);
clienteRouter.delete('/:id', remove);