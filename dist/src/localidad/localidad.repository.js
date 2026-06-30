import { Localidad } from "../localidad/localidad.entity.js";
import { getORM } from '../shared/db/conn.js';
export class LocalidadRepository {
    getRepo() {
        return getORM().em.getRepository(Localidad);
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
        const localidad = em.create(Localidad, item);
        await em.flush();
        return localidad;
    }
    async update(id, item) {
        const em = getORM().em.fork();
        const localidad = await em.getRepository(Localidad).findOne({ _id: id });
        if (!localidad)
            return undefined;
        Object.assign(localidad, item);
        await em.flush();
        return localidad;
    }
    async delete(item) {
        const em = getORM().em.fork();
        const localidad = await em.getRepository(Localidad).findOne({ _id: item._id });
        if (!localidad)
            return undefined;
        await em.remove(localidad).flush();
        return localidad;
    }
}
//# sourceMappingURL=localidad.repository.js.map