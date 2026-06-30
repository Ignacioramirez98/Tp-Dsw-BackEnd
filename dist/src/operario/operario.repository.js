import { Operario } from "../operario/operario.entity.js";
import { getORM } from '../shared/db/conn.js';
export class OperarioRepository {
    getRepo() {
        return getORM().em.getRepository(Operario);
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
        const operario = em.create(Operario, item);
        await em.flush();
        return operario;
    }
    async update(id, item) {
        const em = getORM().em.fork();
        const operario = await em.getRepository(Operario).findOne({ _id: id });
        if (!operario)
            return undefined;
        Object.assign(operario, item);
        await em.flush();
        return operario;
    }
    async delete(item) {
        const em = getORM().em.fork();
        const operario = await em.getRepository(Operario).findOne({ _id: item._id });
        if (!operario)
            return undefined;
        await em.remove(operario).flush();
        return operario;
    }
}
//# sourceMappingURL=operario.repository.js.map