import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'productos' })
export class Producto {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    nombre!: string;

    @Property()
    descripcion!: string;

    @Property()
    importe_compra!: number;

    @Property()
    importe_venta!: number;

    @Property()
    stock!: number;

    constructor(data: Partial<Producto> = {}) {
        Object.assign(this, data);
    }
}
