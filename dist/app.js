import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { productoRouter } from './Producto/producto.routes.js';
import { vendedorRouter } from './Vendedor/vendedor.routes.js';
import { localidadRouter } from './localidad/localidad.routes.js';
import { clienteRouter } from './cliente/cliente.routes.js';
import { servicioRouter } from './servicio/servicio.routes.js';
import { ventaRouter } from './venta/venta.routes.js';
import { operarioRouter } from './operario/operario.routes.js';
// URL de conexión a MongoDB
const connectionStr = process.env.MONGO_URI || 'mongodb+srv://nacho98nacho98:dsw123@cluster0.z5xdoug.mongodb.net/';
const cli = new MongoClient(connectionStr);
const app = express();
// Configuración de CORS
app.use(cors({
    origin: 'http://localhost:4200',
}));
// Middleware para parsear JSON
app.use(express.json());
// Conectar a MongoDB y luego iniciar el servidor Express
async function startServer() {
    try {
        await cli.connect(); // Conexión a MongoDB
        console.log('Connected to MongoDB');
        // Una vez conectado, iniciar el servidor
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
        });
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}
startServer(); // Llamamos a la función para iniciar el servidor después de la conexión
//# sourceMappingURL=app.js.map