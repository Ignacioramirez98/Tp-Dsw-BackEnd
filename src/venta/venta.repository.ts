import { ObjectId } from 'mongodb';
import { BaseRepository } from '../shared/base.repository.js';
import { ItemVenta } from './item-venta.entity.js';
import { Venta } from './venta.entity.js';

export interface ItemVentaInput {
    producto: ObjectId;
    cantidad: number;
    precioUnitario: number;
}

export class VentaRepository extends BaseRepository<Venta> {
    protected readonly entity = Venta;
    protected readonly populate = ['cliente', 'cliente.localidad', 'vendedor', 'items', 'items.producto', 'servicios'];

    /** Crea la venta junto con sus ítems en un solo flush. */
    public async addConItems(data: any, items: ItemVentaInput[]): Promise<Venta> {
        const venta = this.em.create(Venta, data);
        for (const item of items) {
            venta.items.add(this.em.create(ItemVenta, { ...item, venta }));
        }
        await this.em.flush();
        return venta;
    }

    /** Actualiza la venta y, si se envían ítems, reemplaza los anteriores. */
    public async updateConItems(id: ObjectId, data: any, items?: ItemVentaInput[]): Promise<Venta | undefined> {
        const venta = await this.em.findOne(Venta, { _id: id }, { populate: ['items'] });
        if (!venta) return undefined;

        this.em.assign(venta, data);
        if (items) {
            venta.items.removeAll(); // orphanRemoval borra los ítems viejos
            for (const item of items) {
                venta.items.add(this.em.create(ItemVenta, { ...item, venta }));
            }
        }
        await this.em.flush();
        return venta;
    }

    public async delete(item: { _id: ObjectId }): Promise<Venta | undefined> {
        const venta = await this.em.findOne(Venta, { _id: item._id }, { populate: ['items'] });
        if (!venta) return undefined;

        await this.em.remove(venta).flush(); // cascade borra también los ítems
        return venta;
    }

    public async hasProducto(productoId: ObjectId): Promise<boolean> {
        return (await this.em.count(ItemVenta, { producto: productoId })) > 0;
    }

    public async hasServicio(servicioId: ObjectId): Promise<boolean> {
        return (await this.em.count(Venta, { servicios: servicioId })) > 0;
    }

    public async hasCliente(clienteId: ObjectId): Promise<boolean> {
        return (await this.em.count(Venta, { cliente: clienteId })) > 0;
    }

    public async hasVendedor(vendedorId: ObjectId): Promise<boolean> {
        return (await this.em.count(Venta, { vendedor: vendedorId })) > 0;
    }
}
