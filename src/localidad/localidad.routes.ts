import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './localidad.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createLocalidadSchema, updateLocalidadSchema } from '../validators/localidad.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const localidadRouter = Router();

const validarAlta = validateBody(createLocalidadSchema);
const validarCambios = validateBody(updateLocalidadSchema);

// Lectura de catálogo - permitido para cliente, vendedor y admin
// Catálogo: lo leen todos los roles (el cliente lo usa al registrarse), lo administra el admin
localidadRouter.get('/', protectRoute, requireRole('admin', 'vendedor', 'operario', 'cliente'), asyncHandler(findAll));
localidadRouter.get('/:id', protectRoute, requireRole('admin', 'vendedor', 'operario', 'cliente'), asyncHandler(findOne));
localidadRouter.post('/', protectRoute, requireRole('admin'), validarAlta, asyncHandler(add));
localidadRouter.put('/:id', protectRoute, requireRole('admin'), validarCambios, asyncHandler(update));
localidadRouter.patch('/:id', protectRoute, requireRole('admin'), validarCambios, asyncHandler(update));
localidadRouter.delete('/:id', protectRoute, requireRole('admin'), asyncHandler(remove));
