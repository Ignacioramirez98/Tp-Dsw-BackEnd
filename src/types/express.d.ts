import type { AuthUser } from '../middleware/roleAuth.middleware.js';

declare global {
    namespace Express {
        interface Request {
            /** Usuario autenticado (lo carga protectRoute a partir del JWT). */
            user?: AuthUser;
        }
    }
}

export {};
