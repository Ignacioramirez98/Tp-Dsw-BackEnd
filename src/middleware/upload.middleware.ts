import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { put } from '@vercel/blob';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '@mikro-orm/core';

/**
 * Dónde se guardan las imágenes subidas:
 * - En Vercel (con BLOB_READ_WRITE_TOKEN): en Vercel Blob, porque el disco de una función no se conserva.
 *   La URL guardada es la URL pública completa del archivo.
 * - En desarrollo: en public/uploads, servida por express.static como /uploads/<archivo>.
 */
const usarBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const uploadDir = 'public/uploads';

/** Nombre único y sin caracteres raros: 1764093600000-tractor-rojo.jpg */
function nombreArchivo(original: string): string {
    const ext = path.extname(original).toLowerCase();
    const base = path.basename(original, ext)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
        .toLowerCase() || 'imagen';
    return `${Date.now()}-${base}${ext}`;
}

// En disco (desarrollo): la carpeta se crea recién al guardar la primera imagen
const almacenamientoEnDisco = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        fs.mkdir(uploadDir, { recursive: true }, (error) => cb(error ?? null, uploadDir));
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        cb(null, nombreArchivo(file.originalname));
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

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB máx

// En Vercel el archivo queda en memoria y se sube a Blob; en desarrollo va directo al disco
const uploadEnDisco = multer({ storage: almacenamientoEnDisco, fileFilter, limits });
const uploadEnMemoria = multer({ storage: multer.memoryStorage(), fileFilter, limits });
const upload = uploadEnDisco;

/** Guarda la imagen recibida y devuelve la URL que se graba en el producto o servicio. */
async function guardarImagen(file: Express.Multer.File): Promise<string> {
    if (!usarBlob()) return `/uploads/${file.filename}`;
    const { url } = await put(`imagenes/${nombreArchivo(file.originalname)}`, file.buffer, {
        access: 'public',
        contentType: file.mimetype,
        addRandomSuffix: true,
    });
    return url;
}

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

    const receptor = usarBlob() ? uploadEnMemoria : uploadEnDisco;

    receptor.single('imagen')(req, res, async (error?: unknown) => {
        if (error) {
            const message = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
                ? 'La imagen supera el máximo permitido de 5MB'
                : error instanceof Error ? error.message : 'No se pudo procesar la imagen';
            return res.status(400).json({ message });
        }

        // Los controladores leen la URL de res.locals.imagenUrl (solo si se subió una imagen)
        if (req.file) {
            try {
                res.locals.imagenUrl = await guardarImagen(req.file);
            } catch (e) {
                console.error('[imagen] No se pudo guardar la imagen:', (e as Error).message);
                return res.status(502).json({ message: 'No se pudo guardar la imagen. Probá de nuevo en un momento.' });
            }
        }

        if (em) {
            return RequestContext.create(em, next);
        }
        next();
    });
}

export { upload, uploadImagen, nombreArchivo };
