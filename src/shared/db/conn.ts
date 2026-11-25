import { MikroORM } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import ormConfig from '../../../mikro-orm.config.js';
import dns from 'node:dns';

// Para resolver la URL mongodb+srv de Atlas en algunas redes locales hace falta usar DNS públicos
// (evita el error "querySrv ECONNREFUSED" cuando el DNS de la red rechaza consultas SRV).
// - DNS_SERVERS=8.8.8.8,1.1.1.1 en el .env elige los servidores; DNS_SERVERS=sistema usa los de la red.
// - Sin la variable: en desarrollo se usan Google y Cloudflare; en Vercel, los DNS propios de Vercel.
const dnsConfigurados = process.env.DNS_SERVERS?.trim();
const servidoresDns = dnsConfigurados
    ? (dnsConfigurados === 'sistema' ? [] : dnsConfigurados.split(',').map((s) => s.trim()).filter(Boolean))
    : (process.env.VERCEL ? [] : ['8.8.8.8', '1.1.1.1']);
if (servidoresDns.length) dns.setServers(servidoresDns);

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
