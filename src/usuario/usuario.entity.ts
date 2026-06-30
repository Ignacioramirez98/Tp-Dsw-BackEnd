import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';

@Entity({ collection: 'usuarios' })
export class Usuario {
    @PrimaryKey()
    _id!: ObjectId;

    @Property({ unique: true })
    usuario!: string;

    @Property()
    contraseña!: string; // bcrypt hash

    @Property()
    rol!: 'cliente' | 'vendedor' | 'operario' | 'admin';

    @Property()
    activo: boolean = true;

    @Property({ nullable: true })
    clienteId?: ObjectId; // Referencia a Cliente

    @Property({ nullable: true })
    vendedorId?: ObjectId; // Referencia a Vendedor

    @Property({ nullable: true })
    operarioId?: ObjectId; // Referencia a Operario

    @Property()
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    constructor(data: Partial<Usuario> = {}) {
        Object.assign(this, data);
    }
}
