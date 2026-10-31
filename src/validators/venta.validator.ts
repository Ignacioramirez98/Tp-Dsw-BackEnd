import { z } from 'zod';
import { fechaOpcional, objectId, objectIdOpcional } from './common.js';

const itemSchema = z.object({
    productoId: objectId('productoId'),
    cantidad: z.coerce.number({ invalid_type_error: 'cantidad debe ser un número' })
        .int('La cantidad de cada ítem debe ser un entero mayor a 0')
        .min(1, 'La cantidad de cada ítem debe ser un entero mayor a 0'),
});

const ventaBase = z.object({
    estado: z.string().trim().min(1, 'estado no puede estar vacío').max(50).optional(),
    fechaContacto: fechaOpcional('fechaContacto'),
    fechaDeVenta: fechaOpcional('fechaDeVenta'),
    fechaEntrega: fechaOpcional('fechaEntrega'),
    fechaCancelacion: fechaOpcional('fechaCancelacion'),
    vendedorId: objectIdOpcional('vendedorId'),
    items: z.array(itemSchema, { invalid_type_error: 'items debe ser una lista' }).optional(),
    productoIds: z.array(objectId('productoId'), { invalid_type_error: 'productoIds debe ser una lista' }).optional(), // formato anterior
    servicioIds: z.array(objectId('servicioId'), { invalid_type_error: 'servicioIds debe ser una lista' }).optional(),
});

export const createVentaSchema = ventaBase
    .extend({ clienteId: objectId('clienteId') })
    .refine(
        (venta) => (venta.items?.length ?? 0) + (venta.productoIds?.length ?? 0) + (venta.servicioIds?.length ?? 0) > 0,
        { message: 'La venta debe tener al menos un producto o un servicio', path: ['items'] },
    );

export const updateVentaSchema = ventaBase.extend({ clienteId: objectId('clienteId').optional() });
