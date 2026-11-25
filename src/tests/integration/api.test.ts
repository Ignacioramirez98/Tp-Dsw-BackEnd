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
        // Una venta cargada por el admin no avisa al crearla (se avisa al concretar)
        expect(res.body.notificacion).toBeNull();
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
        // Al cliente se le confirma que el pedido llegó (en los tests no hay SMTP: "desactivado")
        expect(res.body.notificacion).toEqual({ estado: 'desactivado', para: 'pedro@mail.com' });
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
        // En los tests no hay SMTP: la venta se concreta igual e informa que el mail no salió
        expect(res.body.notificacion).toEqual({ estado: 'desactivado', para: 'pedro@mail.com' });
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

        const res = await request(app).post(`/ventas/${ids.pedido}/cancelar`).set(auth(tokenVendedor))
            .send({ notificarCliente: false });
        expect(res.body.notificacion).toEqual({ estado: 'omitido' });
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

describe('API - CUU Solicitar Servicio', () => {
    const ids: Record<string, string> = {};
    let tokenCli = '';
    let tokenOtroCli = '';
    let tokenOp = '';
    let tokenOtroOp = '';

    beforeAll(async () => {
        const crearCliente = (dni: string, nombre: string) => request(app).post('/clientes').send({
            nombre, apellido: 'Solic', dni, mail: `${nombre}@mail.com`, telefono: '3415550000', direccion: 'Calle 1',
        });
        const crearOperario = (dni: string, nombre: string) => request(app).post('/operarios').set(auth(tokenAdmin)).send({
            nombre, apellido: 'Op', mail: `${nombre}@mail.com`, dni, telefono: '3415551111',
        });
        const usuario = async (nombre: string, rol: string, perfil: Record<string, string>) => {
            await request(app).post('/usuarios').set(auth(tokenAdmin)).send({ usuario: nombre, contraseña: `${nombre}123`, rol, ...perfil });
            return (await request(app).post('/usuarios/login').send({ usuario: nombre, contraseña: `${nombre}123` })).body.token as string;
        };

        ids.cli = (await crearCliente('32000001', 'solcli')).body.data.id;
        ids.otroCli = (await crearCliente('32000002', 'solotro')).body.data.id;
        ids.op = (await crearOperario('33000001', 'solop')).body.data.id;
        ids.otroOp = (await crearOperario('33000002', 'solotroop')).body.data.id;

        ids.servicio = (await request(app).post('/servicios').set(auth(tokenAdmin))
            .send({ descripcion: 'Riego', importe_por_hora: 1000, operarioId: ids.op })).body.data.id;
        ids.servicioLibre = (await request(app).post('/servicios').set(auth(tokenAdmin))
            .send({ descripcion: 'Poda', importe_por_hora: 500 })).body.data.id;

        tokenCli = await usuario('solcli', 'cliente', { clienteId: ids.cli });
        tokenOtroCli = await usuario('solotro', 'cliente', { clienteId: ids.otroCli });
        tokenOp = await usuario('solop', 'operario', { operarioId: ids.op });
        tokenOtroOp = await usuario('solotroop', 'operario', { operarioId: ids.otroOp });
    });

    it('el cliente pide un servicio: nace pendiente, a su nombre y con el importe estimado', async () => {
        const res = await request(app).post('/solicitudes-servicio').set(auth(tokenCli))
            .send({ servicioId: ids.servicio, horasEstimadas: 3, observaciones: 'Lote norte', estado: 'finalizada' });

        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject({ estado: 'pendiente', importePorHora: 1000, importeEstimado: 3000, observaciones: 'Lote norte' });
        expect(res.body.data.operario).toMatchObject({ nombre: 'solop' });
        ids.solicitud = res.body.data.id;
    });

    it('valida los datos y los permisos del alta', async () => {
        const invalida = await request(app).post('/solicitudes-servicio').set(auth(tokenCli)).send({ servicioId: ids.servicio, horasEstimadas: 0 });
        expect(invalida.status).toBe(400);
        expect((await request(app).post('/solicitudes-servicio').set(auth(tokenOp)).send({ servicioId: ids.servicio, horasEstimadas: 1 })).status).toBe(403);
        expect((await request(app).get('/solicitudes-servicio')).status).toBe(401);
    });

    it('cada rol ve solo lo suyo', async () => {
        const libre = await request(app).post('/solicitudes-servicio').set(auth(tokenOtroCli)).send({ servicioId: ids.servicioLibre, horasEstimadas: 2 });
        ids.libre = libre.body.data.id;

        const delCliente = await request(app).get('/solicitudes-servicio').set(auth(tokenCli));
        expect(delCliente.body.data.map((s: any) => s.id)).toEqual([ids.solicitud]);
        expect((await request(app).get(`/solicitudes-servicio/${ids.libre}`).set(auth(tokenCli))).status).toBe(404);

        // El operario ve la de su servicio y la que no tiene responsable; el otro operario, solo la libre
        const delOperario = await request(app).get('/solicitudes-servicio').set(auth(tokenOp));
        expect(delOperario.body.data.map((s: any) => s.id).sort()).toEqual([ids.solicitud, ids.libre].sort());
        const delOtro = await request(app).get('/solicitudes-servicio').set(auth(tokenOtroOp));
        expect(delOtro.body.data.map((s: any) => s.id)).toEqual([ids.libre]);
        expect((await request(app).get(`/solicitudes-servicio/${ids.solicitud}`).set(auth(tokenOtroOp))).status).toBe(404);

        expect((await request(app).get('/solicitudes-servicio').set(auth(tokenAdmin))).body.data.length).toBeGreaterThanOrEqual(2);
        const filtrada = await request(app).get('/solicitudes-servicio?estado=aceptada').set(auth(tokenAdmin));
        expect(filtrada.body.data).toHaveLength(0);
    });

    it('el operario acepta y finaliza; el importe final sale de las horas reales', async () => {
        const aceptada = await request(app).post(`/solicitudes-servicio/${ids.solicitud}/aceptar`).set(auth(tokenOp));
        expect(aceptada.status).toBe(200);
        expect(aceptada.body.data.estado).toBe('aceptada');

        expect((await request(app).post(`/solicitudes-servicio/${ids.solicitud}/aceptar`).set(auth(tokenOp))).status).toBe(409);
        // Ya aceptada: el cliente no puede cancelarla
        expect((await request(app).post(`/solicitudes-servicio/${ids.solicitud}/cancelar`).set(auth(tokenCli))).status).toBe(409);

        const finalizada = await request(app).post(`/solicitudes-servicio/${ids.solicitud}/finalizar`).set(auth(tokenOp)).send({ horasReales: 4 });
        expect(finalizada.status).toBe(200);
        expect(finalizada.body.data).toMatchObject({ estado: 'finalizada', horasReales: 4, importeFinal: 4000 });
    });

    it('el cliente cancela su pedido pendiente y las ajenas no se tocan', async () => {
        expect((await request(app).post(`/solicitudes-servicio/${ids.libre}/cancelar`).set(auth(tokenCli))).status).toBe(404);
        const res = await request(app).post(`/solicitudes-servicio/${ids.libre}/cancelar`).set(auth(tokenOtroCli)).send({ motivo: 'Ya no hace falta' });
        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ estado: 'cancelada', motivoCancelacion: 'Ya no hace falta' });
    });

    it('un servicio o un cliente con solicitudes no se pueden borrar', async () => {
        expect((await request(app).delete(`/servicios/${ids.servicio}`).set(auth(tokenAdmin))).status).toBe(409);
        expect((await request(app).delete(`/clientes/${ids.cli}`).set(auth(tokenAdmin))).status).toBe(409);
    });
});

describe('API - ABM de Usuarios', () => {
    const ids: Record<string, string> = {};
    let tokenAdminUsuarios = '';

    const crear = (usuario: string, extra: Record<string, unknown> = {}) =>
        request(app).post('/usuarios').set(auth(tokenAdmin)).send({ usuario, contraseña: `${usuario}123`, rol: 'cliente', ...extra });
    const login = (usuario: string, contraseña = `${usuario}123`) => request(app).post('/usuarios/login').send({ usuario, contraseña });

    beforeAll(async () => {
        const sesion = await login(admin.usuario, admin.contraseña);
        tokenAdminUsuarios = sesion.body.token;
        ids.admin = sesion.body.data.usuarioId;

        const cliente = await request(app).post('/clientes').send({
            nombre: 'Abm', apellido: 'Cliente', dni: '35000001', mail: 'abmcli@mail.com', telefono: '3415550001', direccion: 'Calle 1',
        });
        ids.cliente = cliente.body.data.id;
        ids.operario = (await request(app).post('/operarios').set(auth(tokenAdmin)).send({
            nombre: 'Abm', apellido: 'Operario', mail: 'abmop@mail.com', dni: '35000002', telefono: '3415550002',
        })).body.data.id;
        ids.vendedor = (await request(app).post('/vendedores').set(auth(tokenAdmin)).send({
            nombre: 'Abm', apellido: 'Vendedor', mail: 'abmven@mail.com', dni: '35000003', telefono: '3415550003',
        })).body.data.id;
    });

    it('alta, listado y detalle sin exponer la contraseña', async () => {
        const alta = await crear('abm_suelto', { clienteId: ids.cliente });
        expect(alta.status).toBe(201);
        ids.suelto = alta.body.data.usuarioId;

        const lista = await request(app).get('/usuarios').set(auth(tokenAdmin));
        expect(lista.status).toBe(200);
        expect(lista.body.data.map((u: any) => u.usuario)).toContain('abm_suelto');
        expect(JSON.stringify(lista.body)).not.toContain('contraseña');

        const detalle = await request(app).get(`/usuarios/${ids.suelto}`).set(auth(tokenAdmin));
        expect(detalle.body.data).toMatchObject({ usuario: 'abm_suelto', rol: 'cliente', activo: true, clienteId: ids.cliente });
    });

    it('solo el admin gestiona usuarios', async () => {
        expect((await request(app).get('/usuarios').set(auth(tokenCliente))).status).toBe(403);
        expect((await request(app).patch(`/usuarios/${ids.suelto}`).set(auth(tokenCliente)).send({ activo: false })).status).toBe(403);
        expect((await request(app).patch(`/usuarios/${ids.suelto}/activar`).set(auth(tokenCliente))).status).toBe(403);
        expect((await request(app).delete(`/usuarios/${ids.suelto}`).set(auth(tokenCliente))).status).toBe(403);
        expect((await request(app).delete(`/usuarios/${ids.suelto}`)).status).toBe(401);
    });

    it('cambia la contraseña: la anterior deja de servir', async () => {
        const res = await request(app).patch(`/usuarios/${ids.suelto}`).set(auth(tokenAdmin)).send({ contraseña: 'nueva-clave-1' });
        expect(res.status).toBe(200);
        expect(res.body.data).not.toHaveProperty('contraseña');

        expect((await login('abm_suelto')).status).toBe(401);
        expect((await login('abm_suelto', 'nueva-clave-1')).status).toBe(200);
    });

    it('valida los datos de la edición', async () => {
        const editar = (body: Record<string, unknown>) => request(app).patch(`/usuarios/${ids.suelto}`).set(auth(tokenAdmin)).send(body);

        expect((await editar({})).status).toBe(400);
        expect((await editar({ contraseña: '123' })).status).toBe(400);
        expect((await editar({ rol: 'admin', clienteId: ids.cliente })).status).toBe(400);
        expect((await editar({ usuario: admin.usuario })).status).toBe(409);
        expect((await request(app).patch(`/usuarios/${'a'.repeat(24)}`).set(auth(tokenAdmin)).send({ activo: true })).status).toBe(404);
    });

    it('desactiva (ya no puede entrar) y vuelve a activar', async () => {
        const baja = await request(app).patch(`/usuarios/${ids.suelto}/desactivar`).set(auth(tokenAdmin));
        expect(baja.status).toBe(200);
        expect((await login('abm_suelto', 'nueva-clave-1')).status).toBe(403);

        const alta = await request(app).patch(`/usuarios/${ids.suelto}/activar`).set(auth(tokenAdmin));
        expect(alta.status).toBe(200);
        expect(alta.body.data.activo).toBe(true);
        expect((await login('abm_suelto', 'nueva-clave-1')).status).toBe(200);
    });

    it('un admin no puede desactivarse ni eliminarse a sí mismo', async () => {
        expect((await request(app).patch(`/usuarios/${ids.admin}/desactivar`).set(auth(tokenAdminUsuarios))).status).toBe(403);
        expect((await request(app).patch(`/usuarios/${ids.admin}`).set(auth(tokenAdminUsuarios)).send({ activo: false })).status).toBe(403);
        expect((await request(app).delete(`/usuarios/${ids.admin}`).set(auth(tokenAdminUsuarios))).status).toBe(403);
        expect((await login(admin.usuario, admin.contraseña)).status).toBe(200);
    });

    it('cambia el rol indicando el perfil que le corresponde', async () => {
        const sinPerfil = await request(app).patch(`/usuarios/${ids.suelto}`).set(auth(tokenAdmin)).send({ rol: 'vendedor' });
        expect(sinPerfil.status).toBe(400);

        const res = await request(app).patch(`/usuarios/${ids.suelto}`).set(auth(tokenAdmin)).send({ rol: 'vendedor', vendedorId: ids.vendedor });
        expect(res.status).toBe(200);
        expect(res.body.data).toMatchObject({ rol: 'vendedor', vendedorId: ids.vendedor, clienteId: null });

        const sesion = await login('abm_suelto', 'nueva-clave-1');
        expect(sesion.body.data).toMatchObject({ rol: 'vendedor', vendedorId: ids.vendedor });

        // Ese vendedor ya tiene usuario
        const otro = await crear('abm_otro', { rol: 'operario' });
        const repetido = await request(app).patch(`/usuarios/${otro.body.data.usuarioId}`).set(auth(tokenAdmin)).send({ rol: 'vendedor', vendedorId: ids.vendedor });
        expect(repetido.status).toBe(409);
        ids.otro = otro.body.data.usuarioId;
    });

    it('un usuario vinculado a un perfil no se elimina: se desactiva', async () => {
        const res = await request(app).delete(`/usuarios/${ids.suelto}`).set(auth(tokenAdmin));
        expect(res.status).toBe(409);
        expect((await request(app).get(`/usuarios/${ids.suelto}`).set(auth(tokenAdmin))).status).toBe(200);
    });

    it('uno sin perfil sí se elimina', async () => {
        const res = await request(app).delete(`/usuarios/${ids.otro}`).set(auth(tokenAdmin));
        expect(res.status).toBe(200);
        expect((await request(app).get(`/usuarios/${ids.otro}`).set(auth(tokenAdmin))).status).toBe(404);
        expect((await request(app).delete(`/usuarios/${ids.otro}`).set(auth(tokenAdmin))).status).toBe(404);
    });

    it('al eliminar su cliente, operario o vendedor el usuario queda desactivado y sin vínculo', async () => {
        const conCliente = await crear('abm_cli', { clienteId: ids.cliente });
        const conOperario = await crear('abm_op', { rol: 'operario', operarioId: ids.operario });
        expect(conCliente.status).toBe(201);
        expect(conOperario.status).toBe(201);

        expect((await request(app).delete(`/clientes/${ids.cliente}`).set(auth(tokenAdmin))).status).toBe(200);
        expect((await request(app).delete(`/operarios/${ids.operario}`).set(auth(tokenAdmin))).status).toBe(200);

        expect((await login('abm_cli')).status).toBe(403);
        expect((await login('abm_op')).status).toBe(403);

        const cli = await request(app).get(`/usuarios/${conCliente.body.data.usuarioId}`).set(auth(tokenAdmin));
        expect(cli.body.data).toMatchObject({ activo: false, clienteId: null });

        // Ya sin vínculo, se puede eliminar
        expect((await request(app).delete(`/usuarios/${conCliente.body.data.usuarioId}`).set(auth(tokenAdmin))).status).toBe(200);
        expect((await request(app).delete(`/usuarios/${conOperario.body.data.usuarioId}`).set(auth(tokenAdmin))).status).toBe(200);
    });

    it('al eliminar su vendedor, su usuario también queda desactivado', async () => {
        expect((await request(app).delete(`/vendedores/${ids.vendedor}`).set(auth(tokenAdmin))).status).toBe(200);
        expect((await login('abm_suelto', 'nueva-clave-1')).status).toBe(403);
        const res = await request(app).get(`/usuarios/${ids.suelto}`).set(auth(tokenAdmin));
        expect(res.body.data).toMatchObject({ activo: false, vendedorId: null });
    });
});

describe('API - CUU Realizar facturación', () => {
    const ids: Record<string, string> = {};
    let tokenVendedor = '';
    let tokenCliente = '';
    let tokenOtroCliente = '';

    beforeAll(async () => {
        ids.vendedor = (await request(app).post('/vendedores').set(auth(tokenAdmin)).send({
            nombre: 'Marta', apellido: 'Ríos', mail: 'marta@mail.com', dni: '27111222', telefono: '3415556666',
        })).body.data.id;
        const nuevoCliente = (nombre: string, dni: string) => request(app).post('/clientes').send({
            nombre, apellido: 'Facturado', dni, mail: `${nombre}@mail.com`, telefono: '3415557777', direccion: 'Calle 2', razon_social: `${nombre} SA`,
        });
        ids.cliente = (await nuevoCliente('Lucas', '33111222')).body.data.id;
        ids.otro = (await nuevoCliente('Sofia', '33111333')).body.data.id;
        ids.producto = (await request(app).post('/productos').set(auth(tokenAdmin))
            .send({ nombre: 'Acoplado', descripcion: 'd', importe_compra: 1, importe_venta: 1000, stock: 20 })).body.data.id;

        await request(app).post('/usuarios').set(auth(tokenAdmin))
            .send({ usuario: 'marta', contraseña: 'marta123', rol: 'vendedor', vendedorId: ids.vendedor });
        await request(app).post('/usuarios').set(auth(tokenAdmin))
            .send({ usuario: 'lucas', contraseña: 'lucas123', rol: 'cliente', clienteId: ids.cliente });
        await request(app).post('/usuarios').set(auth(tokenAdmin))
            .send({ usuario: 'sofia', contraseña: 'sofia123', rol: 'cliente', clienteId: ids.otro });
        const login = async (usuario: string, contraseña: string) =>
            (await request(app).post('/usuarios/login').send({ usuario, contraseña })).body.token;
        tokenVendedor = await login('marta', 'marta123');
        tokenCliente = await login('lucas', 'lucas123');
        tokenOtroCliente = await login('sofia', 'sofia123');
    });

    const pedido = async (token: string, cantidad = 2) =>
        (await request(app).post('/ventas').set(auth(token)).send({ items: [{ productoId: ids.producto, cantidad }] })).body.data.id as string;
    const concretar = (id: string) => request(app).post(`/ventas/${id}/concretar`).set(auth(tokenVendedor)).send({ notificarCliente: false });
    const facturar = (id: string, token = tokenVendedor) => request(app).post(`/ventas/${id}/facturar`).set(auth(token));

    it('no se factura una venta pendiente', async () => {
        ids.venta = await pedido(tokenCliente);

        const res = await facturar(ids.venta);
        expect(res.status).toBe(409);
        expect(res.body.message).toBe('No se puede facturar una venta pendiente');
    });

    it('el cliente no puede facturar y sin token no se accede', async () => {
        await concretar(ids.venta);

        expect((await facturar(ids.venta, tokenCliente)).status).toBe(403);
        expect((await request(app).post(`/ventas/${ids.venta}/facturar`)).status).toBe(401);
    });

    it('el vendedor factura la venta concretada: comprobante con IVA y venta facturada', async () => {
        const res = await facturar(ids.venta);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Venta facturada');
        expect(res.body.data).toMatchObject({
            numero: expect.stringMatching(/^0001-\d{8}$/),
            emitidaPor: 'marta',
            venta: ids.venta,
            cliente: ids.cliente,
            subtotal: 2000, alicuotaIva: 21, iva: 420, total: 2420,
            lineas: [{ descripcion: 'Acoplado', cantidad: 2, precioUnitario: 1000, importe: 2000 }],
            receptor: { nombre: 'Lucas Facturado', dni: '33111222', razonSocial: 'Lucas SA' },
        });
        ids.factura = res.body.data.id;
        ids.numero = res.body.data.numero;

        expect((await request(app).get(`/ventas/${ids.venta}`).set(auth(tokenAdmin))).body.data.estado).toBe('facturada');
    });

    it('no se factura dos veces la misma venta', async () => {
        const res = await facturar(ids.venta);
        expect(res.status).toBe(409);
        expect(res.body.message).toBe('La venta ya está facturada');
    });

    it('una venta facturada ya no se cancela ni se borra', async () => {
        const cancelar = await request(app).post(`/ventas/${ids.venta}/cancelar`).set(auth(tokenVendedor));
        expect(cancelar.status).toBe(409);
        expect(cancelar.body.message).toBe('No se puede cancelar una venta facturada');

        expect((await request(app).delete(`/ventas/${ids.venta}`).set(auth(tokenAdmin))).status).toBe(409);
    });

    it('la numeración es correlativa', async () => {
        const otra = await pedido(tokenCliente, 1);
        await concretar(otra);
        const res = await facturar(otra);

        expect(res.status).toBe(201);
        expect(Number(res.body.data.numero.slice(-8))).toBe(Number(ids.numero.slice(-8)) + 1);
    });

    it('el cliente ve sus facturas y no las ajenas', async () => {
        const propia = await request(app).get(`/facturas/${ids.factura}`).set(auth(tokenCliente));
        expect(propia.status).toBe(200);
        expect(propia.body.data.numero).toBe(ids.numero);

        expect((await request(app).get(`/ventas/${ids.venta}/factura`).set(auth(tokenCliente))).body.data.id).toBe(ids.factura);

        const lista = await request(app).get('/facturas').set(auth(tokenCliente));
        expect(lista.status).toBe(200);
        expect(lista.body.data).toHaveLength(2);
        expect(lista.body.data.every((f: any) => f.cliente === ids.cliente)).toBe(true);

        // Otro cliente: no ve la lista de Lucas y la factura le figura como inexistente
        expect((await request(app).get('/facturas').set(auth(tokenOtroCliente))).body.data).toHaveLength(0);
        expect((await request(app).get(`/facturas/${ids.factura}`).set(auth(tokenOtroCliente))).status).toBe(404);
        expect((await request(app).get(`/ventas/${ids.venta}/factura`).set(auth(tokenOtroCliente))).status).toBe(404);
    });

    it('vendedor y admin ven todas; se filtra por cliente y por fecha', async () => {
        const todas = await request(app).get('/facturas').set(auth(tokenVendedor));
        expect(todas.status).toBe(200);
        expect(todas.body.data.length).toBeGreaterThanOrEqual(2);

        const deLucas = await request(app).get(`/facturas?clienteId=${ids.cliente}`).set(auth(tokenAdmin));
        expect(deLucas.body.data).toHaveLength(2);
        expect((await request(app).get(`/facturas?clienteId=${ids.otro}`).set(auth(tokenAdmin))).body.data).toHaveLength(0);

        // "Hoy" como día de Argentina (el back lee AAAA-MM-DD en esa zona; con UTC, de noche daría el día siguiente)
        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
        expect((await request(app).get(`/facturas?desde=${hoy}&hasta=${hoy}`).set(auth(tokenAdmin))).body.data.length).toBeGreaterThanOrEqual(2);
        expect((await request(app).get('/facturas?desde=2020-01-01&hasta=2020-01-31').set(auth(tokenAdmin))).body.data).toHaveLength(0);
        expect((await request(app).get('/facturas?desde=ayer').set(auth(tokenAdmin))).status).toBe(400);
    });

    it('la factura es un comprobante: no se edita ni se borra', async () => {
        for (const metodo of ['put', 'patch', 'delete'] as const) {
            expect((await request(app)[metodo](`/facturas/${ids.factura}`).set(auth(tokenAdmin))).status).toBe(404);
        }
    });

    it('si dos personas facturan a la vez, solo una lo logra', async () => {
        const id = await pedido(tokenCliente, 1);
        await concretar(id);

        const [a, b] = await Promise.all([facturar(id), facturar(id, tokenAdmin)]);

        expect([a.status, b.status].sort()).toEqual([201, 409]);
        expect((await request(app).get('/facturas').set(auth(tokenAdmin))).body.data.filter((f: any) => f.venta === id)).toHaveLength(1);
    });

    it('responde 404 si la venta no existe y 404 si todavía no tiene factura', async () => {
        expect((await facturar('a'.repeat(24))).status).toBe(404);

        const sinFactura = await pedido(tokenCliente, 1);
        expect((await request(app).get(`/ventas/${sinFactura}/factura`).set(auth(tokenAdmin))).status).toBe(404);
    });
});
