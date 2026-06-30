import { Usuario } from './usuario.entity.js';
import { getORM } from '../shared/db/conn.js';
import { ObjectId } from 'mongodb';
export class UsuarioRepository {
    getRepo() {
        return getORM().em.getRepository(Usuario);
    }
    async findAll(filters) {
        const query = filters || {};
        return await this.getRepo().find(query);
    }
    async findOne(filter) {
        const result = await this.getRepo().findOne(filter);
        return result ?? undefined;
    }
    async add(entity) {
        const em = getORM().em.fork();
        const usuario = em.create(Usuario, entity);
        await em.flush();
        return usuario;
    }
    async update(id, data) {
        const em = getORM().em.fork();
        const usuario = await em.findOne(Usuario, id);
        if (!usuario)
            return undefined;
        Object.assign(usuario, data);
        await em.flush();
        return usuario;
    }
    async delete(item) {
        const em = getORM().em.fork();
        const id = '_id' in item ? item._id : new ObjectId(item.id);
        const usuario = await em.findOne(Usuario, id);
        if (!usuario)
            return undefined;
        await em.remove(usuario);
        await em.flush();
        return usuario;
    }
}
//# sourceMappingURL=usuario.repository.js.map