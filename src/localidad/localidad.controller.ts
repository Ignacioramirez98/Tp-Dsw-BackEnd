import { Request, Response } from 'express';
import { LocalidadService } from './localidad.service.js';

const service = new LocalidadService();

export async function findAll(_req: Request, res: Response) {
    res.json({ data: await service.findAll() });
}

export async function findOne(req: Request, res: Response) {
    res.json({ data: await service.findOne(req.params.id) });
}

export async function add(req: Request, res: Response) {
    const data = await service.create(req.body.sanitizedInput);
    res.status(201).json({ message: 'localidad creada', data });
}

export async function update(req: Request, res: Response) {
    const data = await service.update(req.params.id, req.body.sanitizedInput);
    res.json({ message: 'localidad actualizada exitosamente', data });
}

export async function remove(req: Request, res: Response) {
    await service.remove(req.params.id);
    res.json({ message: 'localidad eliminada exitosamente' });
}
