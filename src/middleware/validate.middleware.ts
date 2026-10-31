import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

/**
 * Valida el body con un schema de Zod. Si es válido, deja en req.body.sanitizedInput
 * solo los campos del schema (ya convertidos: números, fechas, textos sin espacios).
 * Si no, el ZodError llega al middleware de errores y se responde 400.
 */
export function validateBody(schema: ZodTypeAny) {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            const sanitizedInput = schema.parse(req.body ?? {});
            req.body = { ...req.body, sanitizedInput };
            next();
        } catch (error) {
            next(error);
        }
    };
}
