import { Entity, OneToOne, OptionalProps, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { Cliente } from '../cliente/cliente.entity.js';
import { Vendedor } from '../Vendedor/vendedor.entity.js';
import { Operario } from '../operario/operario.entity.js';

export type Rol = 'cliente' | 'vendedor' | 'operario' | 'admin';

@Entity({ collection: 'usuarios' })
export class Usuario {
    // Campos con valor por defecto: no hace falta pasarlos al crear
    [OptionalProps]?: 'activo' | 'createdAt' | 'updatedAt';

    @PrimaryKey({ type: 'ObjectId' })
    _id!: ObjectId;

    @Property({ type: 'string', unique: true })
    usuario!: string;

    @Property({ type: 'string', hidden: true })
    contraseña!: string; // bcrypt hash, nunca se serializa

    @Property({ type: 'string' })
    rol!: Rol;

    @Property({ type: 'boolean' })
    activo: boolean = true;

    // Cada usuario se vincula (según su rol) con su perfil de negocio
    @OneToOne(() => Cliente, { owner: true, nullable: true, fieldName: 'clienteId' })
    cliente?: Cliente | null;

    @OneToOne(() => Vendedor, { owner: true, nullable: true, fieldName: 'vendedorId' })
    vendedor?: Vendedor | null;

    @OneToOne(() => Operario, { owner: true, nullable: true, fieldName: 'operarioId' })
    operario?: Operario | null;

    @Property({ type: 'Date' })
    createdAt: Date = new Date();

    @Property({ type: 'Date', onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}
