import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@mikro-orm/core';

// Crear carpeta de uploads si no existe
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, uploadDir);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${timestamp}-${name}${ext}`);
    }
});

// Filtro de archivos - solo imágenes
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF)'));
    }
};

// Crear instancia de multer
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB máx
});

/**
 * Middleware para recibir una imagen opcional en el campo "imagen".
 *
 * Multer procesa el archivo con eventos de stream y en ese proceso se pierde el
 * RequestContext de MikroORM; por eso se guarda el EntityManager de la request
 * antes y se vuelve a crear el contexto después. Además, si el archivo no es
 * válido, responde 400 con un mensaje claro en lugar de un error 500.
 */
function uploadImagen(req: Request, res: Response, next: NextFunction) {
    const em = RequestContext.getEntityManager();

    upload.single('imagen')(req, res, (error?: unknown) => {
        if (error) {
            const message = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
                ? 'La imagen supera el máximo permitido de 5MB'
                : error instanceof Error ? error.message : 'No se pudo procesar la imagen';
            return res.status(400).json({ message });
        }

        if (em) {
            return RequestContext.create(em, next);
        }
        next();
    });
}

export { upload, uploadImagen };
