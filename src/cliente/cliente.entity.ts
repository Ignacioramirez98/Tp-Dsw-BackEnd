import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { Localidad } from '../localidad/localidad.entity.js';

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

    // Cliente N --- 1 Localidad (nullable para no romper clientes cargados antes)
    @ManyToOne(() => Localidad, { nullable: true, fieldName: 'localidadId' })
    localidad?: Localidad | null;

    @Property({ nullable: true })
    imagenUrl?: string;
}
