import { Router } from 'express';
import { sanitizeLocalidadInput, findAll, findOne, add, update, remove } from './localidad.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';

export const localidadRouter = Router()

// Lectura de catálogo - permitido para cliente, vendedor y admin
localidadRouter.get('/', protectRoute, requireRole('cliente', 'vendedor', 'admin'), findAll);
localidadRouter.get('/:id', protectRoute, requireRole('cliente', 'vendedor', 'admin'), findOne);
localidadRouter.post('/', protectRoute, requireRole('admin'), sanitizeLocalidadInput, add);
localidadRouter.put('/:id', protectRoute, requireRole('admin'), sanitizeLocalidadInput, update);
localidadRouter.patch('/:id', protectRoute, requireRole('admin'), sanitizeLocalidadInput, update);
localidadRouter.delete('/:id', protectRoute, requireRole('admin'), remove);