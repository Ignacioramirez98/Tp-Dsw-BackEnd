import { Router } from 'express';
import { sanitizeLocalidadInput, findAll, findOne, add, update, remove } from './localidad.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';

export const localidadRouter = Router()

localidadRouter.get('/', protectRoute, requireRole('vendedor', 'admin'), findAll);
localidadRouter.get('/:id', protectRoute, requireRole('vendedor', 'admin'), findOne);
localidadRouter.post('/', protectRoute, requireRole('admin'), sanitizeLocalidadInput, add);
localidadRouter.put('/:id', protectRoute, requireRole('admin'), sanitizeLocalidadInput, update);
localidadRouter.patch('/:id', protectRoute, requireRole('admin'), sanitizeLocalidadInput, update);
localidadRouter.delete('/:id', protectRoute, requireRole('admin'), remove);