import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { protectRoute, requireRole } from '../../middleware/roleAuth.middleware.js';
import { UsuarioService } from '../../usuario/usuario.service.js';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors.js';

/**
 * Tests unitarios de la autenticación: login (UsuarioService) y los middlewares
 * que protegen las rutas según el token y el rol.
 */

const SECRET = process.env.JWT_SECRET!;

function mockResponse() {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

describe('protectRoute', () => {
    it('responde 401 si no se envía token', () => {
        const res = mockResponse();
        const next = vi.fn();
        protectRoute({ header: () => undefined } as any, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('responde 401 si el token es inválido o fue firmado con otra clave', () => {
        const res = mockResponse();
        const next = vi.fn();
        const tokenFalso = jwt.sign({ rol: 'admin' }, 'otra-clave');
        protectRoute({ header: () => `Bearer ${tokenFalso}` } as any, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('con un token válido deja pasar y carga el usuario en la request', () => {
        const req: any = { header: () => `Bearer ${jwt.sign({ usuario: 'ana', rol: 'vendedor' }, SECRET)}` };
        const next = vi.fn();
        protectRoute(req, mockResponse(), next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toMatchObject({ usuario: 'ana', rol: 'vendedor' });
    });
});

describe('requireRole', () => {
    it('deja pasar a un rol permitido', () => {
        const next = vi.fn();
        requireRole('vendedor', 'admin')({ user: { rol: 'admin' } } as any, mockResponse(), next);
        expect(next).toHaveBeenCalled();
    });

    it('responde 403 a un rol no permitido', () => {
        const res = mockResponse();
        const next = vi.fn();
        requireRole('admin')({ user: { rol: 'cliente' } } as any, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});

describe('UsuarioService.login', () => {
    const clienteId = new ObjectId();

    async function servicioCon(usuario: Record<string, unknown> | undefined) {
        const repository = { findByUsuario: async () => usuario };
        return new UsuarioService(repository as any);
    }

    async function usuarioActivo(extra: Record<string, unknown> = {}) {
        return {
            _id: new ObjectId(), usuario: 'juan', rol: 'cliente', activo: true,
            contraseña: await bcrypt.hash('secreta123', 4),
            cliente: { _id: clienteId },
            ...extra,
        };
    }

    it('con credenciales correctas devuelve un JWT con el rol y los datos del usuario', async () => {
        const service = await servicioCon(await usuarioActivo());
        const { token, data } = await service.login({ usuario: 'juan', contraseña: 'secreta123' });

        const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
        expect(payload.rol).toBe('cliente');
        expect(payload.usuario).toBe('juan');
        expect(data).toMatchObject({ usuario: 'juan', rol: 'cliente', vendedorId: null });
        expect(data.clienteId).toEqual(clienteId);
        expect(data).not.toHaveProperty('contraseña');
    });

    it('rechaza una contraseña incorrecta con 401', async () => {
        const service = await servicioCon(await usuarioActivo());
        await expect(service.login({ usuario: 'juan', contraseña: 'incorrecta' })).rejects.toThrow(UnauthorizedError);
    });

    it('rechaza un usuario inexistente con el mismo mensaje (no revela si existe)', async () => {
        const service = await servicioCon(undefined);
        await expect(service.login({ usuario: 'nadie', contraseña: 'secreta123' }))
            .rejects.toThrow('Usuario o contraseña inválidos');
    });

    it('rechaza un usuario desactivado con 403', async () => {
        const service = await servicioCon(await usuarioActivo({ activo: false }));
        await expect(service.login({ usuario: 'juan', contraseña: 'secreta123' })).rejects.toThrow(ForbiddenError);
    });
});
