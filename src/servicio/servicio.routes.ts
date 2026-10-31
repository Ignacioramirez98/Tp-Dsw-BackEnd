import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './servicio.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { uploadImagen } from '../middleware/upload.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createServicioSchema, updateServicioSchema } from '../validators/servicio.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const servicioRouter = Router();

const validarAlta = validateBody(createServicioSchema);
const validarCambios = validateBody(updateServicioSchema);

// Gestión de servicios - solo admin y operario
servicioRouter.get('/', protectRoute, requireRole('admin', 'operario'), asyncHandler(findAll));
servicioRouter.get('/:id', protectRoute, requireRole('admin', 'operario'), asyncHandler(findOne));
servicioRouter.post('/', protectRoute, requireRole('admin', 'operario'), uploadImagen, validarAlta, asyncHandler(add));
servicioRouter.put('/:id', protectRoute, requireRole('admin', 'operario'), uploadImagen, validarCambios, asyncHandler(update));
servicioRouter.patch('/:id', protectRoute, requireRole('admin', 'operario'), uploadImagen, validarCambios, asyncHandler(update));
servicioRouter.delete('/:id', protectRoute, requireRole('admin', 'operario'), asyncHandler(remove));
