import { Request, Response, NextFunction } from "express";
import { OperarioRepository } from "../operario/operario.repository.js";
import { Operario } from "../operario/operario.entity.js";
import multer from 'multer';
import { ObjectId } from "mongodb";  // Importar ObjectId para la validación

const repository = new OperarioRepository();

function sanitizeOperarioInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        mail: req.body.mail,
        dni: req.body.dni,
        telefono: req.body.telefono,
        rol: req.body.rol,
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
    const operarioId = validateAndConvertId(id);
    if (!operarioId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const operario = await repository.findOne({ _id: operarioId });
    if (!operario) {
        return res.status(404).send({ message: 'operario no encontrado' });
    }
    res.json({ data: operario });
}

async function add(req: Request, res: Response) {
    const input = req.body.sanitizedInput;

    const operarioInput = new Operario(
        input.nombre,        
        input.apellido,
        input.mail,
        input.dni,
        input.telefono,
        input.rol
    );

    const operario = await repository.add(operarioInput);
    return res.status(201).send({ message: 'operario creado', data: operario });
}

async function update(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const operarioId = validateAndConvertId(id);
    if (!operarioId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    // Actualizar el operario con los datos sanitizados
    const operario = await repository.update(operarioId, req.body.sanitizedInput);

    if (!operario) {
        return res.status(404).send({ message: 'operario no encontrado' });
    }

    return res.status(200).send({ message: 'operario actualizado exitosamente', data: operario });
}

async function remove(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const operarioId = validateAndConvertId(id);
    if (!operarioId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const operario = await repository.delete({ _id: operarioId });

    if (!operario) {
        return res.status(404).send({ message: 'operario no encontrado' });
    }

    return res.status(200).send({ message: 'operario eliminado exitosamente' });
}

export { sanitizeOperarioInput, findAll, findOne, add, update, remove };
