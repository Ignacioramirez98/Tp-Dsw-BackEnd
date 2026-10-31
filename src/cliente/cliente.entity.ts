import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { Localidad } from '../localidad/localidad.entity.js';

@Entity({ collection: 'clientes' })
export class Cliente {
    @PrimaryKey({ type: 'ObjectId' })
    _id!: ObjectId;

    @Property({ type: 'string' })
    nombre!: string;

    @Property({ type: 'string' })
    apellido!: string;

    @Property({ type: 'string' })
    dni!: string;

    @Property({ type: 'string' })
    mail!: string;

    @Property({ type: 'string' })
    telefono!: string;

    @Property({ type: 'string' })
    direccion!: string;

    @Property({ type: 'string' })
    razon_social!: string;

    // Cliente N --- 1 Localidad (nullable para no romper clientes cargados antes)
    @ManyToOne(() => Localidad, { nullable: true, fieldName: 'localidadId' })
    localidad?: Localidad | null;

    @Property({ type: 'string', nullable: true })
    imagenUrl?: string;
}
