import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { RequestContext } from '@mikro-orm/core';
import { usuarioRouter } from './usuario/usuario.routes.js';
import { productoRouter } from './producto/producto.routes.js';
import { vendedorRouter } from './Vendedor/vendedor.routes.js';
import { localidadRouter } from './localidad/localidad.routes.js';
import { clienteRouter } from './cliente/cliente.routes.js';
import { servicioRouter } from './servicio/servicio.routes.js';
import { ventaRouter } from './venta/venta.routes.js';
import { operarioRouter } from './operario/operario.routes.js';
import { initializeORM } from './shared/db/conn.js';
import { config } from './shared/config.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors({
  origin: config.frontendUrl,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
}));

app.use(express.json());

// Servir archivos estáticos (imágenes, CSS, etc.)
app.use(express.static('public'));

async function startServer() {
  try {
    const orm = await initializeORM();
    console.log('Connected to MongoDB with MikroORM');

    // Un EntityManager por request (identity map aislado)
    app.use((req, res, next) => RequestContext.create(orm.em, next));

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

    // Rutas inexistentes y manejo centralizado de errores (siempre al final)
    app.use(notFoundHandler);
    app.use(errorHandler);

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}/`);
      console.log('Environment:', config.nodeEnv);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

startServer();
