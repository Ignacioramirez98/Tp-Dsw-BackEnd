import { Request, Response, NextFunction } from "express";
import { ClienteRepository } from "../cliente/cliente.repository.js";
import { Cliente } from "../cliente/cliente.entity.js";
import { ObjectId } from "mongodb";  // Importar ObjectId para la validación
import bcrypt from "bcryptjs";  // Importar bcryptjs para comparar contraseñas
import jwt from "jsonwebtoken";  // Importar jsonwebtoken para generar el token

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
    res.json({ data: await repository.findAll() });
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

    const hashedPassword = await bcrypt.hash(input.contraseña, 10);  // 10 es el número de "salts"

    const clienteInput = new Cliente(
        input.nombre,
        input.apellido,
        input.dni,
        input.mail,
        input.telefono,
        input.direccion,
        input.razon_social,
        input.usuario,
        hashedPassword
    );

    const cliente = await repository.add(clienteInput);
    return res.status(201).send({ message: 'cliente creado', data: cliente });
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

    // Buscar al cliente por el nombre de usuario
    const cliente = await repository.findOne({ usuario });
    if (!cliente) {
        return res.status(404).send({ message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña usando bcrypt
    const validPassword = await bcrypt.compare(contraseña, cliente.contraseña);
    if (!validPassword) {
        return res.status(401).send({ message: 'Contraseña incorrecta' });
    }

    // Generar el token JWT
    const token = jwt.sign(
        { id: cliente._id, usuario: cliente.usuario },
        process.env.JWT_SECRET || 'secret_key', 
        { expiresIn: '1h' }
    );

    // Enviar el token y el clienteId al cliente
    res.json({
        message: 'Login exitoso',
        token,
        clienteId: cliente._id  // Enviar el ID del cliente
    });
}


export { sanitizeClienteInput, findAll, findOne, add, update, remove, login };
