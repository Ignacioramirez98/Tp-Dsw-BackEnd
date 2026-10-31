import { ObjectId } from 'mongodb';
import { BadRequestError } from '../errors.js';

/**
 * Convierte un string a ObjectId. Devuelve null si el valor no es un ObjectId válido.
 */
export function toObjectId(value: unknown): ObjectId | null {
    if (value instanceof ObjectId) return value;
    if (typeof value === 'string' && ObjectId.isValid(value)) return new ObjectId(value);
    return null;
}

/**
 * Igual que toObjectId, pero lanza un 400 si el valor no es válido.
 */
export function parseId(value: unknown, campo = 'ID'): ObjectId {
    const id = toObjectId(value);
    if (!id) throw new BadRequestError(`${campo} inválido`);
    return id;
}
