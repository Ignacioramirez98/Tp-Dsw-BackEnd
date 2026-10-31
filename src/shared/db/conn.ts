import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import ormConfig from '../../../mikro-orm.config.js';

let orm: MikroORM<MongoDriver> | null = null;

export async function initializeORM(): Promise<MikroORM<MongoDriver>> {
    if (orm) return orm;
    orm = await MikroORM.init<MongoDriver>(ormConfig);
    return orm;
}

export function getORM(): MikroORM<MongoDriver> {
    if (!orm) throw new Error('ORM not initialized');
    return orm;
}

/**
 * EntityManager de la request actual. app.ts crea un RequestContext por request,
 * así cada request trabaja con su propio identity map.
 */
export const getEM = () => getORM().em;
