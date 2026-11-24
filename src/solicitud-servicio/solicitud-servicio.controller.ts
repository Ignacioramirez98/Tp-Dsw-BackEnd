import { Request, Response } from 'express';
import { SolicitudServicioService } from './solicitud-servicio.service.js';
import { queryString } from '../shared/utils/query.js';

const service = new SolicitudServicioService();

export async function findAll(req: Request, res: Response) {
    const data = await service.findAll({
        estado: queryString(req, 'estado'),
        desde: queryString(req, 'desde'),
        hasta: queryString(req, 'hasta'),
    }, req.user);
    res.json({ data });
}

export async function findOne(req: Request, res: Response) {
    res.json({ data: await service.findOne(req.params.id, req.user) });
}

export async function add(req: Request, res: Response) {
    const data = await service.create(req.body.sanitizedInput, req.user);
    res.status(201).json({ message: 'Solicitud creada', data });
}

export async function aceptar(req: Request, res: Response) {
    const data = await service.aceptar(req.params.id, req.body.sanitizedInput, req.user);
    res.json({ message: 'Solicitud aceptada', data });
}

export async function finalizar(req: Request, res: Response) {
    const data = await service.finalizar(req.params.id, req.body.sanitizedInput, req.user);
    res.json({ message: 'Solicitud finalizada', data });
}

export async function cancelar(req: Request, res: Response) {
    const data = await service.cancelar(req.params.id, req.body.sanitizedInput, req.user);
    res.json({ message: 'Solicitud cancelada', data });
}
