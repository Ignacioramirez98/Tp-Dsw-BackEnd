import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'operarios' })
export class Operario {
    @PrimaryKey({ type: 'ObjectId' })
    _id!: ObjectId;

    @Property({ type: 'string' })
    nombre!: string;

    @Property({ type: 'string' })
    apellido!: string;

    @Property({ type: 'string' })
    mail!: string;

    @Property({ type: 'string' })
    dni!: string;

    @Property({ type: 'string' })
    telefono!: string;

    @Property({ type: 'string' })
    rol: string = 'operario';

    constructor(data: Partial<Operario> = {}) {
        Object.assign(this, data);
    }
}
