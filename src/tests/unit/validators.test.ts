import { describe, it, expect } from 'vitest';
import { createVentaSchema } from '../../validators/venta.validator.js';
import { createProductoSchema, updateProductoSchema } from '../../validators/producto.validator.js';
import { createOperarioSchema, createVendedorSchema } from '../../validators/persona.validator.js';
import { createLocalidadSchema } from '../../validators/localidad.validator.js';

/** Tests unitarios de los schemas de validación de entrada (Zod). */

const id = 'a'.repeat(24);
const mensajes = (result: { success: boolean; error?: { errors: { message: string }[] } }) =>
    result.success ? [] : result.error!.errors.map((e) => e.message);

describe('createProductoSchema', () => {
    it('convierte a número los valores que llegan como texto (multipart)', () => {
        const producto = createProductoSchema.parse({
            nombre: '  Tractor  ', descripcion: 'd', importe_compra: '100', importe_venta: '150.5', stock: '3',
        });
        expect(producto).toEqual({ nombre: 'Tractor', descripcion: 'd', importe_compra: 100, importe_venta: 150.5, stock: 3 });
    });

    it('rechaza importes negativos, stock decimal y texto no numérico', () => {
        expect(mensajes(createProductoSchema.safeParse({ nombre: 'a', descripcion: 'd', importe_compra: -1, importe_venta: 10, stock: 1 })))
            .toContain('importe_compra no puede ser negativo');
        expect(mensajes(createProductoSchema.safeParse({ nombre: 'a', descripcion: 'd', importe_compra: 1, importe_venta: 10, stock: 1.5 })))
            .toContain('stock debe ser un número entero');
        expect(mensajes(createProductoSchema.safeParse({ nombre: 'a', descripcion: 'd', importe_compra: 'abc', importe_venta: 10, stock: 1 })))
            .toContain('importe_compra debe ser un número');
    });

    it('en la edición acepta enviar un solo campo', () => {
        expect(updateProductoSchema.parse({ stock: '7' })).toEqual({ stock: 7 });
    });

    it('descarta campos que no pertenecen al producto', () => {
        const producto = createProductoSchema.parse({ nombre: 'a', descripcion: 'd', importe_compra: 1, importe_venta: 2, stock: 0, _id: 'x', admin: true });
        expect(producto).not.toHaveProperty('_id');
        expect(producto).not.toHaveProperty('admin');
    });
});

describe('schemas de personas', () => {
    const operario = { nombre: 'Ana', apellido: 'Gómez', mail: 'ana@mail.com', dni: '30.111.222', telefono: 3415551111 };

    it('normaliza el DNI con puntos y acepta teléfono numérico', () => {
        expect(createOperarioSchema.parse(operario)).toMatchObject({ dni: '30111222', telefono: '3415551111' });
    });

    it('rechaza DNI de longitud incorrecta y mail inválido', () => {
        expect(mensajes(createOperarioSchema.safeParse({ ...operario, dni: '123' }))).toContain('dni debe tener 7 u 8 dígitos');
        expect(mensajes(createOperarioSchema.safeParse({ ...operario, mail: 'no-es-mail' }))).toContain('mail inválido');
    });

    it('asigna rol "vendedor" por defecto', () => {
        expect(createVendedorSchema.parse(operario).rol).toBe('vendedor');
    });
});

describe('createLocalidadSchema', () => {
    it('acepta código postal de 4 dígitos o CPA', () => {
        expect(createLocalidadSchema.safeParse({ nombre: 'Rosario', codigo_postal: 2000 }).success).toBe(true);
        expect(createLocalidadSchema.safeParse({ nombre: 'Rosario', codigo_postal: 'S2000ABC' }).success).toBe(true);
        expect(createLocalidadSchema.safeParse({ nombre: 'Rosario', codigo_postal: '20' }).success).toBe(false);
    });
});

describe('createVentaSchema', () => {
    it('exige al menos un producto o un servicio', () => {
        expect(mensajes(createVentaSchema.safeParse({ clienteId: id })))
            .toContain('La venta debe tener al menos un producto o un servicio');
    });

    it('convierte cantidades y fechas', () => {
        const venta = createVentaSchema.parse({ clienteId: id, fechaEntrega: '2026-11-20', items: [{ productoId: id, cantidad: '3' }] });
        expect(venta.items![0].cantidad).toBe(3);
        expect(venta.fechaEntrega).toBeInstanceOf(Date);
    });

    it('rechaza fechas inválidas e ids mal formados', () => {
        expect(mensajes(createVentaSchema.safeParse({ clienteId: id, fechaEntrega: 'mañana', servicioIds: [id] })))
            .toContain('fechaEntrega no es una fecha válida');
        expect(mensajes(createVentaSchema.safeParse({ clienteId: 'xyz', servicioIds: [id] })))
            .toContain('clienteId inválido');
    });
});
