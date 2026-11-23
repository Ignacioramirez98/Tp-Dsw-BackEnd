import 'dotenv/config';
import { parseOrigins } from './cors.js';

function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable ${name}. Check your .env file (see .env.example).`);
    }
    return value;
}

export const config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: required('MONGO_URI'),
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    // Orígenes del front permitidos por CORS (FRONTEND_URL puede tener varias URLs separadas por coma)
    frontendOrigins: parseOrigins(process.env.FRONTEND_URL),
};
