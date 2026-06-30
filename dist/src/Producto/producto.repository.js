import { Producto } from "./producto.entity.js";
import { getORM } from '../shared/db/conn.js';
export class ProductoRepository {
    getRepo() {
        return getORM().em.getRepository(Producto);
    }
    async findAll() {
        return await this.getRepo().findAll();
    }
    async findOne(item) {
        const result = await this.getRepo().findOne({ _id: item._id });
        return result ?? undefined;
    }
    async add(item) {
        const em = getORM().em.fork();
        const producto = em.create(Producto, item);
        await em.flush();
        return producto;
    }
    async update(id, item) {
        const em = getORM().em.fork();
        const producto = await em.getRepository(Producto).findOne({ _id: id });
        if (!producto)
            return undefined;
        Object.assign(producto, item);
        await em.flush();
        return producto;
    }
    async delete(item) {
        const em = getORM().em.fork();
        const producto = await em.getRepository(Producto).findOne({ _id: item._id });
        if (!producto)
            return undefined;
        await em.remove(producto).flush();
        return producto;
    }
}
//# sourceMappingURL=producto.repository.js.map