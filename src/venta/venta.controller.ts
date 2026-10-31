import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { VentaRepository, ItemVentaInput } from "./venta.repository.js";
import { ClienteRepository } from "../cliente/cliente.repository.js";
import { VendedorRepository } from "../Vendedor/vendedor.repository.js";
import { ProductoRepository } from "../producto/producto.repository.js";
import { ServicioRepository } from "../servicio/servicio.repository.js";
import { toObjectId } from "../shared/utils/object-id.js";

const repository = new VentaRepository();
const clienteRepository = new ClienteRepository();
const vendedorRepository = new VendedorRepository();
const productoRepository = new ProductoRepository();
const servicioRepository = new ServicioRepository();

function sanitizeVentaInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        estado: req.body.estado,
        fechaContacto: req.body.fechaContacto,
        fechaDeVenta: req.body.fechaDeVenta,
        fechaEntrega: req.body.fechaEntrega,
        fechaCancelacion: req.body.fechaCancelacion,
        clienteId: req.body.clienteId,
        vendedorId: req.body.vendedorId,
        // items: [{ productoId, cantidad }]. Se acepta también productoIds (formato anterior, cantidad 1)
        items: req.body.items,
        productoIds: req.body.productoIds,
        servicioIds: req.body.servicioIds,
    };

    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key];
        }
    });
    next();
}

class ValidationError extends Error {}

/** Traduce los ids recibidos en referencias válidas. Lanza ValidationError si algo no existe. */
async function resolverRelaciones(input: Record<string, any>) {
    const data: Record<string, any> = {};
    let items: ItemVentaInput[] | undefined;

    for (const campo of ['estado', 'fechaContacto', 'fechaDeVenta', 'fechaEntrega', 'fechaCancelacion']) {
        if (campo in input) data[campo] = input[campo];
    }

    if ('clienteId' in input) {
        const id = toObjectId(input.clienteId);
        if (!id) throw new ValidationError('clienteId inválido');
        if (!(await clienteRepository.findOne({ _id: id }))) throw new ValidationError('El cliente indicado no existe');
        data.cliente = id;
    }

    if ('vendedorId' in input) {
        if (input.vendedorId === null || input.vendedorId === '') {
            data.vendedor = null;
        } else {
            const id = toObjectId(input.vendedorId);
            if (!id) throw new ValidationError('vendedorId inválido');
            if (!(await vendedorRepository.findOne({ _id: id }))) throw new ValidationError('El vendedor indicado no existe');
            data.vendedor = id;
        }
    }

    const itemsInput: { productoId: unknown; cantidad?: unknown }[] | undefined =
        input.items ?? (Array.isArray(input.productoIds)
            ? input.productoIds.map((productoId: unknown) => ({ productoId, cantidad: 1 }))
            : undefined);

    if (itemsInput !== undefined) {
        if (!Array.isArray(itemsInput)) throw new ValidationError('items debe ser una lista');
        items = [];
        for (const item of itemsInput) {
            const productoId = toObjectId(item?.productoId);
            const cantidad = Number(item?.cantidad);
            if (!productoId) throw new ValidationError('productoId inválido en items');
            if (!Number.isInteger(cantidad) || cantidad < 1) throw new ValidationError('La cantidad de cada ítem debe ser un entero mayor a 0');

            const producto = await productoRepository.findOne({ _id: productoId });
            if (!producto) throw new ValidationError(`El producto ${productoId.toHexString()} no existe`);

            items.push({ producto: productoId, cantidad, precioUnitario: producto.importe_venta });
        }
    }

    if ('servicioIds' in input) {
        if (!Array.isArray(input.servicioIds)) throw new ValidationError('servicioIds debe ser una lista');
        const ids: ObjectId[] = [];
        for (const raw of input.servicioIds) {
            const id = toObjectId(raw);
            if (!id) throw new ValidationError('servicioId inválido');
            if (!(await servicioRepository.findOne({ _id: id }))) throw new ValidationError(`El servicio ${id.toHexString()} no existe`);
            ids.push(id);
        }
        data.servicios = ids;
    }

    return { data, items };
}

async function findAll(req: Request, res: Response) {
    const filters: Record<string, any> = {};

    if (req.query.estado) {
        filters.estado = req.query.estado;
    }
    if (req.query.clienteId) {
        const clienteId = toObjectId(req.query.clienteId);
        if (!clienteId) return res.status(400).send({ message: 'clienteId inválido' });
        filters.cliente = clienteId;
    }
    if (req.query.vendedorId) {
        const vendedorId = toObjectId(req.query.vendedorId);
        if (!vendedorId) return res.status(400).send({ message: 'vendedorId inválido' });
        filters.vendedor = vendedorId;
    }

    res.json({ data: await repository.findAll(filters) });
}

async function findOne(req: Request, res: Response) {
    const ventaId = toObjectId(req.params.id);
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

    if (!input.clienteId) {
        return res.status(400).send({ message: 'clienteId es obligatorio' });
    }

    try {
        const { data, items } = await resolverRelaciones(input);
        data.estado ??= 'pendiente';
        data.fechaContacto ??= new Date();

        const creada = await repository.addConItems(data, items ?? []);
        const venta = await repository.findOne({ _id: creada._id });
        return res.status(201).send({ message: 'Venta creada', data: venta });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).send({ message: error.message });
        }
        return res.status(500).send({ message: 'Error al crear la venta' });
    }
}

async function update(req: Request, res: Response) {
    const ventaId = toObjectId(req.params.id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    try {
        const { data, items } = await resolverRelaciones(req.body.sanitizedInput);
        const actualizada = await repository.updateConItems(ventaId, data, items);
        if (!actualizada) {
            return res.status(404).send({ message: 'Venta no encontrada' });
        }

        const venta = await repository.findOne({ _id: ventaId });
        return res.status(200).send({ message: 'Venta actualizada exitosamente', data: venta });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).send({ message: error.message });
        }
        return res.status(500).send({ message: 'Error al actualizar la venta' });
    }
}

async function remove(req: Request, res: Response) {
    const ventaId = toObjectId(req.params.id);
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
