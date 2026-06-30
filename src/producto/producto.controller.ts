import { Request, Response, NextFunction } from "express";
import { ProductoRepository } from "./producto.repository.js";
import { Producto } from "./producto.entity.js";
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
    const filters: Record<string, any> = {};
    
    // Filtro por nombre
    if (req.query.nombre) {
        filters.nombre = { $regex: req.query.nombre, $options: 'i' };
    }
    
    // Filtro por descripción
    if (req.query.descripcion) {
        filters.descripcion = { $regex: req.query.descripcion, $options: 'i' };
    }
    
    res.json({ data: await repository.findAll(Object.keys(filters).length > 0 ? filters : undefined) });
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
    const imagenUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const productoInput = new Producto({
        nombre: input.nombre,
        descripcion: input.descripcion,
        importe_compra: input.importe_compra,
        importe_venta: input.importe_venta,
        stock: input.stock,
        imagenUrl
    });

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

    const updateData: any = req.body.sanitizedInput;
    
    // Si hay archivo, agregar la URL de la imagen
    if (req.file) {
        updateData.imagenUrl = `/uploads/${req.file.filename}`;
    }

    // Actualizar el producto con los datos sanitizados
    const producto = await repository.update(productoId, updateData);

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
