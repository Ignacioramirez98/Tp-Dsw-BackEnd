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

/** Quién está haciendo el pedido (lo carga protectRoute a partir del JWT). */
const actorDe = (req: Request) => ({ id: String(req.user?.id ?? '') });

/** Editar usuario: nombre, contraseña, estado, rol y perfil vinculado (solo admin). */
export async function actualizarUsuario(req: Request, res: Response) {
    const data = await service.update(req.params.id, req.body, actorDe(req));
    res.json({ message: 'Usuario actualizado', data });
}

/** Desactivar usuario (solo admin). */
export async function desactivarUsuario(req: Request, res: Response) {
    const data = await service.desactivar(req.params.id, actorDe(req));
    res.json({ message: 'Usuario desactivado', data });
}

/** Volver a activar un usuario desactivado (solo admin). */
export async function activarUsuario(req: Request, res: Response) {
    const data = await service.activar(req.params.id, actorDe(req));
    res.json({ message: 'Usuario activado', data });
}

/** Eliminar usuario (solo admin). Los vinculados a un perfil solo se desactivan. */
export async function eliminarUsuario(req: Request, res: Response) {
    await service.remove(req.params.id, actorDe(req));
    res.json({ message: 'usuario eliminado exitosamente' });
}
