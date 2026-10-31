import { Request, Response, NextFunction } from "express";
import { ServicioRepository } from "../servicio/servicio.repository.js";
import { VentaRepository } from "../venta/venta.repository.js";
import { OperarioRepository } from "../operario/operario.repository.js";
import { toObjectId } from "../shared/utils/object-id.js";
import { toNumber } from "../shared/utils/to-number.js";
import { ObjectId } from "mongodb";  // Importar ObjectId para la validación

const repository = new ServicioRepository();
const ventaRepository = new VentaRepository();
const operarioRepository = new OperarioRepository();

function sanitizeServicioInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        descripcion: req.body.descripcion,
        importe_por_hora: toNumber(req.body.importe_por_hora),
        operarioId: req.body.operarioId,
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

/**
 * Convierte operarioId (string) en la referencia al Operario responsable.
 * Devuelve un mensaje de error si el id no es válido o el operario no existe.
 */
async function resolverOperario(input: Record<string, any>): Promise<string | null> {
    if (!('operarioId' in input)) return null;

    const { operarioId } = input;
    delete input.operarioId;

    if (operarioId === null || operarioId === '') {
        input.operario = null;
        return null;
    }

    const id = toObjectId(operarioId);
    if (!id) return 'operarioId inválido';
    if (!(await operarioRepository.findOne({ _id: id }))) return 'El operario indicado no existe';

    input.operario = id;
    return null;
}

async function findAll(req: Request, res: Response) {
    const filters: Record<string, any> = {};
    
    // Filtro por descripción
    if (req.query.descripcion) {
        filters.descripcion = { $regex: req.query.descripcion, $options: 'i' };
    }
    
    if (req.query.operarioId) {
        const operarioId = toObjectId(req.query.operarioId);
        if (!operarioId) return res.status(400).send({ message: 'operarioId inválido' });
        filters.operario = operarioId;
    }

    res.json({ data: await repository.findAll(filters) });
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
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const data: Record<string, any> = {
        descripcion: input.descripcion,
        importe_por_hora: input.importe_por_hora,
        imagenUrl,
        operarioId: input.operarioId,
    };
    if (data.operarioId === undefined) delete data.operarioId;

    const error = await resolverOperario(data);
    if (error) return res.status(400).send({ message: error });

    const servicio = await repository.add(data);
    return res.status(201).send({ message: 'servicio creado', data: servicio });
}

async function update(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const servicioId = validateAndConvertId(id);
    if (!servicioId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const updateData: any = req.body.sanitizedInput;
    
    // Si hay archivo, agregar la URL de la imagen
    if (req.file) {
        updateData.imagenUrl = `/uploads/${req.file.filename}`;
    }

    const error = await resolverOperario(updateData);
    if (error) return res.status(400).send({ message: error });

    // Actualizar el servicio con los datos sanitizados
    const servicio = await repository.update(servicioId, updateData);

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

    const servicioExistente = await repository.findOne({ _id: servicioId });
    if (!servicioExistente) {
        return res.status(404).send({ message: 'servicio no encontrado' });
    }

    if (await ventaRepository.hasServicio(servicioId)) {
        return res.status(409).send({ message: 'No se puede eliminar el servicio porque está asociado a una venta' });
    }

    const servicio = await repository.delete({ _id: servicioId });

    if (!servicio) {
        return res.status(404).send({ message: 'servicio no encontrado' });
    }

    return res.status(200).send({ message: 'servicio eliminado exitosamente' });
}

export { sanitizeServicioInput, findAll, findOne, add, update, remove };
