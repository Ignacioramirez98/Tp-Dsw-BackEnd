import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './localidad.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const localidadRouter = Router();

const sanitize = sanitizeInput(['nombre', 'codigo_postal']);

// Lectura de catálogo - permitido para cliente, vendedor y admin
localidadRouter.get('/', protectRoute, requireRole('cliente', 'vendedor', 'admin'), asyncHandler(findAll));
localidadRouter.get('/:id', protectRoute, requireRole('cliente', 'vendedor', 'admin'), asyncHandler(findOne));
localidadRouter.post('/', protectRoute, requireRole('admin'), sanitize, asyncHandler(add));
localidadRouter.put('/:id', protectRoute, requireRole('admin'), sanitize, asyncHandler(update));
localidadRouter.patch('/:id', protectRoute, requireRole('admin'), sanitize, asyncHandler(update));
localidadRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
