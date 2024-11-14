import { User } from './user'; // O el tipo que definas para la información del usuario

declare global {
    namespace Express {
        interface Request {
            user?: User;  // Agregar la propiedad 'user' a la interfaz Request
        }
    }
}
