import { Request, Response, NextFunction } from 'express';
import { UsuarioRepository } from './usuario.repository.js';
import { Usuario } from './usuario.entity.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { loginSchema, crearUsuarioSchema } from '../validators/usuario.validator.js';
import { ZodError } from 'zod';

const repository = new UsuarioRepository();

/**
 * Login unificado para todos los roles (cliente, vendedor, operario)
 */
async function login(req: Request, res: Response) {
    try {
        const validated = loginSchema.parse(req.body);

        // Buscar usuario por nombre de usuario
        const usuario = await repository.findOne({ usuario: validated.usuario });

        if (!usuario) {
            return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
        }

        // Verificar que el usuario esté activo
        if (!usuario.activo) {
            return res.status(403).json({ message: 'Usuario desactivado' });
        }

        // Comparar contraseña
        const validPassword = await bcrypt.compare(validated.contraseña, usuario.contraseña);

        if (!validPassword) {
            return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
        }

        // Generar JWT
        const token = jwt.sign(
            {
                id: usuario._id,
                usuario: usuario.usuario,
                rol: usuario.rol,
                usuarioId: usuario._id
            },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        // Retornar token y datos del usuario
        return res.status(200).json({
            message: 'Login exitoso',
            token,
            data: {
                usuarioId: usuario._id,
                usuario: usuario.usuario,
                rol: usuario.rol,
                clienteId: usuario.clienteId || null,
                vendedorId: usuario.vendedorId || null,
                operarioId: usuario.operarioId || null
            }
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: 'Validación fallida',
                errors: error.errors
            });
        }
        return res.status(500).json({ message: 'Error en el servidor' });
    }
}

/**
 * Crear un nuevo usuario (solo para admin)
 */
async function crearUsuario(req: Request, res: Response) {
    try {
        const validated = crearUsuarioSchema.parse(req.body);

        // Verificar que el usuario no exista
        const usuarioExistente = await repository.findOne({ usuario: validated.usuario });

        if (usuarioExistente) {
            return res.status(409).json({ message: 'El usuario ya existe' });
        }

        // Hash de contraseña
        const contraseñaHash = await bcrypt.hash(validated.contraseña, 10);

        // Convertir IDs si existen
        const clienteId = validated.clienteId ? new ObjectId(validated.clienteId) : undefined;
        const vendedorId = validated.vendedorId ? new ObjectId(validated.vendedorId) : undefined;
        const operarioId = validated.operarioId ? new ObjectId(validated.operarioId) : undefined;

        const nuevoUsuario = new Usuario({
            usuario: validated.usuario,
            contraseña: contraseñaHash,
            rol: validated.rol,
            clienteId,
            vendedorId,
            operarioId,
            activo: true
        });

        const usuarioCreado = await repository.add(nuevoUsuario);

        if (!usuarioCreado) {
            return res.status(500).json({ message: 'Error al crear el usuario' });
        }

        return res.status(201).json({
            message: 'Usuario creado exitosamente',
            data: {
                usuarioId: usuarioCreado._id,
                usuario: usuarioCreado.usuario,
                rol: usuarioCreado.rol
            }
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: 'Validación fallida',
                errors: error.errors
            });
        }
        if (error instanceof Error && error.message.includes('duplicate')) {
            return res.status(409).json({ message: 'El usuario ya existe' });
        }
        return res.status(500).json({ message: 'Error en el servidor' });
    }
}

/**
 * Obtener todos los usuarios (solo admin)
 */
async function obtenerTodos(req: Request, res: Response) {
    try {
        const usuarios = await repository.findAll();

        if (!usuarios) {
            return res.status(200).json({ message: 'No hay usuarios', data: [] });
        }

        // No retornar contraseñas
        const usuariosSafe = usuarios.map(u => ({
            _id: u._id,
            usuario: u.usuario,
            rol: u.rol,
            activo: u.activo,
            clienteId: u.clienteId || null,
            vendedorId: u.vendedorId || null,
            operarioId: u.operarioId || null,
            createdAt: u.createdAt
        }));

        return res.status(200).json({ data: usuariosSafe });
    } catch (error) {
        return res.status(500).json({ message: 'Error en el servidor' });
    }
}

/**
 * Obtener un usuario por ID (solo admin)
 */
async function obtenerPorId(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const usuario = await repository.findOne({ _id: new ObjectId(id) });

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.status(200).json({
            data: {
                _id: usuario._id,
                usuario: usuario.usuario,
                rol: usuario.rol,
                activo: usuario.activo,
                clienteId: usuario.clienteId || null,
                vendedorId: usuario.vendedorId || null,
                operarioId: usuario.operarioId || null
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error en el servidor' });
    }
}

/**
 * Desactivar usuario (solo admin)
 */
async function desactivarUsuario(req: Request, res: Response) {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const usuarioActualizado = await repository.update(new ObjectId(id), { activo: false });

        if (!usuarioActualizado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        return res.status(200).json({
            message: 'Usuario desactivado',
            data: { usuarioId: usuarioActualizado._id }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error en el servidor' });
    }
}

export { login, crearUsuario, obtenerTodos, obtenerPorId, desactivarUsuario };
