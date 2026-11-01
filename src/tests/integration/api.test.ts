import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import type { Express } from 'express';
import type { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Test de integración: levanta la API completa (Express + MikroORM) contra una
 * base MongoDB de prueba y recorre el flujo de una venta a través de HTTP:
 * login -> alta de localidad, cliente, vendedor y producto -> venta -> detalle.
 *
 * Por defecto usa mongodb-memory-server (descarga MongoDB la primera vez).
 * Para usar otro servidor de prueba: TEST_MONGO_URI=mongodb://... npm run test:integration
 * Nunca toca la base real: usa la base "crm_test".
 */

let mongo: MongoMemoryServer | undefined;
let app: Express;
let cerrarORM: () => Promise<void>;

const admin = { usuario: 'admin_test', contraseña: 'admin123' };
const cliente = { usuario: 'cliente_test', contraseña: 'cliente123' };
let tokenAdmin = '';
let tokenCliente = '';

beforeAll(async () => {
    if (process.env.TEST_MONGO_URI) {
        process.env.MONGO_URI = process.env.TEST_MONGO_URI;
    } else {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongo = await MongoMemoryServer.create();
        process.env.MONGO_URI = mongo.getUri();
    }
    process.env.MONGO_DB_NAME = 'crm_test';

    // Se importan después de configurar la URI, porque la config se lee al cargar el módulo
    const { initializeORM, closeORM } = await import('../../shared/db/conn.js');
    const { createApp } = await import('../../app.js');
    const { Usuario } = await import('../../usuario/usuario.entity.js');

    const orm = await initializeORM();
    cerrarORM = closeORM;
    await orm.getSchemaGenerator().clearDatabase();

    // Usuarios iniciales (no se pueden crear admins por la API)
    const em = orm.em.fork();
    em.create(Usuario, { usuario: admin.usuario, contraseña: await bcrypt.hash(admin.contraseña, 4), rol: 'admin' });
    em.create(Usuario, { usuario: cliente.usuario, contraseña: await bcrypt.hash(cliente.contraseña, 4), rol: 'cliente' });
    await em.flush();

    app = createApp(orm);
}, 120_000);

afterAll(async () => {
    await cerrarORM?.();
    await mongo?.stop();
});

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('API - autenticación', () => {
    it('login correcto devuelve token y rol', async () => {
        const res = await request(app).post('/usuarios/login').send(admin);

        expect(res.status).toBe(200);
        expect(res.body.data.rol).toBe('admin');
        expect(res.body.token).toEqual(expect.any(String));
        tokenAdmin = res.body.token;

        tokenCliente = (await request(app).post('/usuarios/login').send(cliente)).body.token;
    });

    it('login con contraseña incorrecta responde 401', async () => {
        const res = await request(app).post('/usuarios/login').send({ ...admin, contraseña: 'incorrecta' });
        expect(res.status).toBe(401);
    });

    it('una ruta protegida sin token responde 401', async () => {
        const res = await request(app).get('/ventas');
        expect(res.status).toBe(401);
    });

    it('un rol sin permiso responde 403', async () => {
        const res = await request(app).delete('/ventas/' + 'a'.repeat(24)).set(auth(tokenCliente));
        expect(res.status).toBe(403);
    });
});

describe('API - flujo de una venta', () => {
    const ids: Record<string, string> = {};

    it('da de alta localidad, cliente, vendedor y producto', async () => {
        const localidad = await request(app).post('/localidades').set(auth(tokenAdmin))
            .send({ nombre: 'Rosario', codigo_postal: '2000' });
        expect(localidad.status).toBe(201);
        ids.localidad = localidad.body.data.id;

        const nuevoCliente = await request(app).post('/clientes').send({
            nombre: 'Juan', apellido: 'Pérez', dni: '30.111.222', mail: 'juan@mail.com',
            telefono: '3415551111', direccion: 'San Martín 100', localidadId: ids.localidad,
        });
        expect(nuevoCliente.status).toBe(201);
        expect(nuevoCliente.body.data.dni).toBe('30111222');
        ids.cliente = nuevoCliente.body.data.id;

        const vendedor = await request(app).post('/vendedores').set(auth(tokenAdmin)).send({
            nombre: 'Ana', apellido: 'Gómez', mail: 'ana@mail.com', dni: '28111222', telefono: '3415552222',
        });
        expect(vendedor.status).toBe(201);
        ids.vendedor = vendedor.body.data.id;

        // Formulario multipart como el del front (los números llegan como texto)
        const producto = await request(app).post('/productos').set(auth(tokenAdmin))
            .field('nombre', 'Tractor 100HP')
            .field('descripcion', 'Tractor agrícola')
            .field('importe_compra', '8000')
            .field('importe_venta', '10000')
            .field('stock', '5');
        expect(producto.status).toBe(201);
        expect(producto.body.data.importe_venta).toBe(10000);
        ids.producto = producto.body.data.id;
    });

    it('rechaza una venta inválida con un mensaje claro', async () => {
        const res = await request(app).post('/ventas').set(auth(tokenAdmin))
            .send({ clienteId: ids.cliente, items: [{ productoId: ids.producto, cantidad: 0 }] });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('La cantidad de cada ítem debe ser un entero mayor a 0');
    });

    it('crea la venta con sus ítems y relaciones', async () => {
        const res = await request(app).post('/ventas').set(auth(tokenAdmin)).send({
            clienteId: ids.cliente,
            vendedorId: ids.vendedor,
            items: [{ productoId: ids.producto, cantidad: 2 }],
        });

        expect(res.status).toBe(201);
        expect(res.body.data.estado).toBe('pendiente');
        expect(res.body.data.items[0]).toMatchObject({ cantidad: 2, precioUnitario: 10000, subtotal: 20000 });
        ids.venta = res.body.data.id;
    });

    it('el detalle de la venta trae cliente con localidad, vendedor y productos', async () => {
        const res = await request(app).get(`/ventas/${ids.venta}`).set(auth(tokenAdmin));

        expect(res.status).toBe(200);
        expect(res.body.data.cliente).toMatchObject({ nombre: 'Juan', localidad: { nombre: 'Rosario' } });
        expect(res.body.data.vendedor).toMatchObject({ nombre: 'Ana' });
        expect(res.body.data.items[0].producto).toMatchObject({ nombre: 'Tractor 100HP' });
    });

    it('filtra las ventas por cliente', async () => {
        const res = await request(app).get(`/ventas?clienteId=${ids.cliente}`).set(auth(tokenAdmin));
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });

    it('no permite borrar un producto que está en una venta', async () => {
        const res = await request(app).delete(`/productos/${ids.producto}`).set(auth(tokenAdmin));
        expect(res.status).toBe(409);
    });

    it('al borrar la venta ya se puede borrar el producto', async () => {
        expect((await request(app).delete(`/ventas/${ids.venta}`).set(auth(tokenAdmin))).status).toBe(200);
        expect((await request(app).delete(`/productos/${ids.producto}`).set(auth(tokenAdmin))).status).toBe(200);
    });
});

describe('API - permisos por rol y por propietario', () => {
    const ids: Record<string, string> = {};
    let tokenJuan = '';

    beforeAll(async () => {
        const nuevo = (dni: string, nombre: string) => request(app).post('/clientes').send({
            nombre, apellido: 'Test', dni, mail: `${nombre}@mail.com`, telefono: '3415550000', direccion: 'Calle 1',
        });
        ids.juan = (await nuevo('31000001', 'juan')).body.data.id;
        ids.maria = (await nuevo('31000002', 'maria')).body.data.id;

        const producto = await request(app).post('/productos').set(auth(tokenAdmin))
            .send({ nombre: 'Rastra', descripcion: 'd', importe_compra: 1, importe_venta: 500, stock: 10 });
        ids.producto = producto.body.data.id;

        // Usuario de Juan vinculado a su ficha de cliente
        await request(app).post('/usuarios').set(auth(tokenAdmin))
            .send({ usuario: 'juan', contraseña: 'juan123', rol: 'cliente', clienteId: ids.juan });
        tokenJuan = (await request(app).post('/usuarios/login').send({ usuario: 'juan', contraseña: 'juan123' })).body.token;

        // Una venta de María, cargada por el admin
        ids.ventaMaria = (await request(app).post('/ventas').set(auth(tokenAdmin))
            .send({ clienteId: ids.maria, items: [{ productoId: ids.producto, cantidad: 1 }] })).body.data.id;
    });

    it('un cliente ve y edita su propia ficha', async () => {
        expect((await request(app).get(`/clientes/${ids.juan}`).set(auth(tokenJuan))).status).toBe(200);
        const res = await request(app).patch(`/clientes/${ids.juan}`).set(auth(tokenJuan)).send({ telefono: '3415559999' });
        expect(res.status).toBe(200);
    });

    it('un cliente no puede ver, editar ni listar a otros clientes', async () => {
        expect((await request(app).get(`/clientes/${ids.maria}`).set(auth(tokenJuan))).status).toBe(403);
        expect((await request(app).patch(`/clientes/${ids.maria}`).set(auth(tokenJuan)).send({ telefono: '3415550001' })).status).toBe(403);
        expect((await request(app).get('/clientes').set(auth(tokenJuan))).status).toBe(403);
    });

    it('un cliente genera un pedido propio y pendiente aunque mande otro clienteId', async () => {
        const res = await request(app).post('/ventas').set(auth(tokenJuan)).send({
            clienteId: ids.maria, estado: 'concretada', items: [{ productoId: ids.producto, cantidad: 2 }],
        });
        expect(res.status).toBe(201);
        expect(res.body.data.cliente.id).toBe(ids.juan);
        expect(res.body.data.estado).toBe('pendiente');
        ids.ventaJuan = res.body.data.id;
    });

    it('un cliente solo ve sus propias ventas', async () => {
        const lista = await request(app).get('/ventas').set(auth(tokenJuan));
        expect(lista.status).toBe(200);
        expect(lista.body.data.map((v: { id: string }) => v.id)).toEqual([ids.ventaJuan]);

        expect((await request(app).get(`/ventas/${ids.ventaJuan}`).set(auth(tokenJuan))).status).toBe(200);
        expect((await request(app).get(`/ventas/${ids.ventaMaria}`).set(auth(tokenJuan))).status).toBe(404);
    });

    it('un cliente no puede modificar ni borrar ventas, ni gestionar el catálogo', async () => {
        expect((await request(app).patch(`/ventas/${ids.ventaJuan}`).set(auth(tokenJuan)).send({ estado: 'concretada' })).status).toBe(403);
        expect((await request(app).delete(`/ventas/${ids.ventaJuan}`).set(auth(tokenJuan))).status).toBe(403);
        expect((await request(app).post('/productos').set(auth(tokenJuan)).send({})).status).toBe(403);
        expect((await request(app).get('/productos').set(auth(tokenJuan))).status).toBe(200);
    });
});

describe('API - CUU Concretar Venta', () => {
    const ids: Record<string, string> = {};
    let tokenVendedor = '';
    let tokenPedro = '';
    const stock = async () => (await request(app).get(`/productos/${ids.producto}`).set(auth(tokenAdmin))).body.data.stock;

    beforeAll(async () => {
        ids.vendedor = (await request(app).post('/vendedores').set(auth(tokenAdmin)).send({
            nombre: 'Laura', apellido: 'Martínez', mail: 'laura@mail.com', dni: '29111222', telefono: '3415553333',
        })).body.data.id;
        ids.pedro = (await request(app).post('/clientes').send({
            nombre: 'Pedro', apellido: 'Sosa', dni: '32111222', mail: 'pedro@mail.com', telefono: '3415554444', direccion: 'Ruta 9',
        })).body.data.id;
        ids.producto = (await request(app).post('/productos').set(auth(tokenAdmin))
            .send({ nombre: 'Sembradora', descripcion: 'd', importe_compra: 1, importe_venta: 900, stock: 3 })).body.data.id;

        await request(app).post('/usuarios').set(auth(tokenAdmin))
            .send({ usuario: 'laura', contraseña: 'laura123', rol: 'vendedor', vendedorId: ids.vendedor });
        await request(app).post('/usuarios').set(auth(tokenAdmin))
            .send({ usuario: 'pedro', contraseña: 'pedro123', rol: 'cliente', clienteId: ids.pedro });
        tokenVendedor = (await request(app).post('/usuarios/login').send({ usuario: 'laura', contraseña: 'laura123' })).body.token;
        tokenPedro = (await request(app).post('/usuarios/login').send({ usuario: 'pedro', contraseña: 'pedro123' })).body.token;
    });

    it('el cliente hace un pedido: queda pendiente y todavía no descuenta stock', async () => {
        const res = await request(app).post('/ventas').set(auth(tokenPedro))
            .send({ items: [{ productoId: ids.producto, cantidad: 2 }] });
        expect(res.status).toBe(201);
        expect(res.body.data.estado).toBe('pendiente');
        expect(res.body.data.vendedor ?? null).toBeNull();
        ids.pedido = res.body.data.id;
        expect(await stock()).toBe(3);
    });

    it('el cliente no puede concretar su propio pedido', async () => {
        expect((await request(app).post(`/ventas/${ids.pedido}/concretar`).set(auth(tokenPedro))).status).toBe(403);
    });

    it('el vendedor concreta el pedido: descuenta stock, queda a su nombre y con fecha de venta', async () => {
        const entrega = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const res = await request(app).post(`/ventas/${ids.pedido}/concretar`).set(auth(tokenVendedor))
            .send({ fechaEntrega: entrega });

        expect(res.body.message).toBe('Venta concretada');
        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ estado: 'concretada', vendedor: { nombre: 'Laura' } });
        expect(res.body.data.fechaDeVenta).toEqual(expect.any(String));
        expect(res.body.data.fechaEntrega.slice(0, 10)).toBe(entrega);
        expect(await stock()).toBe(1);
    });

    it('no se puede concretar dos veces ni cambiar los productos de una venta concretada', async () => {
        const otraVez = await request(app).post(`/ventas/${ids.pedido}/concretar`).set(auth(tokenVendedor));
        expect(otraVez.status).toBe(409);
        expect(otraVez.body.message).toBe('No se puede concretar una venta concretada');

        const cambio = await request(app).patch(`/ventas/${ids.pedido}`).set(auth(tokenVendedor))
            .send({ items: [{ productoId: ids.producto, cantidad: 1 }] });
        expect(cambio.status).toBe(409);
    });

    it('sin stock suficiente responde 409 y la venta sigue pendiente', async () => {
        ids.pedidoGrande = (await request(app).post('/ventas').set(auth(tokenPedro))
            .send({ items: [{ productoId: ids.producto, cantidad: 5 }] })).body.data.id;

        const res = await request(app).post(`/ventas/${ids.pedidoGrande}/concretar`).set(auth(tokenVendedor));
        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Stock insuficiente: Sembradora (pedido 5, disponible 1)');
        expect((await request(app).get(`/ventas/${ids.pedidoGrande}`).set(auth(tokenAdmin))).body.data.estado).toBe('pendiente');
        expect(await stock()).toBe(1);
    });

    it('el cliente cancela su pedido pendiente, pero no una compra concretada', async () => {
        expect((await request(app).post(`/ventas/${ids.pedido}/cancelar`).set(auth(tokenPedro))).status).toBe(409);

        const res = await request(app).post(`/ventas/${ids.pedidoGrande}/cancelar`).set(auth(tokenPedro));
        expect(res.status).toBe(200);
        expect(res.body.data.estado).toBe('cancelada');
    });

    it('una venta concretada no se borra; al cancelarla el stock vuelve y recién ahí se puede borrar', async () => {
        expect((await request(app).delete(`/ventas/${ids.pedido}`).set(auth(tokenAdmin))).status).toBe(409);

        const res = await request(app).post(`/ventas/${ids.pedido}/cancelar`).set(auth(tokenVendedor));
        expect(res.status).toBe(200);
        expect(res.body.data.fechaCancelacion).toEqual(expect.any(String));
        expect(await stock()).toBe(3);

        expect((await request(app).delete(`/ventas/${ids.pedido}`).set(auth(tokenAdmin))).status).toBe(200);
    });
});

describe('API - listado de ventas por rango de fecha', () => {
    const dia = (desplazamiento: number) => {
        // Fecha de Argentina (UTC-3), igual que la interpreta el backend
        const fecha = new Date(Date.now() - 3 * 60 * 60 * 1000 + desplazamiento * 24 * 60 * 60 * 1000);
        return fecha.toISOString().slice(0, 10);
    };

    it('incluye las ventas del rango (con el día "hasta" completo) y excluye las de afuera', async () => {
        const hoy = await request(app).get(`/ventas?desde=${dia(0)}&hasta=${dia(0)}`).set(auth(tokenAdmin));
        expect(hoy.status).toBe(200);
        expect(hoy.body.data.length).toBeGreaterThan(0);

        const futuro = await request(app).get(`/ventas?desde=${dia(1)}`).set(auth(tokenAdmin));
        expect(futuro.body.data).toHaveLength(0);

        const pasado = await request(app).get(`/ventas?hasta=${dia(-1)}`).set(auth(tokenAdmin));
        expect(pasado.body.data).toHaveLength(0);
    });

    it('rechaza fechas inválidas o un rango invertido', async () => {
        expect((await request(app).get('/ventas?desde=ayer').set(auth(tokenAdmin))).status).toBe(400);
        const invertido = await request(app).get(`/ventas?desde=${dia(1)}&hasta=${dia(0)}`).set(auth(tokenAdmin));
        expect(invertido.status).toBe(400);
        expect(invertido.body.message).toBe('La fecha "desde" no puede ser posterior a "hasta"');
    });
});
