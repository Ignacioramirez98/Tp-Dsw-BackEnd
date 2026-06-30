import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'operarios' })
export class Operario {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    nombre!: string;

    @Property()
    apellido!: string;

    @Property()
    mail!: string;

    @Property()
    dni!: number;

    @Property()
    telefono!: string;

    @Property()
    rol!: string;

    constructor(data: Partial<Operario> = {}) {
        Object.assign(this, data);
    }
}