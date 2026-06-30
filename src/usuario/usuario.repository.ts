import { Usuario } from './usuario.entity.js';
import { getORM } from '../shared/db/conn.js';
import { ObjectId } from 'mongodb';
import type { Repository as IRepository } from '../shared/repository.js';

export class UsuarioRepository implements IRepository<Usuario> {
    getRepo() {
        return getORM().em.getRepository(Usuario);
    }

    async findAll(filters?: Record<string, any>): Promise<Usuario[] | undefined> {
        const query = filters || {};
        return await this.getRepo().find(query);
    }

    async findOne(filter: { _id: ObjectId }): Promise<Usuario | undefined>;
    async findOne(filter: { usuario: string }): Promise<Usuario | undefined>;
    async findOne(filter: { [key: string]: any }): Promise<Usuario | undefined> {
        const result = await this.getRepo().findOne(filter);
        return result ?? undefined;
    }

    async add(entity: Usuario): Promise<Usuario | undefined> {
        const em = getORM().em.fork();
        const usuario = em.create(Usuario, entity);
        await em.flush();
        return usuario;
    }

    async update(id: ObjectId, data: Partial<Usuario>): Promise<Usuario | undefined> {
        const em = getORM().em.fork();
        const usuario = await em.findOne(Usuario, id);
        if (!usuario) return undefined;

        Object.assign(usuario, data);
        await em.flush();
        return usuario;
    }

    async delete(item: { _id: ObjectId } | { id: string }): Promise<Usuario | undefined> {
        const em = getORM().em.fork();
        const id = '_id' in item ? item._id : new ObjectId(item.id as string);
        const usuario = await em.findOne(Usuario, id);
        if (!usuario) return undefined;

        await em.remove(usuario);
        await em.flush();
        return usuario;
    }
}
