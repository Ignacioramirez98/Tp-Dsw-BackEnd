import { initializeORM } from './shared/db/conn.js';
import { config } from './shared/config.js';
import { createApp } from './app.js';

async function startServer() {
  try {
    const orm = await initializeORM();
    console.log('Connected to MongoDB with MikroORM');

    createApp(orm).listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}/`);
      console.log('Environment:', config.nodeEnv);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

startServer();
