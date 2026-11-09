import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import ormConfig from '../../../mikro-orm.config.js';
import dns from 'node:dns';

// Usa DNS públicos (Google y Cloudflare) para resolver la URL mongodb+srv de Atlas.
// Evita el error "querySrv ECONNREFUSED" cuando el DNS de la red local rechaza consultas SRV.
dns.setServers(['8.8.8.8', '1.1.1.1']);

let orm: MikroORM<MongoDriver> | null = null;

export async function initializeORM(): Promise<MikroORM<MongoDriver>> {
    if (orm) return orm;
    orm = await MikroORM.init<MongoDriver>(ormConfig);
    return orm;
}

/** Cierra la conexión (la usan los tests al terminar). */
export async function closeORM(): Promise<void> {
    if (!orm) return;
    await orm.close(true);
    orm = null;
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
