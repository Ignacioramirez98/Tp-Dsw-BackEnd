import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { Operario } from '../operario/operario.entity.js';

@Entity({ collection: 'servicios' })
export class Servicio {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    descripcion!: string;

    @Property()
    importe_por_hora!: number;

    // Servicio N --- 1 Operario responsable
    @ManyToOne(() => Operario, { nullable: true, fieldName: 'operarioId' })
    operario?: Operario | null;

    @Property({ nullable: true })
    imagenUrl?: string;
}
