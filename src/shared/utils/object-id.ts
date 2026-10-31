import { ObjectId } from 'mongodb';

/**
 * Convierte un string a ObjectId. Devuelve null si el valor no es un ObjectId válido.
 */
export function toObjectId(value: unknown): ObjectId | null {
    if (value instanceof ObjectId) return value;
    if (typeof value === 'string' && ObjectId.isValid(value)) return new ObjectId(value);
    return null;
}
