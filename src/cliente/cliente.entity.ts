import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'clientes' })
export class Cliente {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    nombre!: string;

    @Property()
    apellido!: string;

    @Property()
    dni!: string;

    @Property()
    mail!: string;

    @Property()
    telefono!: string;

    @Property()
    direccion!: string;

    @Property()
    razon_social!: string;

    @Property()
    usuario!: string;

    @Property()
    contraseña!: string;

    constructor(data: Partial<Cliente> = {}) {
        Object.assign(this, data);
    }
}