import { Repository } from "../shared/repository.js";
import { Servicio } from "../servicio/servicio.entity.js";
import { getORM } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

export class ServicioRepository implements Repository<Servicio> {
    getRepo() {
        return getORM().em.getRepository(Servicio);
    }

    public async findAll(): Promise<Servicio[] | undefined> {
        return await this.getRepo().findAll();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Servicio | undefined> {
        const result = await this.getRepo().findOne({ _id: item._id });
        return result ?? undefined;
    }

    public async add(item: Servicio): Promise<Servicio | undefined> {
        const em = getORM().em.fork();
        const servicio = em.create(Servicio, item);
        await em.flush();
        return servicio;
    }

    public async update(id: ObjectId, item: Servicio): Promise<Servicio | undefined> {
        const em = getORM().em.fork();
        const servicio = await em.getRepository(Servicio).findOne({ _id: id });
        if (!servicio) return undefined;

        Object.assign(servicio, item);
        await em.flush();
        return servicio;
    }

    public async delete(item: { _id: ObjectId }): Promise<Servicio | undefined> {
        const em = getORM().em.fork();
        const servicio = await em.getRepository(Servicio).findOne({ _id: item._id });
        if (!servicio) return undefined;

        await em.remove(servicio).flush();
        return servicio;
    }
}
