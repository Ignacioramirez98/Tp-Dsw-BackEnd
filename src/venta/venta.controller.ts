import { Request, Response, NextFunction } from "express";
import { VentaRepository } from "../venta/venta.repository.js";
import { Venta } from "../venta/venta.entity.js";
import { ObjectId } from "mongodb";

const repository = new VentaRepository();

// Función para sanitizar la entrada de datos de venta
function sanitizeVentaInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        estado: req.body.estado,
        fechaContacto: req.body.fechaContacto,
        fechaDeVenta: req.body.fechaDeVenta,
        fechaEntrega: req.body.fechaEntrega,
        fechaCancelacion: req.body.fechaCancelacion,
        clienteId: req.body.clienteId,
        productoIds: req.body.productoIds,
        servicioIds: req.body.servicioIds
    };

    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key];
        }
    });
    next();
}

// Función para validar y convertir el id en ObjectId
function validateAndConvertId(id: string): ObjectId | null {
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

async function findAll(req: Request, res: Response) {
    const filters: Record<string, any> = {};
    
    // Filtro por estado
    if (req.query.estado) {
        filters.estado = req.query.estado;
    }
    
    // Filtro por clienteId
    if (req.query.clienteId) {
        const clienteId = validateAndConvertId(req.query.clienteId as string);
        if (clienteId) {
            filters.clienteId = clienteId;
        }
    }
    
    res.json({ data: await repository.findAll(Object.keys(filters).length > 0 ? filters : undefined) });
}

async function findOne(req: Request, res: Response) {
    const { id } = req.params;

    const ventaId = validateAndConvertId(id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const venta = await repository.findOne({ _id: ventaId });
    if (!venta) {
        return res.status(404).send({ message: 'Venta no encontrada' });
    }
    res.json({ data: venta });
}

async function add(req: Request, res: Response) {
    const input = req.body.sanitizedInput;

    if (!ObjectId.isValid(input.clienteId)) {
        return res.status(400).send({ message: 'clienteId inválido' });
    }

    const ventaInput = new Venta({
        estado: input.estado,
        fechaContacto: input.fechaContacto,
        fechaDeVenta: input.fechaDeVenta,
        fechaEntrega: input.fechaEntrega,
        fechaCancelacion: input.fechaCancelacion ?? null,
        clienteId: new ObjectId(input.clienteId),
        productoIds: (input.productoIds || []).filter(ObjectId.isValid).map((id: string) => new ObjectId(id)),
        servicioIds: (input.servicioIds || []).filter(ObjectId.isValid).map((id: string) => new ObjectId(id)),
    });

    const venta = await repository.add(ventaInput);
    return res.status(201).send({ message: 'Venta creada', data: venta });
}

async function update(req: Request, res: Response) {
    const { id } = req.params;

    const ventaId = validateAndConvertId(id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const input = req.body.sanitizedInput;

    const ventaInput: Partial<Venta> = {
        estado: input.estado,
        fechaContacto: input.fechaContacto,
        fechaDeVenta: input.fechaDeVenta,
        fechaEntrega: input.fechaEntrega,
        fechaCancelacion: input.fechaCancelacion,
    };

    if (input.clienteId) {
        if (!ObjectId.isValid(input.clienteId)) {
            return res.status(400).send({ message: 'clienteId inválido' });
        }
        ventaInput.clienteId = new ObjectId(input.clienteId);
    }
    if (input.productoIds) {
        ventaInput.productoIds = (input.productoIds as string[]).filter(ObjectId.isValid).map(id => new ObjectId(id));
    }
    if (input.servicioIds) {
        ventaInput.servicioIds = (input.servicioIds as string[]).filter(ObjectId.isValid).map(id => new ObjectId(id));
    }

    const venta = await repository.update(ventaId, ventaInput as Venta);

    if (!venta) {
        return res.status(404).send({ message: 'Venta no encontrada' });
    }

    return res.status(200).send({ message: 'Venta actualizada exitosamente', data: venta });
}

async function remove(req: Request, res: Response) {
    const { id } = req.params;

    const ventaId = validateAndConvertId(id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const venta = await repository.delete({ _id: ventaId });

    if (!venta) {
        return res.status(404).send({ message: 'Venta no encontrada' });
    }

    return res.status(200).send({ message: 'Venta eliminada exitosamente' });
}

export { sanitizeVentaInput, findAll, findOne, add, update, remove };
