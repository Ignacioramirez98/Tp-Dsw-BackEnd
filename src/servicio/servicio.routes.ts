import { Router } from 'express';
import { findAll, findOne, add, update, remove } from './servicio.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { uploadImagen } from '../middleware/upload.middleware.js';
import { sanitizeInput } from '../middleware/sanitize.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { toNumber } from '../shared/utils/to-number.js';

export const servicioRouter = Router();

const sanitize = sanitizeInput(['descripcion', 'importe_por_hora', 'operarioId'], { importe_por_hora: toNumber });

// Gestión de servicios - solo admin y operario
servicioRouter.get('/', protectRoute, requireRole('admin', 'operario'), asyncHandler(findAll));
servicioRouter.get('/:id', protectRoute, requireRole('admin', 'operario'), asyncHandler(findOne));
servicioRouter.post('/', protectRoute, requireRole('admin', 'operario'), uploadImagen, sanitize, asyncHandler(add));
servicioRouter.put('/:id', protectRoute, requireRole('admin', 'operario'), uploadImagen, sanitize, asyncHandler(update));
servicioRouter.patch('/:id', protectRoute, requireRole('admin', 'operario'), uploadImagen, sanitize, asyncHandler(update));
servicioRouter.delete('/:id', protectRoute, requireRole('admin', 'operario'), asyncHandler(remove));
