import { Request, Response, NextFunction } from "express";
import { ProductoRepository } from "../Producto/producto.repository.js";
import { Producto } from "../Producto/producto.entity.js";
import { ObjectId } from "mongodb";  // Importar ObjectId para la validación

const repository = new ProductoRepository();

function sanitizeProductoInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        importe_compra: req.body.importe_compra,
        importe_venta: req.body.importe_venta,
        stock: req.body.stock,
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
    const productoId = validateAndConvertId(id);
    if (!productoId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const producto = await repository.findOne({ _id: productoId });
    if (!producto) {
        return res.status(404).send({ message: 'Producto no encontrado' });
    }
    res.json({ data: producto });
}

async function add(req: Request, res: Response) {
    const input = req.body.sanitizedInput;

    const productoInput = new Producto(
        input.nombre,
        input.descripcion,
        input.importe_compra,
        input.importe_venta,
        input.stock,
    );

    const producto = await repository.add(productoInput);
    return res.status(201).send({ message: 'Producto creado', data: producto });
}

async function update(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const productoId = validateAndConvertId(id);
    if (!productoId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    // Actualizar el producto con los datos sanitizados
    const producto = await repository.update(productoId, req.body.sanitizedInput);

    if (!producto) {
        return res.status(404).send({ message: 'Producto no encontrado' });
    }

    return res.status(200).send({ message: 'Producto actualizado exitosamente', data: producto });
}

async function remove(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const productoId = validateAndConvertId(id);
    if (!productoId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const producto = await repository.delete({ _id: productoId });

    if (!producto) {
        return res.status(404).send({ message: 'Producto no encontrado' });
    }

    return res.status(200).send({ message: 'Producto eliminado exitosamente' });
}

export { sanitizeProductoInput, findAll, findOne, add, update, remove };
