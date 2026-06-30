import { Repository } from "../shared/repository.js";
import { Localidad } from "../localidad/localidad.entity.js";
import { getORM } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

export class LocalidadRepository implements Repository<Localidad> {
    getRepo() {
        return getORM().em.getRepository(Localidad);
    }

    public async findAll(): Promise<Localidad[] | undefined> {
        return await this.getRepo().findAll();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Localidad | undefined> {
        const result = await this.getRepo().findOne({ _id: item._id });
        return result ?? undefined;
    }

    public async add(item: Localidad): Promise<Localidad | undefined> {
        const em = getORM().em.fork();
        const localidad = em.create(Localidad, item);
        await em.flush();
        return localidad;
    }

    public async update(id: ObjectId, item: Localidad): Promise<Localidad | undefined> {
        const em = getORM().em.fork();
        const localidad = await em.getRepository(Localidad).findOne({ _id: id });
        if (!localidad) return undefined;

        Object.assign(localidad, item);
        await em.flush();
        return localidad;
    }

    public async delete(item: { _id: ObjectId }): Promise<Localidad | undefined> {
        const em = getORM().em.fork();
        const localidad = await em.getRepository(Localidad).findOne({ _id: item._id });
        if (!localidad) return undefined;

        await em.remove(localidad).flush();
        return localidad;
    }
}
