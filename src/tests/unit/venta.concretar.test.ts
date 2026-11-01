import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { VentaService } from '../../venta/venta.service.js';
import { puedePasar } from '../../venta/venta.estados.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';

/**
 * Tests unitarios del CUU "Concretar Venta" y de la cancelación:
 * transiciones de estado, control y descuento de stock y permisos por rol.
 * Los repositorios son falsos (en memoria): no hace falta base de datos.
 */

const clienteId = new ObjectId();
const otroClienteId = new ObjectId();
const vendedorId = new ObjectId();

function armar(estado = 'pendiente', stock = { tractor: 3, rastra: 10 }) {
    const tractor = { _id: new ObjectId(), nombre: 'Tractor', stock: stock.tractor };
    const rastra = { _id: new ObjectId(), nombre: 'Rastra', stock: stock.rastra };
    const venta: any = {
        _id: new ObjectId(),
        estado,
        cliente: { _id: clienteId },
        vendedor: null,
        // El tractor aparece en dos renglones: se tiene que sumar la cantidad
        items: [
            { producto: tractor, cantidad: 1 },
            { producto: rastra, cantidad: 4 },
            { producto: tractor, cantidad: 1 },
        ],
    };
    let guardados = 0;

    const ventaRepository = {
        findParaGestionar: async (id: ObjectId) => (id.equals(venta._id) ? venta : undefined),
        findOne: async ({ _id }: { _id: ObjectId }) => (_id.equals(venta._id) ? venta : undefined),
        guardarCambios: async (v: any, data: Record<string, unknown>) => {
            Object.assign(v, data);
            guardados++;
        },
    };
    const vendedorRepository = {
        findOne: async ({ _id }: { _id: ObjectId }) => (_id.equals(vendedorId) ? { _id } : undefined),
    };
    const service = new VentaService(ventaRepository as any, {} as any, vendedorRepository as any, {} as any, {} as any);

    return { service, venta, tractor, rastra, id: venta._id.toHexString(), guardados: () => guardados };
}

const vendedor = { rol: 'vendedor' as const, clienteId: null, vendedorId: vendedorId.toHexString() };
const admin = { rol: 'admin' as const, clienteId: null };
const cliente = { rol: 'cliente' as const, clienteId: clienteId.toHexString() };

describe('Estados de la venta', () => {
    it('solo permite las transiciones del ciclo de vida', () => {
        expect(puedePasar('pendiente', 'concretada')).toBe(true);
        expect(puedePasar('concretada', 'facturada')).toBe(true);
        expect(puedePasar('concretada', 'cancelada')).toBe(true);
        expect(puedePasar('facturada', 'cancelada')).toBe(false);
        expect(puedePasar('cancelada', 'concretada')).toBe(false);
        expect(puedePasar('pendiente', 'facturada')).toBe(false);
    });
});

describe('VentaService.concretar', () => {
    let ctx: ReturnType<typeof armar>;
    beforeEach(() => {
        ctx = armar();
    });

    it('descuenta el stock sumando los renglones del mismo producto y queda a nombre del vendedor', async () => {
        await ctx.service.concretar(ctx.id, {}, vendedor);

        expect(ctx.tractor.stock).toBe(1); // 3 - (1 + 1)
        expect(ctx.rastra.stock).toBe(6); // 10 - 4
        expect(ctx.venta.estado).toBe('concretada');
        expect(ctx.venta.vendedor.equals(vendedorId)).toBe(true);
        expect(ctx.venta.fechaDeVenta).toBeInstanceOf(Date);
        expect(ctx.guardados()).toBe(1);
    });

    it('si falta stock de algún producto no descuenta nada y explica qué falta', async () => {
        ctx = armar('pendiente', { tractor: 1, rastra: 10 });

        await expect(ctx.service.concretar(ctx.id, {}, vendedor))
            .rejects.toThrow('Stock insuficiente: Tractor (pedido 2, disponible 1)');
        expect(ctx.tractor.stock).toBe(1);
        expect(ctx.rastra.stock).toBe(10);
        expect(ctx.venta.estado).toBe('pendiente');
        expect(ctx.guardados()).toBe(0);
    });

    it('no concreta una venta que no está pendiente', async () => {
        for (const estado of ['concretada', 'facturada', 'cancelada']) {
            const otra = armar(estado);
            await expect(otra.service.concretar(otra.id, {}, vendedor)).rejects.toThrow(ConflictError);
        }
    });

    it('el admin tiene que indicar un vendedor existente', async () => {
        await expect(ctx.service.concretar(ctx.id, {}, admin)).rejects.toThrow(BadRequestError);
        await expect(ctx.service.concretar(ctx.id, { vendedorId: new ObjectId().toHexString() }, admin))
            .rejects.toThrow('El vendedor indicado no existe');

        await ctx.service.concretar(ctx.id, { vendedorId: vendedorId.toHexString() }, admin);
        expect(ctx.venta.estado).toBe('concretada');
    });

    it('un usuario vendedor sin ficha de vendedor no puede concretar', async () => {
        await expect(ctx.service.concretar(ctx.id, {}, { rol: 'vendedor', clienteId: null, vendedorId: null }))
            .rejects.toThrow(ForbiddenError);
    });

    it('rechaza una fecha de entrega pasada', async () => {
        await expect(ctx.service.concretar(ctx.id, { fechaEntrega: new Date('2020-01-01') }, vendedor))
            .rejects.toThrow('La fecha de entrega no puede ser anterior a hoy');
    });

    it('devuelve 404 si la venta no existe', async () => {
        await expect(ctx.service.concretar(new ObjectId().toHexString(), {}, vendedor)).rejects.toThrow(NotFoundError);
    });
});

describe('VentaService.cancelar', () => {
    it('al cancelar una venta concretada devuelve el stock', async () => {
        const ctx = armar('concretada', { tractor: 1, rastra: 6 });
        await ctx.service.cancelar(ctx.id, vendedor);

        expect(ctx.tractor.stock).toBe(3);
        expect(ctx.rastra.stock).toBe(10);
        expect(ctx.venta.estado).toBe('cancelada');
        expect(ctx.venta.fechaCancelacion).toBeInstanceOf(Date);
    });

    it('al cancelar un pedido pendiente no toca el stock', async () => {
        const ctx = armar('pendiente');
        await ctx.service.cancelar(ctx.id, cliente);

        expect(ctx.tractor.stock).toBe(3);
        expect(ctx.venta.estado).toBe('cancelada');
    });

    it('una venta facturada ya no se puede cancelar', async () => {
        const ctx = armar('facturada');
        await expect(ctx.service.cancelar(ctx.id, admin)).rejects.toThrow('No se puede cancelar una venta facturada');
    });

    it('el cliente solo cancela sus pedidos pendientes', async () => {
        const concretada = armar('concretada');
        await expect(concretada.service.cancelar(concretada.id, cliente)).rejects.toThrow(ConflictError);

        const ajena = armar('pendiente');
        await expect(ajena.service.cancelar(ajena.id, { rol: 'cliente', clienteId: otroClienteId.toHexString() }))
            .rejects.toThrow(NotFoundError);
    });
});

describe('VentaService - reglas al editar y borrar', () => {
    it('no deja cambiar los productos de una venta que ya no está pendiente', async () => {
        const ctx = armar('concretada');
        await expect(ctx.service.update(ctx.id, { items: [] })).rejects.toThrow(ConflictError);
    });

    it('no deja borrar una venta concretada', async () => {
        const ctx = armar('concretada');
        await expect(ctx.service.remove(ctx.id)).rejects.toThrow('No se puede eliminar una venta concretada');
    });
});

describe('Fechas de calendario', () => {
    it('una fecha AAAA-MM-DD es el comienzo de ese día en Argentina (no la medianoche UTC)', async () => {
        const { leerFecha, inicioDelDia } = await import('../../shared/utils/fechas.js');
        expect(leerFecha('2026-11-20').toISOString()).toBe('2026-11-20T03:00:00.000Z');
        // 20/11 a las 23:30 en Argentina sigue siendo el día 20
        expect(inicioDelDia(new Date('2026-11-21T02:30:00Z')).toISOString()).toBe('2026-11-20T03:00:00.000Z');
    });
});
