import { Request, Response, NextFunction } from "express";
import { ClienteRepository } from "../cliente/cliente.repository.js";
import { Cliente } from "../cliente/cliente.entity.js";
import { ObjectId } from "mongodb";  // Importar ObjectId para la validación
import bcrypt from "bcryptjs";  // Importar bcryptjs para comparar contraseñas
import jwt from "jsonwebtoken";  // Importar jsonwebtoken para generar el token
import { createClienteSchema, loginSchema } from "../validators/cliente.validator.js";

const repository = new ClienteRepository();

function sanitizeClienteInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        dni: req.body.dni,
        mail: req.body.mail,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
        razon_social: req.body.razon_social,
        usuario: req.body.usuario,
        contraseña: req.body.contraseña,
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
    
    // Filtro por usuario
    if (req.query.usuario) {
        filters.usuario = { $regex: req.query.usuario, $options: 'i' };
    }
    
    // Filtro por apellido
    if (req.query.apellido) {
        filters.apellido = { $regex: req.query.apellido, $options: 'i' };
    }
    
    // Filtro por DNI
    if (req.query.dni) {
        filters.dni = req.query.dni;
    }
    
    res.json({ data: await repository.findAll(Object.keys(filters).length > 0 ? filters : undefined) });
}

async function findOne(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const clienteId = validateAndConvertId(id);
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
    const input = req.body.sanitizedInput;

    try {
        const validated = createClienteSchema.parse(input);
        const hashedPassword = await bcrypt.hash(validated.contraseña, 10);

        const clienteInput = new Cliente({
            nombre: validated.nombre,
            apellido: validated.apellido,
            dni: validated.dni,
            mail: validated.mail,
            telefono: validated.telefono,
            direccion: validated.direccion,
            razon_social: validated.razon_social || "",
            usuario: validated.usuario,
            contraseña: hashedPassword
        });

        const cliente = await repository.add(clienteInput);
        return res.status(201).send({ message: 'cliente creado', data: cliente });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).send({ message: 'Validación fallida', errors: error.errors });
        }
        return res.status(500).send({ message: 'Error al crear cliente' });
    }
}

async function update(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const clienteId = validateAndConvertId(id);
    if (!clienteId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    // Actualizar el cliente con los datos sanitizados
    const cliente = await repository.update(clienteId, req.body.sanitizedInput);

    if (!cliente) {
        return res.status(404).send({ message: 'cliente no encontrado' });
    }

    return res.status(200).send({ message: 'cliente actualizado exitosamente', data: cliente });
}

async function remove(req: Request, res: Response) {
    const { id } = req.params;

    // Validar y convertir el id
    const clienteId = validateAndConvertId(id);
    if (!clienteId) {
        return res.status(400).send({ message: 'ID inválido' });
    }

    const cliente = await repository.delete({ _id: clienteId });

    if (!cliente) {
        return res.status(404).send({ message: 'cliente no encontrado' });
    }

    return res.status(200).send({ message: 'cliente eliminado exitosamente' });
}

// Lógica para el login del cliente
async function login(req: Request, res: Response) {
    const { usuario, contraseña } = req.body;

    try {
        const validated = loginSchema.parse({ usuario, contraseña });

        // Buscar al cliente por el nombre de usuario
        const cliente = await repository.findOne({ usuario: validated.usuario });
        if (!cliente) {
            return res.status(404).send({ message: 'Usuario no encontrado' });
        }

        // Verificar la contraseña usando bcrypt
        const validPassword = await bcrypt.compare(validated.contraseña, cliente.contraseña);
        if (!validPassword) {
            return res.status(401).send({ message: 'Contraseña incorrecta' });
        }

        // Generar el token JWT con rol
        const token = jwt.sign(
            { id: cliente._id, usuario: cliente.usuario, rol: 'cliente' },
            process.env.JWT_SECRET || 'secret_key', 
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        // Enviar el token y el clienteId al cliente
        res.json({
            message: 'Login exitoso',
            token,
            clienteId: cliente._id,
            rol: 'cliente'
        });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).send({ message: 'Validación fallida', errors: error.errors });
        }
        return res.status(500).send({ message: 'Error al iniciar sesión' });
    }
}


export { sanitizeClienteInput, findAll, findOne, add, update, remove, login };
