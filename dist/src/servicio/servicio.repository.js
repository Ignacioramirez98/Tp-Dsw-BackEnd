import { Servicio } from "../servicio/servicio.entity.js";
import { getORM } from '../shared/db/conn.js';
export class ServicioRepository {
    getRepo() {
        return getORM().em.getRepository(Servicio);
    }
    async findAll(filters) {
        const query = filters || {};
        return await this.getRepo().find(query);
    }
    async findOne(item) {
        const result = await this.getRepo().findOne({ _id: item._id });
        return result ?? undefined;
    }
    async add(item) {
        const em = getORM().em.fork();
        const servicio = em.create(Servicio, item);
        await em.flush();
        return servicio;
    }
    async update(id, item) {
        const em = getORM().em.fork();
        const servicio = await em.getRepository(Servicio).findOne({ _id: id });
        if (!servicio)
            return undefined;
        Object.assign(servicio, item);
        await em.flush();
        return servicio;
    }
    async delete(item) {
        const em = getORM().em.fork();
        const servicio = await em.getRepository(Servicio).findOne({ _id: item._id });
        if (!servicio)
            return undefined;
        await em.remove(servicio).flush();
        return servicio;
    }
}
//# sourceMappingURL=servicio.repository.js.map