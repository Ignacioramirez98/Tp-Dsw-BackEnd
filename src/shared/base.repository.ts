import { EntityName, FilterQuery, Populate } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { getEM } from './db/conn.js';
import { Repository } from './repository.js';

/**
 * Implementación común del patrón Repository sobre MikroORM.
 * Cada repositorio concreto indica su entidad y, opcionalmente,
 * qué relaciones se cargan (populate) al leer.
 */
export abstract class BaseRepository<T extends { _id: ObjectId }> implements Repository<T> {
    protected abstract readonly entity: EntityName<T>;
    protected readonly populate: string[] = [];

    protected get em() {
        return getEM();
    }

    public async findAll(filters?: FilterQuery<T>): Promise<T[]> {
        return this.em.find(this.entity, filters ?? ({} as FilterQuery<T>), {
            populate: this.populate as unknown as Populate<T, any>,
        });
    }

    public async findOne(item: { _id: ObjectId }): Promise<T | undefined> {
        const result = await this.em.findOne(this.entity, { _id: item._id } as FilterQuery<T>, {
            populate: this.populate as unknown as Populate<T, any>,
        });
        return result ?? undefined;
    }

    public async count(filters: FilterQuery<T>): Promise<number> {
        return this.em.count(this.entity, filters);
    }

    public async add(data: any): Promise<T> {
        const entity = this.em.create(this.entity, data);
        await this.em.flush();
        return entity;
    }

    public async update(id: ObjectId, data: any): Promise<T | undefined> {
        const entity = await this.em.findOne(this.entity, { _id: id } as FilterQuery<T>);
        if (!entity) return undefined;

        this.em.assign(entity, data);
        await this.em.flush();
        return entity;
    }

    public async delete(item: { _id: ObjectId }): Promise<T | undefined> {
        const entity = await this.em.findOne(this.entity, { _id: item._id } as FilterQuery<T>);
        if (!entity) return undefined;

        await this.em.remove(entity).flush();
        return entity;
    }
}
