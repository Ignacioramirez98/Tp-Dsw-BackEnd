import { z } from 'zod';
import { leerFecha } from '../shared/utils/fechas.js';

/**
 * Reglas reutilizables para los schemas de entrada.
 * Los formularios con imagen (multipart) mandan todo como texto,
 * por eso los números usan z.coerce.
 */

export const texto = (campo: string, max = 200) =>
    z.string({ required_error: `${campo} es obligatorio`, invalid_type_error: `${campo} debe ser texto` })
        .trim()
        .min(1, `${campo} es obligatorio`)
        .max(max, `${campo} no puede superar ${max} caracteres`);

/** Acepta texto o número (por ejemplo un DNI enviado como número) y lo trata como texto. */
const comoTexto = (campo: string) => z.preprocess(
    (value) => (typeof value === 'number' ? String(value) : value),
    z.string({ required_error: `${campo} es obligatorio`, invalid_type_error: `${campo} debe ser texto` }).trim(),
);

export const email = z.string({ required_error: 'mail es obligatorio' }).trim().email('mail inválido');

/** DNI argentino: 7 u 8 dígitos. Acepta puntos (12.345.678) y los quita. */
export const dni = comoTexto('dni')
    .transform((value) => value.replace(/\./g, '').trim())
    .refine((value) => /^\d{7,8}$/.test(value), 'dni debe tener 7 u 8 dígitos');

/** Teléfono: dígitos, espacios, +, - y paréntesis, con al menos 6 dígitos. */
export const telefono = comoTexto('telefono')
    .refine((value) => /^[\d\s+()-]+$/.test(value) && value.replace(/\D/g, '').length >= 6, 'telefono inválido');

/** Número que puede llegar como texto (multipart). Vacío cuenta como "no enviado". */
const numero = (campo: string) => z.preprocess(
    (value) => (value === '' || value === null ? undefined : typeof value === 'string' ? Number(value) : value),
    z.number({ required_error: `${campo} es obligatorio`, invalid_type_error: `${campo} debe ser un número` }),
);

export const importe = (campo: string) => numero(campo).pipe(z.number().min(0, `${campo} no puede ser negativo`));
export const importePositivo = (campo: string) => numero(campo).pipe(z.number().positive(`${campo} debe ser mayor a 0`));
export const enteroNoNegativo = (campo: string) => numero(campo).pipe(z.number().int(`${campo} debe ser un número entero`).min(0, `${campo} no puede ser negativo`));

/** Id de Mongo (24 caracteres hexadecimales). */
export const objectId = (campo: string) =>
    z.string({ required_error: `${campo} es obligatorio`, invalid_type_error: `${campo} debe ser texto` })
        .regex(/^[0-9a-fA-F]{24}$/, `${campo} inválido`);

/** Id opcional que se puede vaciar con null o '' (para quitar una relación). */
export const objectIdOpcional = (campo: string) => z.union([objectId(campo), z.literal(''), z.null()]).optional();

/** Fecha opcional: acepta AAAA-MM-DD (día en Argentina), ISO completa o Date; null o '' la borran. */
export const fechaOpcional = (campo: string) =>
    z.preprocess(
        (value) => (value === '' ? null : typeof value === 'string' || typeof value === 'number' ? leerFecha(value) : value),
        z.date({ errorMap: () => ({ message: `${campo} no es una fecha válida` }) }).nullable(),
    ).optional();

export { comoTexto };
