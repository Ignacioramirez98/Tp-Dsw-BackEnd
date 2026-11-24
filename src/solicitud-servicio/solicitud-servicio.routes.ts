import { Router } from 'express';
import { findAll, findOne, add, aceptar, finalizar, cancelar } from './solicitud-servicio.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
    aceptarSolicitudSchema,
    cancelarSolicitudSchema,
    createSolicitudSchema,
    finalizarSolicitudSchema,
} from '../validators/solicitud-servicio.validator.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const solicitudServicioRouter = Router();

// Cada rol ve lo suyo (el servicio filtra): el cliente sus pedidos, el operario los de sus
// servicios y los que no tienen responsable, el admin todos.
solicitudServicioRouter.get('/', protectRoute, requireRole('admin', 'operario', 'cliente'), asyncHandler(findAll));
solicitudServicioRouter.get('/:id', protectRoute, requireRole('admin', 'operario', 'cliente'), asyncHandler(findOne));

// CUU Solicitar Servicio: el cliente pide un servicio (nace pendiente y a su nombre).
solicitudServicioRouter.post('/', protectRoute, requireRole('cliente'), validateBody(createSolicitudSchema), asyncHandler(add));

// El operario (o el admin) acepta y finaliza el trabajo.
solicitudServicioRouter.post('/:id/aceptar', protectRoute, requireRole('admin', 'operario'), validateBody(aceptarSolicitudSchema), asyncHandler(aceptar));
solicitudServicioRouter.post('/:id/finalizar', protectRoute, requireRole('admin', 'operario'), validateBody(finalizarSolicitudSchema), asyncHandler(finalizar));

// Cancelación: el cliente solo sus pedidos pendientes; operario y admin también las aceptadas.
solicitudServicioRouter.post('/:id/cancelar', protectRoute, requireRole('admin', 'operario', 'cliente'), validateBody(cancelarSolicitudSchema), asyncHandler(cancelar));
