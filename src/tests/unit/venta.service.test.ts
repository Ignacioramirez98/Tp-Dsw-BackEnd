import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { VentaService } from '../../venta/venta.service.js';
import { BadRequestError, NotFoundError } from '../../shared/errors.js';

/**
 * Tests unitarios de VentaService: la lógica para armar una venta.
 * Se reemplazan los repositorios por versiones en memoria, así no hace falta base de datos.
 */

const clienteId = new ObjectId();
const vendedorId = new ObjectId();
const tractorId = new ObjectId();
const sembradoraId = new ObjectId();
const servicioId = new ObjectId();

const productos = new Map([
    [tractorId.toHexString(), { _id: tractorId, nombre: 'Tractor', importe_venta: 1000 }],
    [sembradoraId.toHexString(), { _id: sembradoraId, nombre: 'Sembradora', importe_venta: 250 }],
]);

/** Repositorio falso que encuentra solo los ids indicados. */
const repoCon = (...ids: ObjectId[]) => ({
    findOne: async ({ _id }: { _id: ObjectId }) => (ids.some((id) => id.equals(_id)) ? { _id } : undefined),
});

function crearServicio() {
    const guardadas: { data: any; items: any[] }[] = [];

    const ventaRepository = {
        addConItems: async (data: any, items: any[]) => {
            guardadas.push({ data, items });
            return { _id: new ObjectId(), ...data };
        },
        updateConItems: async () => undefined,
        findOne: async ({ _id }: { _id: ObjectId }) => ({ _id, ...guardadas.at(-1)?.data, items: guardadas.at(-1)?.items }),
    };
    const productoRepository = {
        findOne: async ({ _id }: { _id: ObjectId }) => productos.get(_id.toHexString()),
    };

    const service = new VentaService(
        ventaRepository as any,
        repoCon(clienteId) as any,
        repoCon(vendedorId) as any,
        productoRepository as any,
        repoCon(servicioId) as any,
    );

    return { service, guardadas };
}

describe('VentaService.create', () => {
    let ctx: ReturnType<typeof crearServicio>;

    beforeEach(() => {
        ctx = crearServicio();
    });

    it('guarda cada ítem con el precio de venta actual del producto', async () => {
        await ctx.service.create({
            clienteId: clienteId.toHexString(),
            items: [
                { productoId: tractorId.toHexString(), cantidad: 2 },
                { productoId: sembradoraId.toHexString(), cantidad: 3 },
            ],
        });

        const { items } = ctx.guardadas[0];
        expect(items).toHaveLength(2);
        expect(items[0]).toMatchObject({ cantidad: 2, precioUnitario: 1000 });
        expect(items[1]).toMatchObject({ cantidad: 3, precioUnitario: 250 });
        expect(items[0].producto.equals(tractorId)).toBe(true);
    });

    it('asigna estado "pendiente" y fecha de contacto si no se envían', async () => {
        await ctx.service.create({ clienteId: clienteId.toHexString(), servicioIds: [servicioId.toHexString()] });

        const { data } = ctx.guardadas[0];
        expect(data.estado).toBe('pendiente');
        expect(data.fechaContacto).toBeInstanceOf(Date);
        expect(data.cliente.equals(clienteId)).toBe(true);
        expect(data.servicios[0].equals(servicioId)).toBe(true);
    });

    it('acepta el formato anterior productoIds con cantidad 1', async () => {
        await ctx.service.create({ clienteId: clienteId.toHexString(), productoIds: [sembradoraId.toHexString()] });

        expect(ctx.guardadas[0].items).toEqual([
            expect.objectContaining({ cantidad: 1, precioUnitario: 250 }),
        ]);
    });

    it('vincula el vendedor cuando se indica', async () => {
        await ctx.service.create({
            clienteId: clienteId.toHexString(),
            vendedorId: vendedorId.toHexString(),
            productoIds: [tractorId.toHexString()],
        });

        expect(ctx.guardadas[0].data.vendedor.equals(vendedorId)).toBe(true);
    });

    it('rechaza una venta sin cliente', async () => {
        await expect(ctx.service.create({ productoIds: [tractorId.toHexString()] }))
            .rejects.toThrow(BadRequestError);
        expect(ctx.guardadas).toHaveLength(0);
    });

    it('rechaza un cliente que no existe', async () => {
        await expect(ctx.service.create({ clienteId: new ObjectId().toHexString(), productoIds: [tractorId.toHexString()] }))
            .rejects.toThrow('El cliente indicado no existe');
    });

    it('rechaza un producto que no existe y no guarda nada', async () => {
        const inexistente = new ObjectId().toHexString();

        await expect(ctx.service.create({
            clienteId: clienteId.toHexString(),
            items: [{ productoId: inexistente, cantidad: 1 }],
        })).rejects.toThrow(`El producto ${inexistente} no existe`);
        expect(ctx.guardadas).toHaveLength(0);
    });

    it('rechaza cantidades que no son enteros positivos', async () => {
        for (const cantidad of [0, -1, 1.5]) {
            await expect(ctx.service.create({
                clienteId: clienteId.toHexString(),
                items: [{ productoId: tractorId.toHexString(), cantidad }],
            })).rejects.toThrow('La cantidad de cada ítem debe ser un entero mayor a 0');
        }
    });
});

describe('VentaService.update', () => {
    it('devuelve 404 si la venta no existe', async () => {
        const { service } = crearServicio();
        await expect(service.update(new ObjectId().toHexString(), { estado: 'cancelada' }))
            .rejects.toThrow(NotFoundError);
    });

    it('devuelve 400 si el id no es válido', async () => {
        const { service } = crearServicio();
        await expect(service.update('abc', { estado: 'cancelada' })).rejects.toThrow('ID inválido');
    });
});
