import { Request, Response } from 'express';
import { ServicioService } from './servicio.service.js';
import { queryString } from '../shared/utils/query.js';

const service = new ServicioService();

/** Agrega la URL de la imagen subida (si hay) a los datos recibidos. */
function conImagen(req: Request) {
    const input = { ...req.body.sanitizedInput };
    if (req.file) input.imagenUrl = `/uploads/${req.file.filename}`;
    return input;
}

export async function findAll(req: Request, res: Response) {
    const data = await service.findAll({
        descripcion: queryString(req, 'descripcion'),
        operarioId: queryString(req, 'operarioId'),
    });
    res.json({ data });
}

export async function findOne(req: Request, res: Response) {
    res.json({ data: await service.findOne(req.params.id) });
}

export async function add(req: Request, res: Response) {
    const data = await service.create(conImagen(req));
    res.status(201).json({ message: 'servicio creado', data });
}

export async function update(req: Request, res: Response) {
    const data = await service.update(req.params.id, conImagen(req));
    res.json({ message: 'servicio actualizado exitosamente', data });
}

export async function remove(req: Request, res: Response) {
    await service.remove(req.params.id);
    res.json({ message: 'servicio eliminado exitosamente' });
}
