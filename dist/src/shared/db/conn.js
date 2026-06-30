import { MikroORM } from '@mikro-orm/core';
let orm = null;
export async function initializeORM() {
    if (orm)
        return orm;
    const ormConfig = await import('../../../mikro-orm.config.js');
    orm = await MikroORM.init(ormConfig.default);
    return orm;
}
export function getORM() {
    if (!orm)
        throw new Error('ORM not initialized');
    return orm;
}
export const getEM = () => {
    const instance = getORM();
    return instance.em.fork();
};
//# sourceMappingURL=conn.js.map