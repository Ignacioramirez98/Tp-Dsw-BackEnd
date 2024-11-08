import jwt from 'jsonwebtoken'; // Importa el paquete JWT
import express from 'express';
import cors from 'cors';
import { productoRouter } from './Producto/producto.routes.js';
import { vendedorRouter } from './Vendedor/vendedor.routes.js';
import { localidadRouter } from './localidad/localidad.routes.js';
import { clienteRouter } from './cliente/cliente.routes.js';
import { servicioRouter } from './servicio/servicio.routes.js';
import { ventaRouter } from './venta/venta.routes.js';
import { operarioRouter } from './operario/operario.routes.js';
// Simulación de usuarios (esto lo reemplazarás por tu base de datos real)
const usuarios = [
    { email: 'user@example.com', password: 'password123', userType: 'cliente' },
    { email: 'vendedor@example.com', password: 'vendedor123', userType: 'vendedor' },
];
const app = express();
app.use(cors({
    origin: 'http://localhost:4200'
}));
app.use(express.json());
app.use('/productos', productoRouter);
app.use('/vendedores', vendedorRouter);
app.use('/localidades', localidadRouter);
app.use('/clientes', clienteRouter);
app.use('/servicios', servicioRouter);
app.use('/ventas', ventaRouter);
app.use('/operarios', operarioRouter);
app.post('/login', (req, res) => {
    const { email, password, userType } = req.body;
    // Validar el usuario y la contraseña
    const usuario = usuarios.find(user => user.email === email && user.password === password && user.userType === userType);
    if (!usuario) {
        return res.status(401).json({ message: 'Credenciales incorrectas' });
    }
    // Si las credenciales son correctas, se genera un token JWT
    const token = jwt.sign({ email, userType }, 'secretkey', { expiresIn: '1h' }); // Usar una clave secreta fuerte
    // Enviar el token al cliente
    res.json({ token });
});
app.use((_, res) => {
    return res.status(404).send({ message: 'Resource not found' });
});
app.listen(3000, () => {
    console.log('Server runnning on http://localhost:3000/');
});
//# sourceMappingURL=app.js.map