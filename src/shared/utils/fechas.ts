/**
 * Fechas de calendario (sin hora). La empresa opera en Argentina (UTC-3, sin horario
 * de verano), así que "2026-11-20" significa el comienzo de ese día en Argentina y no
 * la medianoche UTC (que en Argentina sería el 19 a las 21 h).
 */
const ZONA_HORARIA = '-03:00';
const DESFASE_MS = 3 * 60 * 60 * 1000;
export const UN_DIA_MS = 24 * 60 * 60 * 1000;

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Texto AAAA-MM-DD (o fecha ISO completa) → Date. Devuelve una fecha inválida si no se puede leer. */
export function leerFecha(valor: string | number | Date): Date {
    if (typeof valor === 'string' && SOLO_FECHA.test(valor)) return new Date(`${valor}T00:00:00${ZONA_HORARIA}`);
    return new Date(valor);
}

/** Comienzo del día (en Argentina) en que cae la fecha. */
export function inicioDelDia(fecha: Date): Date {
    const dia = new Date(fecha.getTime() - DESFASE_MS).toISOString().slice(0, 10);
    return leerFecha(dia);
}
