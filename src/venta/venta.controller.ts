import { Request, Response, NextFunction } from "express";
import { VentaRepository } from "../venta/venta.repository.js";
import { Venta } from "../venta/venta.entity.js";
import multer from 'multer';
import { ObjectId } from "mongodb";  // Importar ObjectId para la validación

const repository = new VentaRepository();

function sanitizeVentaInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        estado: req.body.estado,
        fechaContacto: req.body.fechaContacto,
        fechaDeVenta: req.body.fechaDeVenta,
        fechaEntrega: req.body.fechaEntrega,
        fechaCancelacion: req.body.fechaCancelacion,
        cantidad: req.body.cantidad,
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
    if (ObjectId.isValid(id)) {
        return new ObjectId(id);  // Convertir a ObjectId
    }
    return null;  // Retornar null si el id no es válido
}

async function findAll(req: Request, res: Response) {
    res.json({ data: await repository.findAll() });
}

async function findOne(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const ventaId = validateAndConvertId(id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const venta = await repository.findOne({ _id: ventaId });
    if (!venta) {
        return res.status(404).send({ message: 'venta no encontrado' });
    }
    res.json({ data: venta });
}

async function add(req: Request, res: Response) {
    const input = req.body.sanitizedInput;

    const ventaInput = new Venta(
        input.estado,        
        input.fechaContacto,
        input.fechaDeVenta,
        input.fechaEntrega,
        input.fechaCancelacion,
        input.cantidad
    );

    const venta = await repository.add(ventaInput);
    return res.status(201).send({ message: 'venta creado', data: venta });
}

async function update(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const ventaId = validateAndConvertId(id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    // Actualizar el venta con los datos sanitizados
    const venta = await repository.update(ventaId, req.body.sanitizedInput);

    if (!venta) {
        return res.status(404).send({ message: 'venta no encontrado' });
    }

    return res.status(200).send({ message: 'venta actualizado exitosamente', data: venta });
}

async function remove(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const ventaId = validateAndConvertId(id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const venta = await repository.delete({ _id: ventaId });

    if (!venta) {
        return res.status(404).send({ message: 'venta no encontrado' });
    }

    return res.status(200).send({ message: 'venta eliminado exitosamente' });
}

export { sanitizeVentaInput, findAll, findOne, add, update, remove };
