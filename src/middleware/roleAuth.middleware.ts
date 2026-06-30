import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: string; usuario: string; rol: string };
}

export function protectRoute(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
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
