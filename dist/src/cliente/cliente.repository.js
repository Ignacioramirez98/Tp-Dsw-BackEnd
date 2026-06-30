import { Cliente } from "../cliente/cliente.entity.js";
import { getORM } from '../shared/db/conn.js';
export class ClienteRepository {
    getRepo() {
        return getORM().em.getRepository(Cliente);
    }
    async findAll(filters) {
        const query = filters || {};
        return await this.getRepo().find(query);
    }
    async findOne(filter) {
        const result = await this.getRepo().findOne(filter);
        return result ?? undefined;
    }
    async add(item) {
        const em = getORM().em.fork();
        const cliente = em.create(Cliente, item);
        await em.flush();
        return cliente;
    }
    async update(id, item) {
        const em = getORM().em.fork();
        const cliente = await em.getRepository(Cliente).findOne({ _id: id });
        if (!cliente)
            return undefined;
        Object.assign(cliente, item);
        await em.flush();
        return cliente;
    }
    async delete(item) {
        const em = getORM().em.fork();
        const cliente = await em.getRepository(Cliente).findOne({ _id: item._id });
        if (!cliente)
            return undefined;
        await em.remove(cliente).flush();
        return cliente;
    }
}
//# sourceMappingURL=cliente.repository.js.map