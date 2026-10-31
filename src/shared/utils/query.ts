import { Request } from 'express';

/** Lee un parámetro de query string como texto (ignora arrays u objetos). */
export function queryString(req: Request, name: string): string | undefined {
    const value = req.query[name];
    return typeof value === 'string' && value !== '' ? value : undefined;
}
