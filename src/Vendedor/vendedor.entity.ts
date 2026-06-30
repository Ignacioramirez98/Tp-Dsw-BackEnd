import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'vendedores' })
export class Vendedor {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    nombre!: string;

    @Property()
    apellido!: string;

    @Property()
    mail!: string;

    @Property()
    dni!: string;

    @Property()
    telefono!: string;

    @Property()
    rol!: string;

    constructor(data: Partial<Vendedor> = {}) {
        Object.assign(this, data);
    }
}
