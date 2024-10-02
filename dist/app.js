import express from 'express';
import cors from 'cors';
import { productoRouter } from './Producto/producto.routes.js';
import { vendedorRouter } from './Vendedor/vendedor.routes.js';
import { localidadRouter } from './localidad/localidad.routes.js';
import { clienteRouter } from './cliente/cliente.routes.js';
import { servicioRouter } from './servicio/servicio.routes.js';
import { ventaRouter } from './venta/venta.routes.js';
import { operarioRouter } from './operario/operario.routes.js';
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
app.use((_, res) => {
    return res.status(404).send({ message: 'Resource not found' });
});
app.listen(3000, () => {
    console.log('Server runnning on http://localhost:3000/');
});
//# sourceMappingURL=app.js.map