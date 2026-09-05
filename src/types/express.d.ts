import { User } from './user'; 
import { Express } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: User;  
            file?: Express.Multer.File;  
            files?: Express.Multer.File[];
        }
    }
}
