import { z } from 'zod';
import { fechaOpcional, objectId, objectIdOpcional } from './common.js';

const itemSchema = z.object({
    productoId: objectId('productoId'),
    cantidad: z.coerce.number({ invalid_type_error: 'cantidad debe ser un número' })
        .int('La cantidad de cada ítem debe ser un entero mayor a 0')
        .min(1, 'La cantidad de cada ítem debe ser un entero mayor a 0'),
});

// El estado, la fecha de venta y la de cancelación no se cargan a mano:
// cambian con POST /ventas/:id/concretar y /ventas/:id/cancelar (si llegan, se ignoran).
const ventaBase = z.object({
    fechaContacto: fechaOpcional('fechaContacto'),
    fechaEntrega: fechaOpcional('fechaEntrega'),
    vendedorId: objectIdOpcional('vendedorId'),
    items: z.array(itemSchema, { invalid_type_error: 'items debe ser una lista' }).optional(),
    productoIds: z.array(objectId('productoId'), { invalid_type_error: 'productoIds debe ser una lista' }).optional(), // formato anterior
    servicioIds: z.array(objectId('servicioId'), { invalid_type_error: 'servicioIds debe ser una lista' }).optional(),
});

// clienteId es opcional acá: cuando el pedido lo hace un cliente se toma de su sesión;
// para vendedor/admin el servicio exige que venga.
export const createVentaSchema = ventaBase
    .extend({ clienteId: objectId('clienteId').optional() })
    .refine(
        (venta) => (venta.items?.length ?? 0) + (venta.productoIds?.length ?? 0) + (venta.servicioIds?.length ?? 0) > 0,
        { message: 'La venta debe tener al menos un producto o un servicio', path: ['items'] },
    );

export const updateVentaSchema = ventaBase.extend({ clienteId: objectId('clienteId').optional() });

export const concretarVentaSchema = z.object({
    vendedorId: objectIdOpcional('vendedorId'),
    fechaEntrega: fechaOpcional('fechaEntrega'),
});
