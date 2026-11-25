import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { FacturaService } from '../../factura/factura.service.js';
import { FacturaRepository } from '../../factura/factura.repository.js';
import { ALICUOTA_IVA, armarComprobante, formatearNumero } from '../../factura/factura.calculo.js';
import { Venta } from '../../venta/venta.entity.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';

/**
 * Tests unitarios del CUU "Realizar facturación": cálculo del comprobante, reglas para
 * facturar una venta, permisos de lectura y la lógica atómica del repositorio.
 * No necesitan base de datos: los repositorios y el EntityManager son falsos.
 */

const clienteId = new ObjectId();
const otroClienteId = new ObjectId();

function ventaBase(estado = 'concretada', items?: any[]): any {
    const tractor = { _id: new ObjectId(), nombre: 'Tractor 120 HP' };
    const rastra = { _id: new ObjectId(), nombre: 'Rastra de discos 28' };
    return {
        _id: new ObjectId(),
        estado,
        cliente: {
            _id: clienteId, nombre: 'Juan', apellido: 'Pérez', dni: '25111222', mail: 'juan@campo.com',
            direccion: 'Ruta 33 km 12', razon_social: 'La Esperanza', localidad: { nombre: 'Rosario' },
        },
        items: items ?? [
            { producto: tractor, cantidad: 1, precioUnitario: 45_000_000 },
            { producto: rastra, cantidad: 4, precioUnitario: 7_900_000 },
        ],
    };
}

describe('armarComprobante', () => {
    it('arma un renglón por ítem y discrimina el IVA sobre el subtotal', () => {
        const c = armarComprobante(ventaBase());

        expect(c.lineas).toEqual([
            { descripcion: 'Tractor 120 HP', cantidad: 1, precioUnitario: 45_000_000, importe: 45_000_000 },
            { descripcion: 'Rastra de discos 28', cantidad: 4, precioUnitario: 7_900_000, importe: 31_600_000 },
        ]);
        expect(c.subtotal).toBe(76_600_000);
        expect(c.alicuotaIva).toBe(ALICUOTA_IVA);
        expect(c.iva).toBe(16_086_000);
        expect(c.total).toBe(92_686_000);
    });

    it('redondea a dos decimales', () => {
        const c = armarComprobante(ventaBase('concretada', [{ producto: { nombre: 'Tornillo' }, cantidad: 3, precioUnitario: 33.33 }]));

        expect(c.subtotal).toBe(99.99);
        expect(c.iva).toBe(21);
        expect(c.total).toBe(120.99);
    });

    it('copia los datos del cliente al comprobante', () => {
        expect(armarComprobante(ventaBase()).receptor).toEqual({
            nombre: 'Juan Pérez', dni: '25111222', razonSocial: 'La Esperanza',
            direccion: 'Ruta 33 km 12', localidad: 'Rosario', mail: 'juan@campo.com',
        });

        const sinLocalidad = ventaBase();
        sinLocalidad.cliente.localidad = null;
        expect(armarComprobante(sinLocalidad).receptor.localidad).toBeNull();
    });

    it('numera con punto de venta y ocho dígitos', () => {
        expect(formatearNumero(1)).toBe('0001-00000001');
        expect(formatearNumero(1234)).toBe('0001-00001234');
    });
});

describe('FacturaService.facturar', () => {
    let venta: any;
    let emitidas: any[];
    let existente: any;
    let service: FacturaService;

    const armar = (v: any) => {
        venta = v;
        emitidas = [];
        existente = undefined;
        const repository: any = {
            findByVenta: async () => existente,
            emitir: async (datos: any, laVenta: any) => {
                emitidas.push({ datos, laVenta });
                laVenta.estado = 'facturada';
                return { _id: new ObjectId(), numero: '0001-00000001', ...datos };
            },
        };
        const ventaRepository: any = {
            findParaGestionar: async (id: ObjectId) => (id.equals(venta._id) ? venta : undefined),
        };
        service = new FacturaService(repository, ventaRepository);
        return venta._id.toHexString();
    };

    let id: string;
    beforeEach(() => {
        id = armar(ventaBase());
    });

    it('emite la factura de una venta concretada con quién la emitió', async () => {
        const factura: any = await service.facturar(id, { rol: 'vendedor', usuario: 'ana' });

        expect(emitidas).toHaveLength(1);
        expect(factura.emitidaPor).toBe('ana');
        expect(factura.total).toBe(92_686_000);
        expect(factura.fechaEmision).toBeInstanceOf(Date);
        expect(venta.estado).toBe('facturada');
    });

    it('responde 404 si la venta no existe', async () => {
        await expect(service.facturar(new ObjectId().toHexString())).rejects.toThrow(NotFoundError);
        await expect(service.facturar('no-es-un-id')).rejects.toThrow(BadRequestError);
    });

    it('solo se factura una venta concretada', async () => {
        for (const estado of ['pendiente', 'cancelada']) {
            const otraId = armar(ventaBase(estado));
            await expect(service.facturar(otraId)).rejects.toThrow(`No se puede facturar una venta ${estado}`);
            expect(emitidas).toHaveLength(0);
        }
    });

    it('no factura dos veces la misma venta', async () => {
        await service.facturar(id);

        // Ya facturada
        await expect(service.facturar(id)).rejects.toThrow('La venta ya está facturada');
        expect(emitidas).toHaveLength(1);

        // Aunque el estado de la venta esté desfasado, si ya tiene factura tampoco
        const otraId = armar(ventaBase());
        existente = { _id: new ObjectId() };
        await expect(service.facturar(otraId)).rejects.toThrow(ConflictError);
        expect(emitidas).toHaveLength(0);
    });

    it('una venta sin productos no se puede facturar', async () => {
        const otraId = armar(ventaBase('concretada', []));
        await expect(service.facturar(otraId)).rejects.toThrow('La venta no tiene productos para facturar');
        expect(emitidas).toHaveLength(0);
    });
});

describe('FacturaService - consulta', () => {
    const propia: any = { _id: new ObjectId(), cliente: { _id: clienteId } };
    const ajena: any = { _id: new ObjectId(), cliente: { _id: otroClienteId } };
    const cliente = { rol: 'cliente' as const, clienteId: clienteId.toHexString() };
    const admin = { rol: 'admin' as const };
    let consultas: Record<string, any>[];
    let service: FacturaService;

    beforeEach(() => {
        consultas = [];
        const todas = [propia, ajena];
        const repository: any = {
            findAll: async (query: Record<string, any>) => { consultas.push(query); return todas; },
            findOne: async ({ _id }: { _id: ObjectId }) => todas.find((f) => f._id.equals(_id)),
            findByVenta: async (id: ObjectId) => (id.equals(propia._id) ? propia : id.equals(ajena._id) ? ajena : undefined),
        };
        service = new FacturaService(repository, {} as any);
    });

    it('un cliente solo lista sus facturas, aunque pida las de otro', async () => {
        await service.findAll({ clienteId: otroClienteId.toHexString() }, cliente);
        expect(consultas[0].cliente.equals(clienteId)).toBe(true);
    });

    it('el admin puede filtrar por cliente y por rango de fechas', async () => {
        await service.findAll({ clienteId: otroClienteId.toHexString(), desde: '2026-11-01', hasta: '2026-11-30' }, admin);

        expect(consultas[0].cliente.equals(otroClienteId)).toBe(true);
        expect(consultas[0].fechaEmision.$gte.toISOString()).toBe('2026-11-01T03:00:00.000Z');
        expect(consultas[0].fechaEmision.$lt.toISOString()).toBe('2026-12-01T03:00:00.000Z');
    });

    it('rechaza fechas inválidas o invertidas', async () => {
        await expect(service.findAll({ desde: 'ayer' }, admin)).rejects.toThrow(BadRequestError);
        await expect(service.findAll({ desde: '2026-11-30', hasta: '2026-11-01' }, admin)).rejects.toThrow(BadRequestError);
    });

    it('a un cliente una factura ajena le figura como inexistente', async () => {
        await expect(service.findOne(propia._id.toHexString(), cliente)).resolves.toBe(propia);
        await expect(service.findOne(ajena._id.toHexString(), cliente)).rejects.toThrow(NotFoundError);
        await expect(service.findByVenta(ajena._id.toHexString(), cliente)).rejects.toThrow(NotFoundError);
        await expect(service.findOne(ajena._id.toHexString(), admin)).resolves.toBe(ajena);
    });

    it('404 si no existe y 403 si el cliente no tiene ficha', async () => {
        await expect(service.findOne(new ObjectId().toHexString(), admin)).rejects.toThrow(NotFoundError);
        await expect(service.findByVenta(new ObjectId().toHexString(), admin)).rejects.toThrow('Factura no encontrada');
        await expect(service.findAll({}, { rol: 'cliente', clienteId: null })).rejects.toThrow(ForbiddenError);
    });
});

describe('FacturaRepository.emitir', () => {
    /** Repositorio con un EntityManager falso: registra qué se actualiza y qué contador devuelve. */
    function armar(opciones: { reclamadas?: number; contador?: any; falla?: boolean } = {}) {
        const { reclamadas = 1, contador = { secuencia: 7 }, falla = false } = opciones;
        const registro: { actualizaciones: any[]; creadas: any[] } = { actualizaciones: [], creadas: [] };
        const em: any = {
            nativeUpdate: vi.fn(async (_entidad: unknown, filtro: any, datos: any) => {
                registro.actualizaciones.push({ filtro, datos });
                return registro.actualizaciones.length === 1 ? reclamadas : 1;
            }),
            create: vi.fn((_entidad: unknown, datos: any) => { registro.creadas.push(datos); return datos; }),
            flush: vi.fn(async () => { if (falla) throw new Error('falló el guardado'); }),
            getConnection: () => ({
                getCollection: () => ({ findOneAndUpdate: async () => contador }),
            }),
        };
        class Probado extends FacturaRepository {
            protected override get em() { return em; }
        }
        return { repository: new Probado(), registro, em };
    }

    const datos: any = { receptor: {}, lineas: [], subtotal: 100, alicuotaIva: 21, iva: 21, total: 121, emitidaPor: 'ana', fechaEmision: new Date() };
    const nuevaVenta = () => ({ _id: new ObjectId(), estado: 'concretada', cliente: { _id: clienteId } }) as unknown as Venta;

    it('reclama la venta concretada, la deja facturada y asigna el número del contador', async () => {
        const { repository, registro } = armar();
        const venta = nuevaVenta();

        const factura: any = await repository.emitir(datos, venta);

        expect(registro.actualizaciones[0].filtro).toMatchObject({ estado: 'concretada' });
        expect(registro.actualizaciones[0].datos).toEqual({ estado: 'facturada' });
        expect(factura.numero).toBe('0001-00000007');
        expect(factura.venta).toBe(venta);
        expect(venta.estado).toBe('facturada');
    });

    it('acepta el contador en ambos formatos del driver', async () => {
        const { repository } = armar({ contador: { value: { secuencia: 12 } } });
        expect(((await repository.emitir(datos, nuevaVenta())) as any).numero).toBe('0001-00000012');
    });

    it('si otra persona ya facturó la venta (no quedó ninguna reclamada) responde 409 y no crea nada', async () => {
        const { repository, registro, em } = armar({ reclamadas: 0 });

        await expect(repository.emitir(datos, nuevaVenta())).rejects.toThrow(ConflictError);
        expect(registro.creadas).toHaveLength(0);
        expect(em.flush).not.toHaveBeenCalled();
    });

    it('si falla el guardado, la venta vuelve a concretada', async () => {
        const { repository, registro } = armar({ falla: true });
        const venta = nuevaVenta();

        await expect(repository.emitir(datos, venta)).rejects.toThrow('falló el guardado');
        expect(registro.actualizaciones[registro.actualizaciones.length - 1]).toMatchObject({ datos: { estado: 'concretada' } });
        expect(venta.estado).toBe('concretada');
    });

    it('si el contador no responde, no deja la venta facturada', async () => {
        const { repository, registro } = armar({ contador: null });
        const venta = nuevaVenta();

        await expect(repository.emitir(datos, venta)).rejects.toThrow('No se pudo obtener el número de factura');
        expect(registro.actualizaciones[registro.actualizaciones.length - 1]).toMatchObject({ datos: { estado: 'concretada' } });
    });
});
