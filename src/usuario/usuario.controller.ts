import { Request, Response } from 'express';
import { UsuarioService } from './usuario.service.js';

const service = new UsuarioService();

/** Login unificado para todos los roles (cliente, vendedor, operario, admin). */
export async function login(req: Request, res: Response) {
    const { token, data } = await service.login(req.body);
    res.json({ message: 'Login exitoso', token, data });
}

/** Crear un nuevo usuario (solo admin). */
export async function crearUsuario(req: Request, res: Response) {
    const data = await service.create(req.body);
    res.status(201).json({ message: 'Usuario creado exitosamente', data });
}

/** Obtener todos los usuarios (solo admin). */
export async function obtenerTodos(_req: Request, res: Response) {
    res.json({ data: await service.findAll() });
}

/** Obtener un usuario por ID (solo admin). */
export async function obtenerPorId(req: Request, res: Response) {
    res.json({ data: await service.findOne(req.params.id) });
}

/** Desactivar usuario (solo admin). */
export async function desactivarUsuario(req: Request, res: Response) {
    const data = await service.desactivar(req.params.id);
    res.json({ message: 'Usuario desactivado', data });
}
