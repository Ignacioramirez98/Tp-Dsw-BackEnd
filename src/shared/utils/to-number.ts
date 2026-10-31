/**
 * Los formularios multipart (con imagen) mandan todos los campos como texto.
 * Convierte a número los valores numéricos recibidos; deja undefined si no vino.
 */
export function toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}
