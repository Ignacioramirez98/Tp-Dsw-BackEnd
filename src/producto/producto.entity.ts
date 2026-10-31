import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'productos' })
export class Producto {
    @PrimaryKey({ type: 'ObjectId' })
    _id!: ObjectId;

    @Property({ type: 'string' })
    nombre!: string;

    @Property({ type: 'string' })
    descripcion!: string;

    @Property({ type: 'number' })
    importe_compra!: number;

    @Property({ type: 'number' })
    importe_venta!: number;

    @Property({ type: 'number' })
    stock!: number;

    @Property({ type: 'string', nullable: true })
    imagenUrl?: string;

    constructor(data: Partial<Producto> = {}) {
        Object.assign(this, data);
    }
}
