import { Repository } from "../shared/repository.js";
import { Producto } from "./producto.entity.js";
import { getORM } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

export class ProductoRepository implements Repository<Producto> {
    getRepo() {
        return getORM().em.getRepository(Producto);
    }

    public async findAll(filters?: Record<string, any>): Promise<Producto[] | undefined> {
        const query = filters || {};
        return await this.getRepo().find(query);
    }

    public async findOne(item: { _id: ObjectId }): Promise<Producto | undefined> {
        const result = await this.getRepo().findOne({ _id: item._id });
        return result ?? undefined;
    }

    public async add(item: Producto): Promise<Producto | undefined> {
        const em = getORM().em.fork();
        const producto = em.create(Producto, item);
        await em.flush();
        return producto;
    }

    public async update(id: ObjectId, item: Producto): Promise<Producto | undefined> {
        const em = getORM().em.fork();
        const producto = await em.getRepository(Producto).findOne({ _id: id });
        if (!producto) return undefined;

        Object.assign(producto, item);
        await em.flush();
        return producto;
    }

    public async delete(item: { _id: ObjectId }): Promise<Producto | undefined> {
        const em = getORM().em.fork();
        const producto = await em.getRepository(Producto).findOne({ _id: item._id });
        if (!producto) return undefined;

        await em.remove(producto).flush();
        return producto;
    }
}
