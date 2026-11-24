import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { Cliente } from '../cliente/cliente.entity.js';
import { Operario } from '../operario/operario.entity.js';
import { Servicio } from '../servicio/servicio.entity.js';

/** Pedido de un cliente para que un operario le realice un servicio (CUU Solicitar Servicio). */
@Entity({ collection: 'solicitudes_servicio' })
export class SolicitudServicio {
    @PrimaryKey({ type: 'ObjectId' })
    _id!: ObjectId;

    @Property({ type: 'string' })
    estado!: string;

    @Property({ type: 'Date' })
    fechaSolicitud!: Date;

    @Property({ type: 'Date', nullable: true })
    fechaPreferida?: Date | null;

    @Property({ type: 'Date', nullable: true })
    fechaAceptacion?: Date | null;

    @Property({ type: 'Date', nullable: true })
    fechaFinalizacion?: Date | null;

    @Property({ type: 'Date', nullable: true })
    fechaCancelacion?: Date | null;

    @Property({ type: 'number' })
    horasEstimadas!: number;

    @Property({ type: 'number', nullable: true })
    horasReales?: number | null;

    // Precio por hora del servicio al momento del pedido: si después cambia, la solicitud no se altera
    @Property({ type: 'number' })
    importePorHora!: number;

    @Property({ type: 'number' })
    importeEstimado!: number;

    @Property({ type: 'number', nullable: true })
    importeFinal?: number | null;

    @Property({ type: 'string', nullable: true })
    observaciones?: string | null;

    @Property({ type: 'string', nullable: true })
    motivoCancelacion?: string | null;

    // SolicitudServicio N --- 1 Cliente
    @ManyToOne(() => Cliente, { fieldName: 'clienteId' })
    cliente!: Cliente;

    // SolicitudServicio N --- 1 Servicio
    @ManyToOne(() => Servicio, { fieldName: 'servicioId' })
    servicio!: Servicio;

    // Operario responsable: el del servicio al pedirlo, o el que la acepta (null si nadie todavía)
    @ManyToOne(() => Operario, { nullable: true, fieldName: 'operarioId' })
    operario?: Operario | null;
}
