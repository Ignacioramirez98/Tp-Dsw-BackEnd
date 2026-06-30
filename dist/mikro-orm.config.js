import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set. Please check your .env file.');
}
export default defineConfig({
    driver: MongoDriver,
    clientUrl: process.env.MONGO_URI,
    dbName: 'crm',
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    debug: process.env.NODE_ENV === 'development',
    allowGlobalContext: true,
});
//# sourceMappingURL=mikro-orm.config.js.map