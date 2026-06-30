import { Vendedor } from "./vendedor.entity.js";
import { getORM } from '../shared/db/conn.js';
export class VendedorRepository {
    getRepo() {
        return getORM().em.getRepository(Vendedor);
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
        const vendedor = em.create(Vendedor, item);
        await em.flush();
        return vendedor;
    }
    async update(id, item) {
        const em = getORM().em.fork();
        const vendedor = await em.getRepository(Vendedor).findOne({ _id: id });
        if (!vendedor)
            return undefined;
        Object.assign(vendedor, item);
        await em.flush();
        return vendedor;
    }
    async delete(item) {
        const em = getORM().em.fork();
        const vendedor = await em.getRepository(Vendedor).findOne({ _id: item._id });
        if (!vendedor)
            return undefined;
        await em.remove(vendedor).flush();
        return vendedor;
    }
}
//# sourceMappingURL=vendedor.repository.js.map