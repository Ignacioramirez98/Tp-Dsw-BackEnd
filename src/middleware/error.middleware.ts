import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { AppError } from '../shared/errors.js';

/** Rutas inexistentes. */
export function notFoundHandler(_req: Request, res: Response) {
    res.status(404).json({ message: 'Recurso no encontrado' });
}

/**
 * Manejador global de errores: arma siempre una respuesta JSON con { message }
 * y nunca deja que un error tire abajo el servidor.
 */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (error instanceof AppError) {
        return res.status(error.status).json({ message: error.message, ...(error.details ? { errors: error.details } : {}) });
    }

    if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Validación fallida', errors: error.errors });
    }

    if (error instanceof UniqueConstraintViolationException) {
        return res.status(409).json({ message: 'Ya existe un registro con esos datos' });
    }

    if (error instanceof SyntaxError && 'body' in error) {
        return res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido' });
    }

    console.error(error);
    return res.status(500).json({ message: 'Error interno del servidor' });
}
