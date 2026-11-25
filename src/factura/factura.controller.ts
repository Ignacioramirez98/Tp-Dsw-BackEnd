import { Request, Response } from 'express';
import { FacturaService } from './factura.service.js';
import { queryString } from '../shared/utils/query.js';

const service = new FacturaService();

export async function findAll(req: Request, res: Response) {
    const data = await service.findAll({
        clienteId: queryString(req, 'clienteId'),
        desde: queryString(req, 'desde'),
        hasta: queryString(req, 'hasta'),
    }, req.user);
    res.json({ data });
}

export async function findOne(req: Request, res: Response) {
    res.json({ data: await service.findOne(req.params.id, req.user) });
}

/** GET /ventas/:id/factura */
export async function findByVenta(req: Request, res: Response) {
    res.json({ data: await service.findByVenta(req.params.id, req.user) });
}

/** POST /ventas/:id/facturar */
export async function facturar(req: Request, res: Response) {
    const data = await service.facturar(req.params.id, req.user);
    res.status(201).json({ message: 'Venta facturada', data });
}
