import { Repository } from "../shared/repository.js";
import { Cliente } from "../cliente/cliente.entity.js";
import { getORM } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

export class ClienteRepository implements Repository<Cliente> {
    getRepo() {
        return getORM().em.getRepository(Cliente);
    }

    public async findAll(filters?: Record<string, any>): Promise<Cliente[] | undefined> {
        const query = filters || {};
        return await this.getRepo().find(query);
    }

    public async findOne(filter: { _id: ObjectId }): Promise<Cliente | undefined>;
    public async findOne(filter: { usuario: string }): Promise<Cliente | undefined>;
    public async findOne(filter: { [key: string]: any }): Promise<Cliente | undefined> {
        const result = await this.getRepo().findOne(filter);
        return result ?? undefined;
    }

    public async add(item: Cliente): Promise<Cliente | undefined> {
        const em = getORM().em.fork();
        const cliente = em.create(Cliente, item);
        await em.flush();
        return cliente;
    }

    public async update(id: ObjectId, item: Cliente): Promise<Cliente | undefined> {
        const em = getORM().em.fork();
        const cliente = await em.getRepository(Cliente).findOne({ _id: id });
        if (!cliente) return undefined;

        Object.assign(cliente, item);
        await em.flush();
        return cliente;
    }

    public async delete(item: { _id: ObjectId }): Promise<Cliente | undefined> {
        const em = getORM().em.fork();
        const cliente = await em.getRepository(Cliente).findOne({ _id: item._id });
        if (!cliente) return undefined;

        await em.remove(cliente).flush();
        return cliente;
    }
}
