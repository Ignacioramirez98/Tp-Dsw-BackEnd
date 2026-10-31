import { Cascade, Collection, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { Cliente } from '../cliente/cliente.entity.js';
import { Vendedor } from '../Vendedor/vendedor.entity.js';
import { Servicio } from '../servicio/servicio.entity.js';
import { ItemVenta } from './item-venta.entity.js';

@Entity({ collection: 'ventas' })
export class Venta {
    @PrimaryKey()
    _id!: ObjectId;

    @Property()
    estado!: string;

    @Property()
    fechaContacto!: Date;

    @Property({ nullable: true })
    fechaDeVenta?: Date | null;

    @Property({ nullable: true })
    fechaEntrega?: Date | null;

    @Property({ nullable: true })
    fechaCancelacion?: Date | null;

    // Venta N --- 1 Cliente (se mantiene el nombre de campo existente en la base)
    @ManyToOne(() => Cliente, { fieldName: 'clienteId' })
    cliente!: Cliente;

    // Venta N --- 1 Vendedor (nullable: un pedido del cliente todavía no tiene vendedor)
    @ManyToOne(() => Vendedor, { nullable: true, fieldName: 'vendedorId' })
    vendedor?: Vendedor | null;

    // Venta 1 --- N ItemVenta (producto + cantidad + precio)
    @OneToMany(() => ItemVenta, (item) => item.venta, { cascade: [Cascade.ALL], orphanRemoval: true })
    items = new Collection<ItemVenta>(this);

    // Venta N --- M Servicio
    @ManyToMany(() => Servicio, undefined, { owner: true, fieldName: 'servicioIds' })
    servicios = new Collection<Servicio>(this);
}
