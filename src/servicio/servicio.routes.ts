import { Router } from 'express';
import { sanitizeServicioInput, findAll, findOne, add, update, remove } from './servicio.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { uploadImagen } from '../middleware/upload.middleware.js';

export const servicioRouter = Router()

// Gestión de servicios - solo admin y operario
servicioRouter.get('/', protectRoute, requireRole('admin', 'operario'), findAll);
servicioRouter.get('/:id', protectRoute, requireRole('admin', 'operario'), findOne);
servicioRouter.post('/', protectRoute, requireRole('admin', 'operario'), uploadImagen, sanitizeServicioInput, add);
servicioRouter.put('/:id', protectRoute, requireRole('admin', 'operario'), uploadImagen, sanitizeServicioInput, update);
servicioRouter.patch('/:id', protectRoute, requireRole('admin', 'operario'), uploadImagen, sanitizeServicioInput, update);
servicioRouter.delete('/:id', protectRoute, requireRole('admin', 'operario'), remove);