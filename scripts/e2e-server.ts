/**
 * Servidor de pruebas end-to-end (Playwright del front).
 *
 *   npm run e2e:server
 *
 * Levanta la API completa contra una base MongoDB EFÍMERA (mongodb-memory-server),
 * con datos fijos y un JWT de prueba. Nunca lee el .env ni toca la base real:
 * al cortar el proceso, la base desaparece.
 *
 * Puerto: E2E_PORT (por defecto 3000, el que usa el front en environment.ts).
 *
 * Datos que carga (los espera front/e2e):
 *   cliente  / cliente123  (rol cliente, vinculado a una ficha de cliente)
 *   operario / operario123 (rol operario, responsable del servicio "Service general de tractor")
 *   Tractor 120 HP ($45.000.000, stock 3) y Rastra de discos 28 ($7.900.000, stock 5)
 *   Servicio "Service general de tractor" ($35.000 por hora)
 */
import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

const puerto = Number(process.env.E2E_PORT) || 3000;

async function main() {
    const mongo = await MongoMemoryServer.create();

    // Se pisa la configuración ANTES de importar el resto: config.ts lee el entorno al cargarse
    process.env.MONGO_URI = mongo.getUri();
    process.env.MONGO_DB_NAME = 'crm_e2e';
    process.env.JWT_SECRET = 'secreto-e2e-solo-para-pruebas';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.NODE_ENV = 'test';
    process.env.PORT = String(puerto);
    process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

    const { initializeORM, closeORM } = await import('../src/shared/db/conn.js');
    const { createApp } = await import('../src/app.js');
    const { Usuario } = await import('../src/usuario/usuario.entity.js');
    const { Localidad } = await import('../src/localidad/localidad.entity.js');
    const { Cliente } = await import('../src/cliente/cliente.entity.js');
    const { Producto } = await import('../src/producto/producto.entity.js');
    const { Operario } = await import('../src/operario/operario.entity.js');
    const { Servicio } = await import('../src/servicio/servicio.entity.js');

    const orm = await initializeORM();
    await orm.getSchemaGenerator().clearDatabase();

    const em = orm.em.fork();
    const rosario = em.create(Localidad, { nombre: 'Rosario', codigo_postal: '2000' });
    const cliente = em.create(Cliente, {
        nombre: 'Juan', apellido: 'Pérez', dni: '25111222', mail: 'juan.perez@campo.com', telefono: '3415551003',
        direccion: 'Ruta 33 km 12', razon_social: 'Establecimiento La Esperanza', localidad: rosario,
    } as any);
    em.create(Usuario, {
        usuario: 'cliente', contraseña: await bcrypt.hash('cliente123', 4), rol: 'cliente', activo: true, cliente,
    } as any);
    em.create(Producto, {
        nombre: 'Tractor 120 HP', descripcion: 'Tractor doble tracción con cabina climatizada',
        importe_compra: 38000000, importe_venta: 45000000, stock: 3,
    } as any);
    em.create(Producto, {
        nombre: 'Rastra de discos 28', descripcion: 'Rastra de tiro excéntrico para labranza',
        importe_compra: 6200000, importe_venta: 7900000, stock: 5,
    } as any);
    const operario = em.create(Operario, {
        nombre: 'Carlos', apellido: 'Benítez', mail: 'carlos.benitez@agrocrm.com', dni: '30111222', telefono: '3415551001',
    } as any);
    em.create(Usuario, {
        usuario: 'operario', contraseña: await bcrypt.hash('operario123', 4), rol: 'operario', activo: true, operario,
    } as any);
    em.create(Servicio, { descripcion: 'Service general de tractor', importe_por_hora: 35000, operario } as any);
    await em.flush();

    const servidor = createApp(orm).listen(puerto, () => {
        console.log(`[e2e] API de prueba lista en http://localhost:${puerto}/ (base en memoria)`);
    });

    const cerrar = async () => {
        servidor.close();
        await closeORM();
        await mongo.stop();
        process.exit(0);
    };
    process.on('SIGINT', cerrar);
    process.on('SIGTERM', cerrar);
}

main().catch((error) => {
    console.error('[e2e] No se pudo levantar el servidor de prueba:', error);
    process.exit(1);
});
