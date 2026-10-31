import { Request, Response, NextFunction } from "express";
import { ClienteRepository } from "./cliente.repository.js";
import { LocalidadRepository } from "../localidad/localidad.repository.js";
import { VentaRepository } from "../venta/venta.repository.js";
import { createClienteSchema } from "../validators/cliente.validator.js";
import { toObjectId } from "../shared/utils/object-id.js";

const repository = new ClienteRepository();
const localidadRepository = new LocalidadRepository();
const ventaRepository = new VentaRepository();

function sanitizeClienteInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        dni: req.body.dni,
        mail: req.body.mail,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
        razon_social: req.body.razon_social,
        localidadId: req.body.localidadId,
    };

    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key];
        }
    });
    next();
}

/**
 * Convierte localidadId (string) en la referencia a Localidad.
 * Devuelve un mensaje de error si el id no es válido o la localidad no existe.
 */
async function resolverLocalidad(input: Record<string, any>): Promise<string | null> {
    if (!('localidadId' in input)) return null;

    const { localidadId } = input;
    delete input.localidadId;

    if (localidadId === null || localidadId === '') {
        input.localidad = null; // quitar la localidad del cliente
        return null;
    }

    const id = toObjectId(localidadId);
    if (!id) return 'localidadId inválido';
    if (!(await localidadRepository.findOne({ _id: id }))) return 'La localidad indicada no existe';

    input.localidad = id;
    return null;
}

async function findAll(req: Request, res: Response) {
    const filters: Record<string, any> = {};

    if (req.query.nombre) {
        filters.nombre = { $regex: req.query.nombre, $options: 'i' };
    }
    if (req.query.apellido) {
        filters.apellido = { $regex: req.query.apellido, $options: 'i' };
    }
    if (req.query.dni) {
        filters.dni = req.query.dni;
    }
    if (req.query.localidadId) {
        const localidadId = toObjectId(req.query.localidadId);
        if (!localidadId) return res.status(400).send({ message: 'localidadId inválido' });
        filters.localidad = localidadId;
    }

    res.json({ data: await repository.findAll(filters) });
}

async function findOne(req: Request, res: Response) {
    const clienteId = toObjectId(req.params.id);
    if (!clienteId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const cliente = await repository.findOne({ _id: clienteId });
    if (!cliente) {
        return res.status(404).send({ message: 'cliente no encontrado' });
    }
    res.json({ data: cliente });
}

async function add(req: Request, res: Response) {
    try {
        const validated = createClienteSchema.parse(req.body.sanitizedInput);
        const data: Record<string, any> = { ...validated, razon_social: validated.razon_social || '' };

        const error = await resolverLocalidad(data);
        if (error) return res.status(400).send({ message: error });

        const cliente = await repository.add(data);
        return res.status(201).send({ message: 'cliente creado', data: cliente });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).send({ message: 'Validación fallida', errors: error.errors });
        }
        return res.status(500).send({ message: 'Error al crear cliente' });
    }
}

async function update(req: Request, res: Response) {
    const clienteId = toObjectId(req.params.id);
    if (!clienteId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const data = { ...req.body.sanitizedInput };
    const error = await resolverLocalidad(data);
    if (error) return res.status(400).send({ message: error });

    const cliente = await repository.update(clienteId, data);
    if (!cliente) {
        return res.status(404).send({ message: 'cliente no encontrado' });
    }

    return res.status(200).send({ message: 'cliente actualizado exitosamente', data: cliente });
}

async function remove(req: Request, res: Response) {
    const clienteId = toObjectId(req.params.id);
    if (!clienteId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    if (await ventaRepository.hasCliente(clienteId)) {
        return res.status(409).send({ message: 'No se puede eliminar el cliente porque tiene ventas asociadas' });
    }

    const cliente = await repository.delete({ _id: clienteId });
    if (!cliente) {
        return res.status(404).send({ message: 'cliente no encontrado' });
    }

    return res.status(200).send({ message: 'cliente eliminado exitosamente' });
}

export { sanitizeClienteInput, findAll, findOne, add, update, remove };
