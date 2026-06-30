import { User } from './user'; // O el tipo que definas para la información del usuario
import { Express } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: User;  // Agregar la propiedad 'user' a la interfaz Request
            file?: Express.Multer.File;  // Agregar la propiedad 'file' para multer
            files?: Express.Multer.File[];  // Para multiple files
        }
    }
}
