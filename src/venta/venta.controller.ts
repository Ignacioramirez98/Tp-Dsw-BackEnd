import { Request, Response } from 'express';
import { VentaService } from './venta.service.js';
import { queryString } from '../shared/utils/query.js';

const service = new VentaService();

export async function findAll(req: Request, res: Response) {
    const data = await service.findAll({
        estado: queryString(req, 'estado'),
        clienteId: queryString(req, 'clienteId'),
        vendedorId: queryString(req, 'vendedorId'),
    });
    res.json({ data });
}

export async function findOne(req: Request, res: Response) {
    res.json({ data: await service.findOne(req.params.id) });
}

export async function add(req: Request, res: Response) {
    const data = await service.create(req.body.sanitizedInput);
    res.status(201).json({ message: 'Venta creada', data });
}

export async function update(req: Request, res: Response) {
    const data = await service.update(req.params.id, req.body.sanitizedInput);
    res.json({ message: 'Venta actualizada exitosamente', data });
}

export async function remove(req: Request, res: Response) {
    await service.remove(req.params.id);
    res.json({ message: 'Venta eliminada exitosamente' });
}
