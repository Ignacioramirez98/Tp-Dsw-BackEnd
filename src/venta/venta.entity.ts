import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'ventas' })
export class Venta {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    estado!: string;

    @Property()
    fechaContacto!: Date;

    @Property()
    fechaDeVenta!: Date;

    @Property()
    fechaEntrega!: Date;

    @Property({ nullable: true })
    fechaCancelacion?: Date | null;

    @Property()
    clienteId!: ObjectId;

    @Property()
    productoIds!: ObjectId[];

    @Property()
    servicioIds!: ObjectId[];

    constructor(data: Partial<Venta> = {}) {
        Object.assign(this, data);
    }
}
