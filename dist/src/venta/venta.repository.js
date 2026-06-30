import { Venta } from "./venta.entity.js";
import { getORM } from '../shared/db/conn.js';
export class VentaRepository {
    getRepo() {
        return getORM().em.getRepository(Venta);
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
        const venta = em.create(Venta, item);
        await em.flush();
        return venta;
    }
    async update(id, item) {
        const em = getORM().em.fork();
        const venta = await em.getRepository(Venta).findOne({ _id: id });
        if (!venta)
            return undefined;
        Object.assign(venta, item);
        await em.flush();
        return venta;
    }
    async delete(item) {
        const em = getORM().em.fork();
        const venta = await em.getRepository(Venta).findOne({ _id: item._id });
        if (!venta)
            return undefined;
        await em.remove(venta).flush();
        return venta;
    }
}
//# sourceMappingURL=venta.repository.js.map