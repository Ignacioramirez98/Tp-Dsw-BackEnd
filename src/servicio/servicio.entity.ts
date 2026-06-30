import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'servicios' })
export class Servicio {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    descripcion!: string;

    @Property()
    importe_por_hora!: number;

    @Property({ nullable: true })
    imagenUrl?: string;

    constructor(data: Partial<Servicio> = {}) {
        Object.assign(this, data);
    }
}