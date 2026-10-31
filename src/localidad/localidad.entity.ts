import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'localidades' })
export class Localidad {
    @PrimaryKey({ type: 'ObjectId' })
    _id!: ObjectId;

    @Property({ type: 'string' })
    nombre!: string;

    @Property({ type: 'string' })
    codigo_postal!: string;

    constructor(data: Partial<Localidad> = {}) {
        Object.assign(this, data);
    }
}
