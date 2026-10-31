import { Request, Response } from 'express';
import { ClienteService } from './cliente.service.js';
import { queryString } from '../shared/utils/query.js';

const service = new ClienteService();

export async function findAll(req: Request, res: Response) {
    const data = await service.findAll({
        nombre: queryString(req, 'nombre'),
        apellido: queryString(req, 'apellido'),
        dni: queryString(req, 'dni'),
        localidadId: queryString(req, 'localidadId'),
    });
    res.json({ data });
}

export async function findOne(req: Request, res: Response) {
    res.json({ data: await service.findOne(req.params.id) });
}

export async function add(req: Request, res: Response) {
    const data = await service.create(req.body.sanitizedInput);
    res.status(201).json({ message: 'cliente creado', data });
}

export async function update(req: Request, res: Response) {
    const data = await service.update(req.params.id, req.body.sanitizedInput);
    res.json({ message: 'cliente actualizado exitosamente', data });
}

export async function remove(req: Request, res: Response) {
    await service.remove(req.params.id);
    res.json({ message: 'cliente eliminado exitosamente' });
}
