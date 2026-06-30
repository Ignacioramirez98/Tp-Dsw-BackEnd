import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';

export default defineConfig({
  driver: MongoDriver,
  clientUrl: process.env.MONGO_URI || 'mongodb+srv://nacho98nacho98:dsw123@cluster0.z5xdoug.mongodb.net/crm',
  dbName: 'crm',
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  debug: process.env.NODE_ENV === 'development',
  allowGlobalContext: true,
});
