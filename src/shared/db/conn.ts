import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';

let orm: MikroORM<MongoDriver> | null = null;

export async function initializeORM(): Promise<MikroORM<MongoDriver>> {
    if (orm) return orm;

    const ormConfig = await import('../../../mikro-orm.config.js');
    orm = await MikroORM.init<MongoDriver>(ormConfig.default);
    return orm;
}

export function getORM(): MikroORM<MongoDriver> {
    if (!orm) throw new Error('ORM not initialized');
    return orm;
}

//entity manager
export const getEM = () => {
    const instance = getORM();
    return instance.em.fork();
};

