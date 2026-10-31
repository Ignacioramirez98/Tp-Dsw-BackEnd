import { Request, Response, NextFunction } from 'express';

type Transform = (value: unknown) => unknown;

/**
 * Deja en req.body.sanitizedInput solo los campos permitidos (descarta lo que no
 * esté en la lista y lo que venga undefined). Opcionalmente transforma valores,
 * por ejemplo números que llegan como texto en formularios multipart.
 */
export function sanitizeInput(fields: string[], transforms: Record<string, Transform> = {}) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const sanitized: Record<string, unknown> = {};

        for (const field of fields) {
            const raw = req.body?.[field];
            const value = transforms[field] ? transforms[field](raw) : raw;
            if (value !== undefined) sanitized[field] = value;
        }

        req.body = { ...req.body, sanitizedInput: sanitized };
        next();
    };
}
