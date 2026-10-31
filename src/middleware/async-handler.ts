import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Express 4 no captura los errores de los handlers async: si una promesa se
 * rechaza, la request queda colgada o se cae el servidor. Este wrapper pasa
 * el error a next() para que lo maneje el middleware de errores.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
