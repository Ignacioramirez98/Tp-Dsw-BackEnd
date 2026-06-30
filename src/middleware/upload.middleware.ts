import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear carpeta de uploads si no existe
const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${timestamp}-${name}${ext}`);
    }
});

// Filtro de archivos - solo imágenes
const fileFilter = (req: any, file: any, cb: any) => {
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

export { upload };
