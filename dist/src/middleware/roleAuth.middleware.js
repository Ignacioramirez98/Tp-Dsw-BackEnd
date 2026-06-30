import jwt from 'jsonwebtoken';
export function protectRoute(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
}
export function requireRole(...roles) {
    return (req, res, next) => {
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
//# sourceMappingURL=roleAuth.middleware.js.map