import { Repository } from "../shared/repository.js";
import { Venta } from "./venta.entity.js";
import { getORM } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

export class VentaRepository implements Repository<Venta> {
    getRepo() {
        return getORM().em.getRepository(Venta);
    }

    public async findAll(): Promise<Venta[] | undefined> {
        return await this.getRepo().findAll();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Venta | undefined> {
        const result = await this.getRepo().findOne({ _id: item._id });
        return result ?? undefined;
    }

    public async add(item: Venta): Promise<Venta | undefined> {
        const em = getORM().em.fork();
        const venta = em.create(Venta, item);
        await em.flush();
        return venta;
    }

    public async update(id: ObjectId, item: Venta): Promise<Venta | undefined> {
        const em = getORM().em.fork();
        const venta = await em.getRepository(Venta).findOne({ _id: id });
        if (!venta) return undefined;

        Object.assign(venta, item);
        await em.flush();
        return venta;
    }

    public async delete(item: { _id: ObjectId }): Promise<Venta | undefined> {
        const em = getORM().em.fork();
        const venta = await em.getRepository(Venta).findOne({ _id: item._id });
        if (!venta) return undefined;

        await em.remove(venta).flush();
        return venta;
    }
}
