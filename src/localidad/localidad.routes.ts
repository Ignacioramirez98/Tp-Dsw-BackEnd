import { Router } from 'express';
import { sanitizeLocalidadInput, findAll, findOne, add, update, remove } from './localidad.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

export const localidadRouter = Router()

localidadRouter.get('/', protectRoute, findAll);
localidadRouter.get('/:id', protectRoute, findOne);
localidadRouter.post('/', protectRoute, sanitizeLocalidadInput, add);
localidadRouter.put('/:id', protectRoute, sanitizeLocalidadInput, update);
localidadRouter.patch('/:id', protectRoute, sanitizeLocalidadInput, update);
localidadRouter.delete('/:id', protectRoute, remove);