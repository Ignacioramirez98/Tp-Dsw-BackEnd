import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { usuarioRouter } from './usuario/usuario.routes.js';
import { productoRouter } from './producto/producto.routes.js';
import { vendedorRouter } from './Vendedor/vendedor.routes.js';
import { localidadRouter } from './localidad/localidad.routes.js';
import { clienteRouter } from './cliente/cliente.routes.js';
import { servicioRouter } from './servicio/servicio.routes.js';
import { ventaRouter } from './venta/venta.routes.js';
import { operarioRouter } from './operario/operario.routes.js';
import { initializeORM } from './shared/db/conn.js';
const app = express();
app.use(cors({
    origin: 'http://localhost:4200',
}));
app.use(express.json());
// Servir archivos estáticos (imágenes, CSS, etc.)
app.use(express.static('public'));
async function startServer() {
    try {
        await initializeORM();
        console.log('Connected to MongoDB with MikroORM');
        // Rutas de autenticación
        app.use('/usuarios', usuarioRouter);
        // Rutas de módulos de negocio
        app.use('/productos', productoRouter);
        app.use('/vendedores', vendedorRouter);
        app.use('/localidades', localidadRouter);
        app.use('/clientes', clienteRouter);
        app.use('/servicios', servicioRouter);
        app.use('/ventas', ventaRouter);
        app.use('/operarios', operarioRouter);
        app.use((_, res) => {
            return res.status(404).send({ message: 'Resource not found' });
        });
        app.listen(3000, () => {
            console.log('Server running on http://localhost:3000/');
            console.log('Environment:', process.env.NODE_ENV);
        });
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=app.js.map