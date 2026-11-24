import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { SolicitudServicioService, type Actor } from '../../solicitud-servicio/solicitud-servicio.service.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';

/**
 * Tests unitarios de SolicitudServicioService: transiciones, permisos por rol e importes.
 * Los repositorios se reemplazan por versiones en memoria (sin base de datos).
 */

const clienteId = new ObjectId();
const otroClienteId = new ObjectId();
const operarioId = new ObjectId();
const otroOperarioId = new ObjectId();
const servicioConOperario: any = { _id: new ObjectId(), descripcion: 'Riego', importe_por_hora: 100, operario: { _id: operarioId } };
const servicioSinOperario: any = { _id: new ObjectId(), descripcion: 'Poda', importe_por_hora: 80, operario: null };

const cliente: Actor = { rol: 'cliente', clienteId: clienteId.toHexString() };
const otroCliente: Actor = { rol: 'cliente', clienteId: otroClienteId.toHexString() };
const operario: Actor = { rol: 'operario', operarioId: operarioId.toHexString() };
const otroOperario: Actor = { rol: 'operario', operarioId: otroOperarioId.toHexString() };
const admin: Actor = { rol: 'admin' };

const manana = new Date(Date.now() + 24 * 60 * 60 * 1000);
const ayer = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

function armar() {
    const guardadas = new Map<string, any>();
    const repository: any = {
        add: async (data: any) => {
            const s = { _id: new ObjectId(), ...data, cliente: { _id: data.cliente }, servicio: { _id: data.servicio }, operario: data.operario ? { _id: data.operario } : null };
            guardadas.set(s._id.toHexString(), s);
            return s;
        },
        findOne: async ({ _id }: { _id: ObjectId }) => guardadas.get(_id.toHexString()),
        findAll: async () => [...guardadas.values()],
        guardarCambios: async (s: any, data: any) => {
            const { operario: op, ...resto } = data;
            Object.assign(s, resto);
            if (op !== undefined) s.operario = op ? { _id: op } : null;
        },
    };
    const servicios = [servicioConOperario, servicioSinOperario];
    const servicioRepository: any = {
        findOne: async ({ _id }: { _id: ObjectId }) => servicios.find((s) => s._id.equals(_id)),
    };
    const operarioRepository: any = {
        findOne: async ({ _id }: { _id: ObjectId }) => ([operarioId, otroOperarioId].some((o) => o.equals(_id)) ? { _id } : undefined),
    };
    return { service: new SolicitudServicioService(repository, servicioRepository, operarioRepository), guardadas };
}

describe('SolicitudServicioService', () => {
    let service: SolicitudServicioService;
    const pedir = (servicio = servicioConOperario, extra: any = {}) =>
        service.create({ servicioId: servicio._id.toHexString(), horasEstimadas: 3, ...extra }, cliente);

    beforeEach(() => { ({ service } = armar()); });

    describe('create', () => {
        it('nace pendiente, a nombre del cliente, con el precio por hora del servicio y el importe estimado', async () => {
            const s: any = await pedir();
            expect(s.estado).toBe('pendiente');
            expect(s.cliente._id.equals(clienteId)).toBe(true);
            expect(s.importePorHora).toBe(100);
            expect(s.importeEstimado).toBe(300);
            expect(s.operario._id.equals(operarioId)).toBe(true);
        });

        it('si el servicio no tiene operario, queda sin responsable', async () => {
            const s: any = await pedir(servicioSinOperario);
            expect(s.operario).toBeNull();
        });

        it('rechaza un servicio inexistente (400)', async () => {
            await expect(service.create({ servicioId: new ObjectId().toHexString(), horasEstimadas: 1 }, cliente)).rejects.toBeInstanceOf(BadRequestError);
        });

        it('rechaza una fecha preferida anterior a hoy (400)', async () => {
            await expect(pedir(servicioConOperario, { fechaPreferida: ayer })).rejects.toBeInstanceOf(BadRequestError);
            await expect(pedir(servicioConOperario, { fechaPreferida: manana })).resolves.toBeDefined();
        });

        it('un usuario sin ficha de cliente recibe 403', async () => {
            await expect(service.create({ servicioId: servicioConOperario._id.toHexString(), horasEstimadas: 1 }, { rol: 'cliente' })).rejects.toBeInstanceOf(ForbiddenError);
        });
    });

    describe('visibilidad', () => {
        it('una solicitud ajena es inexistente (404) para otro cliente', async () => {
            const s: any = await pedir();
            await expect(service.findOne(s._id.toHexString(), otroCliente)).rejects.toBeInstanceOf(NotFoundError);
            await expect(service.findOne(s._id.toHexString(), cliente)).resolves.toBeDefined();
        });

        it('el operario ve las de sus servicios y las sin responsable, no las de otro operario', async () => {
            const propia: any = await pedir(servicioConOperario);
            const libre: any = await pedir(servicioSinOperario);
            await expect(service.findOne(propia._id.toHexString(), operario)).resolves.toBeDefined();
            await expect(service.findOne(libre._id.toHexString(), otroOperario)).resolves.toBeDefined();
            await expect(service.findOne(propia._id.toHexString(), otroOperario)).rejects.toBeInstanceOf(NotFoundError);
        });

        it('el admin ve todas', async () => {
            const s: any = await pedir();
            await expect(service.findOne(s._id.toHexString(), admin)).resolves.toBeDefined();
        });
    });

    describe('aceptar', () => {
        it('el operario responsable acepta y queda asignado', async () => {
            const s: any = await pedir();
            const r: any = await service.aceptar(s._id.toHexString(), {}, operario);
            expect(r.estado).toBe('aceptada');
            expect(r.operario._id.equals(operarioId)).toBe(true);
            expect(r.fechaAceptacion).toBeInstanceOf(Date);
        });

        it('cualquier operario puede aceptar una solicitud sin responsable y queda a su nombre', async () => {
            const s: any = await pedir(servicioSinOperario);
            const r: any = await service.aceptar(s._id.toHexString(), {}, otroOperario);
            expect(r.operario._id.equals(otroOperarioId)).toBe(true);
        });

        it('un operario ajeno no puede aceptar la de otro (404)', async () => {
            const s: any = await pedir();
            await expect(service.aceptar(s._id.toHexString(), {}, otroOperario)).rejects.toBeInstanceOf(NotFoundError);
        });

        it('el admin sin operario asignado debe indicar uno (400)', async () => {
            const s: any = await pedir(servicioSinOperario);
            await expect(service.aceptar(s._id.toHexString(), {}, admin)).rejects.toBeInstanceOf(BadRequestError);
            const r: any = await service.aceptar(s._id.toHexString(), { operarioId: otroOperarioId.toHexString() }, admin);
            expect(r.operario._id.equals(otroOperarioId)).toBe(true);
        });

        it('no se puede aceptar dos veces (409)', async () => {
            const s: any = await pedir();
            await service.aceptar(s._id.toHexString(), {}, operario);
            await expect(service.aceptar(s._id.toHexString(), {}, operario)).rejects.toBeInstanceOf(ConflictError);
        });
    });

    describe('finalizar', () => {
        it('sin horasReales usa las estimadas y calcula el importe final', async () => {
            const s: any = await pedir();
            await service.aceptar(s._id.toHexString(), {}, operario);
            const r: any = await service.finalizar(s._id.toHexString(), {}, operario);
            expect(r.estado).toBe('finalizada');
            expect(r.horasReales).toBe(3);
            expect(r.importeFinal).toBe(300);
        });

        it('con horasReales recalcula el importe', async () => {
            const s: any = await pedir();
            await service.aceptar(s._id.toHexString(), {}, operario);
            const r: any = await service.finalizar(s._id.toHexString(), { horasReales: 4.5 }, operario);
            expect(r.importeFinal).toBe(450);
        });

        it('no se puede finalizar una pendiente (409)', async () => {
            const s: any = await pedir();
            await expect(service.finalizar(s._id.toHexString(), {}, operario)).rejects.toBeInstanceOf(ConflictError);
        });
    });

    describe('cancelar', () => {
        it('el cliente cancela su solicitud pendiente', async () => {
            const s: any = await pedir();
            const r: any = await service.cancelar(s._id.toHexString(), {}, cliente);
            expect(r.estado).toBe('cancelada');
            expect(r.fechaCancelacion).toBeInstanceOf(Date);
        });

        it('el cliente no puede cancelar una aceptada (409) ni una ajena (404)', async () => {
            const s: any = await pedir();
            await expect(service.cancelar(s._id.toHexString(), {}, otroCliente)).rejects.toBeInstanceOf(NotFoundError);
            await service.aceptar(s._id.toHexString(), {}, operario);
            await expect(service.cancelar(s._id.toHexString(), {}, cliente)).rejects.toBeInstanceOf(ConflictError);
        });

        it('el operario cancela una aceptada con motivo', async () => {
            const s: any = await pedir();
            await service.aceptar(s._id.toHexString(), {}, operario);
            const r: any = await service.cancelar(s._id.toHexString(), { motivo: 'Sin herramientas' }, operario);
            expect(r.estado).toBe('cancelada');
            expect(r.motivoCancelacion).toBe('Sin herramientas');
        });

        it('una finalizada o cancelada no se puede cancelar (409)', async () => {
            const s: any = await pedir();
            await service.cancelar(s._id.toHexString(), {}, admin);
            await expect(service.cancelar(s._id.toHexString(), {}, admin)).rejects.toBeInstanceOf(ConflictError);
        });
    });
});
