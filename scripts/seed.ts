/**
 * Carga datos iniciales en la base configurada en el .env.
 *
 *   npm run seed           -> crea el usuario administrador
 *   npm run seed -- --demo -> además carga datos de ejemplo y un usuario por rol
 *
 * Es idempotente: si un registro ya existe (mismo usuario, DNI o nombre) no lo duplica,
 * así que se puede correr más de una vez sin problema.
 *
 * Credenciales del admin: SEED_ADMIN_USUARIO y SEED_ADMIN_PASSWORD en el .env
 * (por defecto admin / admin123). Cambiarlas antes de correrlo en producción.
 */
import 'reflect-metadata';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { EntityManager } from '@mikro-orm/core';
import { initializeORM, closeORM } from '../src/shared/db/conn.js';
import { Usuario, Rol } from '../src/usuario/usuario.entity.js';
import { Localidad } from '../src/localidad/localidad.entity.js';
import { Cliente } from '../src/cliente/cliente.entity.js';
import { Vendedor } from '../src/Vendedor/vendedor.entity.js';
import { Operario } from '../src/operario/operario.entity.js';
import { Producto } from '../src/producto/producto.entity.js';
import { Servicio } from '../src/servicio/servicio.entity.js';

const demo = process.argv.includes('--demo');
const creados: string[] = [];
const existentes: string[] = [];

/** Busca un registro por `where`; si no existe lo crea con `data`. */
async function buscarOCrear<T extends object>(em: EntityManager, entidad: new (...args: any[]) => T, where: object, data: object, etiqueta: string): Promise<T> {
    const existente = await em.findOne(entidad, where as any);
    if (existente) {
        existentes.push(etiqueta);
        return existente;
    }
    const nuevo = em.create(entidad, data as any);
    await em.flush();
    creados.push(etiqueta);
    return nuevo;
}

async function crearUsuario(em: EntityManager, usuario: string, password: string, rol: Rol, perfil: Partial<Pick<Usuario, 'cliente' | 'vendedor' | 'operario'>> = {}) {
    return buscarOCrear(em, Usuario, { usuario }, {
        usuario,
        contraseña: await bcrypt.hash(password, 10),
        rol,
        activo: true,
        ...perfil,
    }, `usuario ${usuario} (${rol})`);
}

async function cargarDemo(em: EntityManager) {
    const rosario = await buscarOCrear(em, Localidad, { nombre: 'Rosario' }, { nombre: 'Rosario', codigo_postal: '2000' }, 'localidad Rosario');
    await buscarOCrear(em, Localidad, { nombre: 'Funes' }, { nombre: 'Funes', codigo_postal: '2132' }, 'localidad Funes');
    await buscarOCrear(em, Localidad, { nombre: 'Casilda' }, { nombre: 'Casilda', codigo_postal: '2170' }, 'localidad Casilda');

    const productos = [
        { nombre: 'Tractor 120 HP', descripcion: 'Tractor doble tracción con cabina climatizada', importe_compra: 38000000, importe_venta: 45000000, stock: 3 },
        { nombre: 'Sembradora neumática 16 surcos', descripcion: 'Sembradora de precisión para grano grueso', importe_compra: 21000000, importe_venta: 26500000, stock: 2 },
        { nombre: 'Pulverizadora de arrastre 3000 L', descripcion: 'Botalón de 28 m con control por sección', importe_compra: 12500000, importe_venta: 15800000, stock: 4 },
        { nombre: 'Rastra de discos 28', descripcion: 'Rastra de tiro excéntrico para labranza', importe_compra: 6200000, importe_venta: 7900000, stock: 5 },
    ];
    for (const producto of productos) {
        await buscarOCrear(em, Producto, { nombre: producto.nombre }, producto, `producto ${producto.nombre}`);
    }

    const operario = await buscarOCrear(em, Operario, { dni: '30111222' }, {
        nombre: 'Carlos', apellido: 'Benítez', mail: 'carlos.benitez@agrocrm.com', dni: '30111222', telefono: '3415551001',
    }, 'operario Carlos Benítez');

    const servicios = [
        { descripcion: 'Service general de tractor', importe_por_hora: 35000 },
        { descripcion: 'Calibración de pulverizadora', importe_por_hora: 28000 },
        { descripcion: 'Reparación de transmisión', importe_por_hora: 42000 },
    ];
    for (const servicio of servicios) {
        await buscarOCrear(em, Servicio, { descripcion: servicio.descripcion }, { ...servicio, operario }, `servicio ${servicio.descripcion}`);
    }

    const vendedor = await buscarOCrear(em, Vendedor, { dni: '28111222' }, {
        nombre: 'Laura', apellido: 'Martínez', mail: 'laura.martinez@agrocrm.com', dni: '28111222', telefono: '3415551002', rol: 'vendedor',
    }, 'vendedor Laura Martínez');

    const cliente = await buscarOCrear(em, Cliente, { dni: '25111222' }, {
        nombre: 'Juan', apellido: 'Pérez', dni: '25111222', mail: 'juan.perez@campo.com', telefono: '3415551003',
        direccion: 'Ruta 33 km 12', razon_social: 'Establecimiento La Esperanza', localidad: rosario,
    }, 'cliente Juan Pérez');

    // Un usuario por rol para probar la app (las contraseñas se documentan en el README)
    await crearUsuario(em, 'vendedor', 'vendedor123', 'vendedor', { vendedor });
    await crearUsuario(em, 'operario', 'operario123', 'operario', { operario });
    await crearUsuario(em, 'cliente', 'cliente123', 'cliente', { cliente });
}

async function main() {
    const orm = await initializeORM();
    const em = orm.em.fork();

    const adminUsuario = process.env.SEED_ADMIN_USUARIO || 'admin';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    await crearUsuario(em, adminUsuario, adminPassword, 'admin');

    if (demo) {
        await cargarDemo(em);
    }

    console.log(`Base: ${orm.config.get('dbName')}`);
    console.log(`Creados (${creados.length}):${creados.map((c) => `\n  + ${c}`).join('')}`);
    console.log(`Ya existían (${existentes.length}):${existentes.map((c) => `\n  = ${c}`).join('')}`);

    await closeORM();
}

main().catch(async (error) => {
    console.error('Error al cargar los datos:', error);
    await closeORM();
    process.exit(1);
});
