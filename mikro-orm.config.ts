import 'dotenv/config';
import { defineConfig } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { entities } from './src/shared/db/entities.js';

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI environment variable is not set. Please check your .env file.');
}

export default defineConfig({
  driver: MongoDriver,
  clientUrl: process.env.MONGO_URI,
  dbName: 'crm',
  entities,
  debug: process.env.NODE_ENV === 'development',
});
