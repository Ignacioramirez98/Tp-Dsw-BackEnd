import { Entity, ManyToOne, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { Producto } from '../producto/producto.entity.js';
import type { Venta } from './venta.entity.js';

/**
 * Línea de una venta: qué producto, cuántas unidades y a qué precio se vendió.
 * El precio se guarda al momento de la venta para que no cambie si después
 * se modifica el precio del producto.
 */
@Entity({ collection: 'items_venta' })
export class ItemVenta {
    [OptionalProps]?: 'subtotal';

    @PrimaryKey()
    _id!: ObjectId;

    @ManyToOne('Venta', { fieldName: 'ventaId', hidden: true })
    venta!: Venta;

    @ManyToOne(() => Producto, { fieldName: 'productoId' })
    producto!: Producto;

    @Property()
    cantidad!: number;

    @Property()
    precioUnitario!: number;

    @Property({ persist: false })
    get subtotal(): number {
        return this.cantidad * this.precioUnitario;
    }
}
