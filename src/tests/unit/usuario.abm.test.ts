import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { UsuarioService } from '../../usuario/usuario.service.js';
import { ClienteService } from '../../cliente/cliente.service.js';
import { OperarioService } from '../../operario/operario.service.js';
import { VendedorService } from '../../Vendedor/vendedor.service.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';

/**
 * Tests unitarios del ABM de usuarios (editar, activar, desactivar, eliminar) y de la
 * baja automática del usuario cuando se elimina su cliente, vendedor u operario.
 * Los repositorios se reemplazan por versiones en memoria (sin base de datos).
 */

const PERFILES = ['cliente', 'vendedor', 'operario'] as const;

function usuarioBase(extra: Record<string, unknown> = {}): any {
    return { _id: new ObjectId(), usuario: 'juan', rol: 'cliente', activo: true, contraseña: 'hash', cliente: null, vendedor: null, operario: null, createdAt: new Date(), ...extra };
}

function armar(usuarios: any[]) {
    const repository: any = {
        findOne: async ({ _id }: { _id: ObjectId }) => usuarios.find((u) => u._id.equals(_id)),
        findByUsuario: async (nombre: string) => usuarios.find((u) => u.usuario === nombre),
        findByPerfil: async (campo: string, id: ObjectId) => usuarios.find((u) => u[campo]?._id.equals(id)),
        update: async (id: ObjectId, data: Record<string, unknown>) => {
            const u = usuarios.find((x) => x._id.equals(id));
            if (!u) return undefined;
            // Como MikroORM: un ObjectId asignado a una relación pasa a ser su referencia
            for (const [campo, valor] of Object.entries(data)) {
                u[campo] = (PERFILES as readonly string[]).includes(campo) && valor ? { _id: valor } : valor;
            }
            return u;
        },
        delete: async ({ _id }: { _id: ObjectId }) => {
            const i = usuarios.findIndex((u) => u._id.equals(_id));
            return i < 0 ? undefined : usuarios.splice(i, 1)[0];
        },
    };
    return new UsuarioService(repository);
}

describe('UsuarioService - editar', () => {
    const admin = usuarioBase({ usuario: 'admin', rol: 'admin' });
    const elAdmin = { id: admin._id.toHexString() };
    let juan: any;
    let usuarios: any[];
    let service: UsuarioService;

    beforeEach(() => {
        juan = usuarioBase({ cliente: { _id: new ObjectId() } });
        usuarios = [admin, juan, usuarioBase({ usuario: 'ana', rol: 'vendedor', vendedor: { _id: new ObjectId() } })];
        service = armar(usuarios);
    });

    it('cambia la contraseña y la guarda hasheada, sin devolverla', async () => {
        const res: any = await service.update(juan._id.toHexString(), { contraseña: 'nueva1234' }, elAdmin);

        expect(await bcrypt.compare('nueva1234', juan.contraseña)).toBe(true);
        expect(res).not.toHaveProperty('contraseña');
        expect(res).toMatchObject({ usuario: 'juan', rol: 'cliente', activo: true });
    });

    it('renombra el usuario, pero no a un nombre que ya existe', async () => {
        await service.update(juan._id.toHexString(), { usuario: 'juan2' }, elAdmin);
        expect(juan.usuario).toBe('juan2');

        await expect(service.update(juan._id.toHexString(), { usuario: 'ana' }, elAdmin)).rejects.toThrow(ConflictError);
        // Guardar con su mismo nombre no es un conflicto
        await expect(service.update(juan._id.toHexString(), { usuario: 'juan2' }, elAdmin)).resolves.toBeDefined();
    });

    it('desactiva y vuelve a activar a otro usuario', async () => {
        await service.desactivar(juan._id.toHexString(), elAdmin);
        expect(juan.activo).toBe(false);

        const activado: any = await service.activar(juan._id.toHexString(), elAdmin);
        expect(juan.activo).toBe(true);
        expect(activado.activo).toBe(true);
    });

    it('un admin no puede desactivarse a sí mismo', async () => {
        await expect(service.desactivar(admin._id.toHexString(), elAdmin)).rejects.toThrow(ForbiddenError);
        await expect(service.update(admin._id.toHexString(), { activo: false }, elAdmin)).rejects.toThrow(ForbiddenError);
        expect(admin.activo).toBe(true);
    });

    it('un admin sí puede cambiarse su propia contraseña', async () => {
        await service.update(admin._id.toHexString(), { contraseña: 'otraclave1' }, elAdmin);
        expect(await bcrypt.compare('otraclave1', admin.contraseña)).toBe(true);
    });

    it('responde 404 si el usuario no existe', async () => {
        await expect(service.update(new ObjectId().toHexString(), { activo: true }, elAdmin)).rejects.toThrow(NotFoundError);
        await expect(service.desactivar(new ObjectId().toHexString(), elAdmin)).rejects.toThrow(NotFoundError);
    });

    it('valida los datos: vacío, contraseña corta y rol admin', async () => {
        const id = juan._id.toHexString();
        await expect(service.update(id, {}, elAdmin)).rejects.toThrow(ZodError);
        await expect(service.update(id, { contraseña: '123' }, elAdmin)).rejects.toThrow(ZodError);
        await expect(service.update(id, { rol: 'admin', clienteId: 'a'.repeat(24) }, elAdmin)).rejects.toThrow(ZodError);
        await expect(service.update(id, { activo: 'no' }, elAdmin)).rejects.toThrow(ZodError);
    });

    describe('rol y perfil vinculado', () => {
        it('al cambiar el rol exige el perfil que le corresponde', async () => {
            await expect(service.update(juan._id.toHexString(), { rol: 'vendedor' }, elAdmin)).rejects.toThrow(BadRequestError);
            expect(juan.rol).toBe('cliente');
        });

        it('cambia el rol y deja solo el perfil nuevo', async () => {
            const vendedorId = new ObjectId();
            const res: any = await service.update(juan._id.toHexString(), { rol: 'vendedor', vendedorId: vendedorId.toHexString() }, elAdmin);

            expect(juan.rol).toBe('vendedor');
            expect(juan.cliente).toBeNull();
            expect(res.vendedorId).toEqual(vendedorId);
            expect(res.clienteId).toBeNull();
        });

        it('rechaza un perfil que no corresponde al rol', async () => {
            const id = juan._id.toHexString();
            await expect(service.update(id, { vendedorId: new ObjectId().toHexString() }, elAdmin)).rejects.toThrow(BadRequestError);
            await expect(service.update(id, { rol: 'operario', clienteId: new ObjectId().toHexString() }, elAdmin)).rejects.toThrow(BadRequestError);
        });

        it('rechaza un perfil que ya tiene otro usuario', async () => {
            const ana = usuarios[2];
            await expect(service.update(juan._id.toHexString(), { rol: 'vendedor', vendedorId: ana.vendedor._id.toHexString() }, elAdmin))
                .rejects.toThrow(ConflictError);
        });

        it('permite volver a vincular el mismo perfil sin conflicto', async () => {
            await expect(service.update(juan._id.toHexString(), { clienteId: juan.cliente._id.toHexString() }, elAdmin)).resolves.toBeDefined();
        });

        it('un admin no cambia de rol ni se vincula', async () => {
            const id = admin._id.toHexString();
            await expect(service.update(id, { rol: 'cliente', clienteId: new ObjectId().toHexString() }, elAdmin)).rejects.toThrow(BadRequestError);
            await expect(service.update(id, { vendedorId: new ObjectId().toHexString() }, elAdmin)).rejects.toThrow(BadRequestError);
            expect(admin.rol).toBe('admin');
        });
    });
});

describe('UsuarioService - eliminar', () => {
    const admin = usuarioBase({ usuario: 'admin', rol: 'admin' });
    const elAdmin = { id: admin._id.toHexString() };

    it('elimina un usuario sin perfil vinculado', async () => {
        const suelto = usuarioBase({ usuario: 'suelto' });
        const usuarios = [admin, suelto];
        await armar(usuarios).remove(suelto._id.toHexString(), elAdmin);
        expect(usuarios).toEqual([admin]);
    });

    it('no elimina uno vinculado a un perfil: hay que desactivarlo (409)', async () => {
        for (const campo of PERFILES) {
            const vinculado = usuarioBase({ usuario: `u_${campo}`, rol: campo, [campo]: { _id: new ObjectId() } });
            const usuarios = [admin, vinculado];
            await expect(armar(usuarios).remove(vinculado._id.toHexString(), elAdmin)).rejects.toThrow(ConflictError);
            expect(usuarios).toHaveLength(2);
        }
    });

    it('nadie puede eliminarse a sí mismo', async () => {
        const usuarios = [admin];
        await expect(armar(usuarios).remove(admin._id.toHexString(), elAdmin)).rejects.toThrow(ForbiddenError);
        expect(usuarios).toHaveLength(1);
    });

    it('responde 404 si no existe y 400 si el id es inválido', async () => {
        const service = armar([admin]);
        await expect(service.remove(new ObjectId().toHexString(), elAdmin)).rejects.toThrow(NotFoundError);
        await expect(service.remove('no-es-un-id', elAdmin)).rejects.toThrow(BadRequestError);
    });
});

describe('al eliminar un perfil se desactiva su usuario', () => {
    const id = new ObjectId().toHexString();
    const cualquiera = { count: async () => 0 };

    function usuarioRepo() {
        return { desactivarYDesvincular: vi.fn(async () => undefined) };
    }

    it('cliente', async () => {
        const usuarios = usuarioRepo();
        const service = new ClienteService(
            { delete: async () => ({}) } as any, {} as any,
            { hasCliente: async () => false } as any, { hasCliente: async () => false } as any, usuarios as any,
        );
        await service.remove(id);
        expect(usuarios.desactivarYDesvincular).toHaveBeenCalledWith('cliente', new ObjectId(id));
    });

    it('operario', async () => {
        const usuarios = usuarioRepo();
        const service = new OperarioService(
            { delete: async () => ({}) } as any, cualquiera as any, { hasOperario: async () => false } as any, usuarios as any,
        );
        await service.remove(id);
        expect(usuarios.desactivarYDesvincular).toHaveBeenCalledWith('operario', new ObjectId(id));
    });

    it('vendedor', async () => {
        const usuarios = usuarioRepo();
        const service = new VendedorService(
            { delete: async () => ({}) } as any, { hasVendedor: async () => false } as any, usuarios as any,
        );
        await service.remove(id);
        expect(usuarios.desactivarYDesvincular).toHaveBeenCalledWith('vendedor', new ObjectId(id));
    });

    it('si no se puede eliminar el perfil (409 o 404), su usuario sigue activo', async () => {
        const usuarios = usuarioRepo();
        const conVentas = new ClienteService(
            { delete: async () => ({}) } as any, {} as any,
            { hasCliente: async () => true } as any, { hasCliente: async () => false } as any, usuarios as any,
        );
        await expect(conVentas.remove(id)).rejects.toThrow(ConflictError);

        const inexistente = new OperarioService(
            { delete: async () => undefined } as any, cualquiera as any, { hasOperario: async () => false } as any, usuarios as any,
        );
        await expect(inexistente.remove(id)).rejects.toThrow(NotFoundError);

        expect(usuarios.desactivarYDesvincular).not.toHaveBeenCalled();
    });
});
