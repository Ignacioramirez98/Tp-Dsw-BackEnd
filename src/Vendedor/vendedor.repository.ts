import { Repository } from "../shared/repository.js";
import { Vendedor } from "./vendedor.entity.js";
import { getORM } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

export class VendedorRepository implements Repository<Vendedor> {
    getRepo() {
        return getORM().em.getRepository(Vendedor);
    }

    public async findAll(): Promise<Vendedor[] | undefined> {
        return await this.getRepo().findAll();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Vendedor | undefined> {
        const result = await this.getRepo().findOne({ _id: item._id });
        return result ?? undefined;
    }

    public async add(item: Vendedor): Promise<Vendedor | undefined> {
        const em = getORM().em.fork();
        const vendedor = em.create(Vendedor, item);
        await em.flush();
        return vendedor;
    }

    public async update(id: ObjectId, item: Vendedor): Promise<Vendedor | undefined> {
        const em = getORM().em.fork();
        const vendedor = await em.getRepository(Vendedor).findOne({ _id: id });
        if (!vendedor) return undefined;

        Object.assign(vendedor, item);
        await em.flush();
        return vendedor;
    }

    public async delete(item: { _id: ObjectId }): Promise<Vendedor | undefined> {
        const em = getORM().em.fork();
        const vendedor = await em.getRepository(Vendedor).findOne({ _id: item._id });
        if (!vendedor) return undefined;

        await em.remove(vendedor).flush();
        return vendedor;
    }
}
