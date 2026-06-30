import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'localidades' })
export class Localidad {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    nombre!: string;

    @Property()
    codigo_postal!: string;

    constructor(data: Partial<Localidad> = {}) {
        Object.assign(this, data);
    }
}
