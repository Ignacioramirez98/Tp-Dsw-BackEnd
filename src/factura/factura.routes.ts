import { Router } from 'express';
import { findAll, findOne } from './factura.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';

export const facturaRouter = Router();

// Las facturas son comprobantes: solo se consultan. Se emiten con POST /ventas/:id/facturar.
// Vendedores y admin ven todas; el cliente, solo las suyas (el servicio lo filtra).
facturaRouter.get('/', protectRoute, requireRole('admin', 'vendedor', 'cliente'), asyncHandler(findAll));
facturaRouter.get('/:id', protectRoute, requireRole('admin', 'vendedor', 'cliente'), asyncHandler(findOne));
