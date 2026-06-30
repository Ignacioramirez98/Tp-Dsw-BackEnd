import jwt from 'jsonwebtoken';
// Middleware para proteger rutas con autenticación JWT
export function protectRoute(req, res, next) {
    // Obtener el token del header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).send({ message: 'Acceso denegado, token no proporcionado.' });
    }
    try {
        // Verificar el token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.user = decoded; // Adjuntar la información del usuario al objeto request
        next(); // Continuar con la siguiente función en la cadena
    }
    catch (error) {
        return res.status(401).send({ message: 'Token inválido.' });
    }
}
//# sourceMappingURL=auth.middleware.js.map