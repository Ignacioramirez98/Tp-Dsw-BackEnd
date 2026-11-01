import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioRepository } from './usuario.repository.js';
import { Usuario } from './usuario.entity.js';
import { loginSchema, crearUsuarioSchema } from '../validators/usuario.validator.js';
import { config } from '../shared/config.js';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../shared/errors.js';
import { parseId } from '../shared/utils/object-id.js';

/** Datos públicos de un usuario (nunca incluye la contraseña). */
function toUsuarioDTO(usuario: Usuario) {
    return {
        _id: usuario._id,
        usuario: usuario.usuario,
        rol: usuario.rol,
        activo: usuario.activo,
        clienteId: usuario.cliente?._id ?? null,
        vendedorId: usuario.vendedor?._id ?? null,
        operarioId: usuario.operario?._id ?? null,
        createdAt: usuario.createdAt,
    };
}

export class UsuarioService {
    constructor(private readonly repository = new UsuarioRepository()) {}

    /** Login unificado para todos los roles. Devuelve el JWT y los datos del usuario. */
    async login(input: unknown) {
        const { usuario: nombreUsuario, contraseña } = loginSchema.parse(input);

        const usuario = await this.repository.findByUsuario(nombreUsuario);
        if (!usuario) throw new UnauthorizedError('Usuario o contraseña inválidos');
        if (!usuario.activo) throw new ForbiddenError('Usuario desactivado');

        const passwordValida = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!passwordValida) throw new UnauthorizedError('Usuario o contraseña inválidos');

        const { _id, usuario: nombre, rol, clienteId, vendedorId, operarioId } = toUsuarioDTO(usuario);

        // El token lleva el perfil vinculado para poder controlar "solo lo propio" en cada ruta
        const token = jwt.sign(
            { id: _id, usuario: nombre, rol, usuarioId: _id, clienteId, vendedorId, operarioId },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] },
        );

        return { token, data: { usuarioId: _id, usuario: nombre, rol, clienteId, vendedorId, operarioId } };
    }

    async create(input: unknown) {
        const validated = crearUsuarioSchema.parse(input);

        if (await this.repository.findByUsuario(validated.usuario)) {
            throw new ConflictError('El usuario ya existe');
        }

        const usuario = await this.repository.add({
            usuario: validated.usuario,
            contraseña: await bcrypt.hash(validated.contraseña, 10),
            rol: validated.rol,
            cliente: validated.clienteId ? parseId(validated.clienteId, 'clienteId') : null,
            vendedor: validated.vendedorId ? parseId(validated.vendedorId, 'vendedorId') : null,
            operario: validated.operarioId ? parseId(validated.operarioId, 'operarioId') : null,
            activo: true,
        });

        return { usuarioId: usuario._id, usuario: usuario.usuario, rol: usuario.rol };
    }

    async findAll() {
        const usuarios = await this.repository.findAll();
        return usuarios.map(toUsuarioDTO);
    }

    async findOne(id: string) {
        const usuario = await this.repository.findOne({ _id: parseId(id) });
        if (!usuario) throw new NotFoundError('Usuario no encontrado');
        const { createdAt, ...dto } = toUsuarioDTO(usuario);
        return dto;
    }

    async desactivar(id: string) {
        const usuario = await this.repository.update(parseId(id), { activo: false });
        if (!usuario) throw new NotFoundError('Usuario no encontrado');
        return { usuarioId: usuario._id };
    }
}
