/**
 * Ciclo de vida de una solicitud de servicio (CUU "Solicitar Servicio").
 *
 *   pendiente ──aceptar──▶ aceptada ──finalizar──▶ finalizada
 *       │                      │
 *       └──────cancelar────────┴──▶ cancelada
 *
 * - pendiente: el cliente la pidió; todavía ningún operario se hizo cargo.
 * - aceptada: un operario la tomó (queda como responsable).
 * - finalizada: el trabajo se hizo; se registra el importe final.
 * - cancelada: la anuló el cliente (solo si estaba pendiente) o un operario/admin.
 */
export const ESTADOS_SOLICITUD = ['pendiente', 'aceptada', 'finalizada', 'cancelada'] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

const TRANSICIONES: Record<EstadoSolicitud, readonly EstadoSolicitud[]> = {
    pendiente: ['aceptada', 'cancelada'],
    aceptada: ['finalizada', 'cancelada'],
    finalizada: [],
    cancelada: [],
};

const ACCION: Record<EstadoSolicitud, string> = {
    pendiente: 'volver a pendiente',
    aceptada: 'aceptar',
    finalizada: 'finalizar',
    cancelada: 'cancelar',
};

export function puedePasar(desde: string, hacia: EstadoSolicitud): boolean {
    return (TRANSICIONES[desde as EstadoSolicitud] ?? []).includes(hacia);
}

/** Mensaje para cuando la transición no está permitida, ej. "No se puede aceptar una solicitud cancelada". */
export function motivoRechazo(desde: string, hacia: EstadoSolicitud): string {
    return `No se puede ${ACCION[hacia]} una solicitud ${desde}`;
}
