import type { Venta } from '../venta/venta.entity.js';
import type { LineaFactura, ReceptorFactura } from './factura.entity.js';

/** IVA general que se discrimina en la factura (%). Los precios de productos se toman como netos. */
export const ALICUOTA_IVA = 21;

/** Punto de venta que lleva el número de comprobante. */
export const PUNTO_DE_VENTA = '0001';

export const redondear = (valor: number) => Math.round((valor + Number.EPSILON) * 100) / 100;

/** 1 → "0001-00000001". */
export const formatearNumero = (secuencia: number) => `${PUNTO_DE_VENTA}-${String(secuencia).padStart(8, '0')}`;

export interface Comprobante {
    receptor: ReceptorFactura;
    lineas: LineaFactura[];
    subtotal: number;
    alicuotaIva: number;
    iva: number;
    total: number;
}

/**
 * Arma el contenido de la factura a partir de la venta concretada: un renglón por ítem
 * (con el precio al que se vendió) y los totales con IVA discriminado.
 * Los servicios de la venta no se facturan acá: se cotizan por hora (solicitudes de servicio).
 */
export function armarComprobante(venta: Venta): Comprobante {
    const lineas: LineaFactura[] = Array.from(venta.items).map((item) => ({
        descripcion: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        importe: redondear(item.cantidad * item.precioUnitario),
    }));

    const subtotal = redondear(lineas.reduce((suma, linea) => suma + linea.importe, 0));
    const iva = redondear((subtotal * ALICUOTA_IVA) / 100);

    const cliente = venta.cliente;
    const receptor: ReceptorFactura = {
        nombre: `${cliente.nombre} ${cliente.apellido}`.trim(),
        dni: cliente.dni,
        razonSocial: cliente.razon_social,
        direccion: cliente.direccion,
        localidad: cliente.localidad?.nombre ?? null,
        mail: cliente.mail,
    };

    return { receptor, lineas, subtotal, alicuotaIva: ALICUOTA_IVA, iva, total: redondear(subtotal + iva) };
}
