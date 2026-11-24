import { z } from 'zod';
import { fechaOpcional, objectId, objectIdOpcional } from './common.js';

/** Texto libre opcional: se recorta y, si queda vacío, cuenta como "no enviado". */
const textoOpcional = (campo: string, max: number) =>
    z.preprocess(
        (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
        z.string({ invalid_type_error: `${campo} debe ser texto` }).trim().max(max, `${campo} no puede superar ${max} caracteres`).nullish(),
    );

const horas = (campo: string) =>
    z.coerce.number({ invalid_type_error: `${campo} debe ser un número` })
        .positive(`${campo} debe ser mayor a 0`)
        .max(1000, `${campo} no puede superar 1000`);

// El estado, el importe, el operario y las fechas de gestión no se cargan a mano:
// el cliente solo indica qué servicio quiere, cuántas horas estima y cuándo lo prefiere.
export const createSolicitudSchema = z.object({
    servicioId: objectId('servicioId'),
    horasEstimadas: horas('horasEstimadas'),
    fechaPreferida: fechaOpcional('fechaPreferida'),
    observaciones: textoOpcional('observaciones', 500),
});

export const aceptarSolicitudSchema = z.object({
    // Solo para admin: el operario que se hace cargo. Un operario acepta siempre a su nombre.
    operarioId: objectIdOpcional('operarioId'),
});

export const finalizarSolicitudSchema = z.object({
    horasReales: horas('horasReales').optional(),
});

export const cancelarSolicitudSchema = z.object({
    motivo: textoOpcional('motivo', 300),
});
