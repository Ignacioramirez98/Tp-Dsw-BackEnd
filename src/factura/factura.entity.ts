import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { Cliente } from '../cliente/cliente.entity.js';
import { Venta } from '../venta/venta.entity.js';

/** Renglón de la factura: copia del ítem de la venta al momento de emitirla. */
export interface LineaFactura {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    importe: number;
}

/** Datos del cliente tal como estaban al emitir la factura. */
export interface ReceptorFactura {
    nombre: string;
    dni: string;
    razonSocial: string;
    direccion: string;
    localidad: string | null;
    mail: string;
}

// En el JSON de la factura la venta y el cliente salen como simples ids (no se vuelca la venta entera)
const comoId = (relacion: any) => String(relacion?._id ?? relacion);

/**
 * Factura de una venta concretada (CUU "Realizar facturación").
 * Es un comprobante inmutable: guarda una copia de los datos del cliente y de los renglones,
 * así no cambia si después se modifica un producto, un precio o el cliente.
 */
@Entity({ collection: 'facturas' })
export class Factura {
    @PrimaryKey({ type: 'ObjectId' })
    _id!: ObjectId;

    /** Número correlativo con punto de venta, ej. 0001-00000001. */
    @Property({ type: 'string', unique: true })
    numero!: string;

    @Property({ type: 'Date' })
    fechaEmision!: Date;

    // Factura 1 --- 1 Venta (una venta se factura una sola vez)
    @ManyToOne(() => Venta, { fieldName: 'ventaId', serializer: comoId })
    venta!: Venta;

    // Se guarda la referencia para que cada cliente pueda listar solo sus facturas
    @ManyToOne(() => Cliente, { fieldName: 'clienteId', serializer: comoId })
    cliente!: Cliente;

    /** Usuario (vendedor o admin) que emitió la factura. */
    @Property({ type: 'string' })
    emitidaPor!: string;

    @Property({ type: 'json' })
    receptor!: ReceptorFactura;

    @Property({ type: 'json' })
    lineas!: LineaFactura[];

    /** Suma de los renglones, sin IVA. */
    @Property({ type: 'number' })
    subtotal!: number;

    /** Alícuota de IVA aplicada, en porcentaje (21). */
    @Property({ type: 'number' })
    alicuotaIva!: number;

    @Property({ type: 'number' })
    iva!: number;

    @Property({ type: 'number' })
    total!: number;
}
