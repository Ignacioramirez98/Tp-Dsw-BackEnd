import { Request, Response, NextFunction } from "express";
import { ServicioRepository } from "../servicio/servicio.repository.js";
import { Servicio } from "../servicio/servicio.entity.js";
import multer from 'multer';
import { ObjectId } from "mongodb";  // Importar ObjectId para la validación

const repository = new ServicioRepository();

function sanitizeServicioInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        idServicio: req.body.idServicio,
        descripcion: req.body.descripcion,
        importe_por_hora: req.body.importe_por_hora,
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
    const servicioId = validateAndConvertId(id);
    if (!servicioId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const servicio = await repository.findOne({ _id: servicioId });
    if (!servicio) {
        return res.status(404).send({ message: 'servicio no encontrado' });
    }
    res.json({ data: servicio });
}

async function add(req: Request, res: Response) {
    const input = req.body.sanitizedInput;

    const servicioInput = new Servicio(
        input.idServicio,        
        input.descripcion,
        input.importe_por_hora
    );

    const servicio = await repository.add(servicioInput);
    return res.status(201).send({ message: 'servicio creado', data: servicio });
}

async function update(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const servicioId = validateAndConvertId(id);
    if (!servicioId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    // Actualizar el servicio con los datos sanitizados
    const servicio = await repository.update(servicioId, req.body.sanitizedInput);

    if (!servicio) {
        return res.status(404).send({ message: 'servicio no encontrado' });
    }

    return res.status(200).send({ message: 'servicio actualizado exitosamente', data: servicio });
}

async function remove(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const servicioId = validateAndConvertId(id);
    if (!servicioId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const servicio = await repository.delete({ _id: servicioId });

    if (!servicio) {
        return res.status(404).send({ message: 'servicio no encontrado' });
    }

    return res.status(200).send({ message: 'servicio eliminado exitosamente' });
}

export { sanitizeServicioInput, findAll, findOne, add, update, remove };
