import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../shared/config.js';
import type { Rol } from '../usuario/usuario.entity.js';

/** Datos del usuario autenticado que viajan en el JWT. */
export interface AuthUser {
    id: string;
    usuario: string;
    rol: Rol;
    clienteId?: string | null;
    vendedorId?: string | null;
    operarioId?: string | null;
}

export type AuthRequest = Request;

/** Exige un JWT válido y deja los datos del usuario en req.user. */
export function protectRoute(req: Request, res: Response, next: NextFunction) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        req.user = jwt.verify(token, config.jwtSecret) as AuthUser;
        next();
    } catch {
        return res.status(401).json({ message: 'Token inválido o vencido' });
    }
}

/** Permite el acceso solo a los roles indicados. */
export function requireRole(...roles: Rol[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                message: 'Acceso denegado. Rol requerido: ' + roles.join(', '),
                requiredRoles: roles,
                currentRole: req.user.rol
            });
        }

        next();
    };
}

/**
 * Para rutas /:id de perfiles: si el usuario tiene el rol indicado, solo puede
 * acceder a su propio perfil (el id de la ruta tiene que ser el suyo).
 * Los demás roles que pasaron requireRole no se ven afectados.
 *
 * Ej.: soloPropio('cliente', 'clienteId') -> un cliente solo ve/edita su ficha.
 */
export function soloPropio(rol: Rol, campo: 'clienteId' | 'vendedorId' | 'operarioId') {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.user?.rol === rol && String(req.user[campo] ?? '') !== req.params.id) {
            return res.status(403).json({ message: 'Solo podés acceder a tu propio perfil' });
        }
        next();
    };
}
