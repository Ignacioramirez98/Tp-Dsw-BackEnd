/**
 * Ciclo de vida de una venta (CUU "Concretar Venta").
 *
 *   pendiente ──concretar──▶ concretada ──facturar──▶ facturada
 *       │                        │
 *       └──────cancelar──────────┴──▶ cancelada
 *
 * - pendiente: pedido cargado por el cliente o el vendedor; todavía no descuenta stock.
 * - concretada: un vendedor la confirmó; se descuenta el stock de cada producto.
 * - facturada: se emitió la factura (CUU "Realizar facturación"); ya no se puede cancelar.
 * - cancelada: se anuló; si estaba concretada, el stock vuelve al depósito.
 */
export const ESTADOS_VENTA = ['pendiente', 'concretada', 'facturada', 'cancelada'] as const;
export type EstadoVenta = (typeof ESTADOS_VENTA)[number];

const TRANSICIONES: Record<EstadoVenta, readonly EstadoVenta[]> = {
    pendiente: ['concretada', 'cancelada'],
    concretada: ['facturada', 'cancelada'],
    facturada: [],
    cancelada: [],
};

const ACCION: Record<EstadoVenta, string> = {
    pendiente: 'volver a pendiente',
    concretada: 'concretar',
    facturada: 'facturar',
    cancelada: 'cancelar',
};

export function puedePasar(desde: string, hacia: EstadoVenta): boolean {
    return (TRANSICIONES[desde as EstadoVenta] ?? []).includes(hacia);
}

/** Mensaje para cuando la transición no está permitida, ej. "No se puede cancelar una venta facturada". */
export function motivoRechazo(desde: string, hacia: EstadoVenta): string {
    return `No se puede ${ACCION[hacia]} una venta ${desde}`;
}

/** Estados en los que la venta ya descontó stock (al cancelarla hay que devolverlo). */
export function descontoStock(estado: string): boolean {
    return estado === 'concretada' || estado === 'facturada';
}
