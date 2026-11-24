import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioRepository, type CampoPerfil } from './usuario.repository.js';
import { Usuario, type Rol } from './usuario.entity.js';
import { loginSchema, crearUsuarioSchema, actualizarUsuarioSchema } from '../validators/usuario.validator.js';
import { config } from '../shared/config.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../shared/errors.js';
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

/** Quién hace el pedido: sirve para que un admin no pueda dejarse afuera a sí mismo. */
export interface ActorUsuario {
    id: string;
}

/** Perfil de negocio que corresponde a cada rol (el admin no tiene). */
const PERFIL_POR_ROL: Record<Rol, CampoPerfil | null> = {
    cliente: 'cliente',
    vendedor: 'vendedor',
    operario: 'operario',
    admin: null,
};

const PERFILES: CampoPerfil[] = ['cliente', 'vendedor', 'operario'];

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

    /**
     * Edita nombre de usuario, contraseña, estado, rol y perfil vinculado.
     * Cambiar el rol obliga a indicar el perfil que le corresponde (clienteId, vendedorId u operarioId).
     */
    async update(id: string, input: unknown, actor: ActorUsuario) {
        const datos = actualizarUsuarioSchema.parse(input);
        const usuarioId = parseId(id);
        const actual = await this.repository.findOne({ _id: usuarioId });
        if (!actual) throw new NotFoundError('Usuario no encontrado');

        if (datos.activo === false && actor.id === usuarioId.toHexString()) {
            throw new ForbiddenError('No podés desactivar tu propio usuario');
        }

        const cambios: Record<string, unknown> = {};

        if (datos.usuario !== undefined && datos.usuario !== actual.usuario) {
            if (await this.repository.findByUsuario(datos.usuario)) throw new ConflictError('El usuario ya existe');
            cambios.usuario = datos.usuario;
        }
        if (datos.contraseña !== undefined) cambios.contraseña = await bcrypt.hash(datos.contraseña, 10);
        if (datos.activo !== undefined) cambios.activo = datos.activo;

        Object.assign(cambios, await this.resolverRolYPerfil(actual, datos));

        const usuario = await this.repository.update(usuarioId, cambios);
        if (!usuario) throw new NotFoundError('Usuario no encontrado');
        const { createdAt, ...dto } = toUsuarioDTO(usuario);
        return dto;
    }

    async activar(id: string, actor: ActorUsuario) {
        return this.update(id, { activo: true }, actor);
    }

    async desactivar(id: string, actor: ActorUsuario) {
        const usuario = await this.update(id, { activo: false }, actor);
        return { usuarioId: usuario._id };
    }

    /**
     * Elimina un usuario. Si está vinculado a un cliente, vendedor u operario no se borra:
     * hay que desactivarlo, para no perder a quién pertenecía. Nadie puede eliminarse a sí mismo.
     */
    async remove(id: string, actor: ActorUsuario) {
        const usuarioId = parseId(id);
        const usuario = await this.repository.findOne({ _id: usuarioId });
        if (!usuario) throw new NotFoundError('Usuario no encontrado');

        if (actor.id === usuarioId.toHexString()) {
            throw new ForbiddenError('No podés eliminar tu propio usuario');
        }
        const perfil = PERFILES.find((campo) => usuario[campo]);
        if (perfil) {
            throw new ConflictError(`No se puede eliminar el usuario porque está vinculado a un ${perfil}: desactivalo en su lugar`);
        }
        await this.repository.delete({ _id: usuarioId });
    }

    /** Calcula los campos de rol y perfil a guardar (vacío si no cambia nada de eso). */
    private async resolverRolYPerfil(actual: Usuario, datos: ActualizarDatos): Promise<Record<string, unknown>> {
        const idsEnviados = PERFILES.filter((campo) => datos[`${campo}Id`] !== undefined);
        const cambiaRol = datos.rol !== undefined && datos.rol !== actual.rol;

        if (actual.rol === 'admin' && (cambiaRol || idsEnviados.length)) {
            throw new BadRequestError('Un administrador no cambia de rol ni se vincula a un perfil');
        }
        if (!cambiaRol && !idsEnviados.length) return {};

        const rolFinal = datos.rol ?? actual.rol;
        const perfilDelRol = PERFIL_POR_ROL[rolFinal];
        const incorrecto = idsEnviados.find((campo) => campo !== perfilDelRol);
        if (incorrecto) throw new BadRequestError(`${incorrecto}Id no corresponde a un usuario con rol ${rolFinal}`);

        const perfilId = perfilDelRol ? datos[`${perfilDelRol}Id`] : undefined;
        if (cambiaRol && perfilDelRol && !perfilId) {
            throw new BadRequestError(`Para pasar a ${rolFinal} indicá ${perfilDelRol}Id`);
        }

        const cambios: Record<string, unknown> = {};
        if (cambiaRol) {
            cambios.rol = rolFinal;
            // El rol nuevo se queda solo con su propio perfil
            for (const campo of PERFILES) cambios[campo] = null;
        }
        if (perfilDelRol && perfilId) {
            const id = parseId(perfilId, `${perfilDelRol}Id`);
            const dueño = await this.repository.findByPerfil(perfilDelRol, id);
            if (dueño && !dueño._id.equals(actual._id)) throw new ConflictError(`Ese ${perfilDelRol} ya tiene un usuario`);
            cambios[perfilDelRol] = id;
        }
        return cambios;
    }
}

type ActualizarDatos = ReturnType<typeof actualizarUsuarioSchema.parse>;
