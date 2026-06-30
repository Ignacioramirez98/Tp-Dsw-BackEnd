import { Repository } from "../shared/repository.js";
import { Operario } from "../operario/operario.entity.js";
import { getORM } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

export class OperarioRepository implements Repository<Operario> {
    getRepo() {
        return getORM().em.getRepository(Operario);
    }

    public async findAll(): Promise<Operario[] | undefined> {
        return await this.getRepo().findAll();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Operario | undefined> {
        const result = await this.getRepo().findOne({ _id: item._id });
        return result ?? undefined;
    }

    public async add(item: Operario): Promise<Operario | undefined> {
        const em = getORM().em.fork();
        const operario = em.create(Operario, item);
        await em.flush();
        return operario;
    }

    public async update(id: ObjectId, item: Operario): Promise<Operario | undefined> {
        const em = getORM().em.fork();
        const operario = await em.getRepository(Operario).findOne({ _id: id });
        if (!operario) return undefined;

        Object.assign(operario, item);
        await em.flush();
        return operario;
    }

    public async delete(item: { _id: ObjectId }): Promise<Operario | undefined> {
        const em = getORM().em.fork();
        const operario = await em.getRepository(Operario).findOne({ _id: item._id });
        if (!operario) return undefined;

        await em.remove(operario).flush();
        return operario;
    }
}
