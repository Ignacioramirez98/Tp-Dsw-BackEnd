import { FacturaRepository } from './factura.repository.js';
import { VentaRepository } from '../venta/venta.repository.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../shared/errors.js';
import { motivoRechazo, puedePasar } from '../venta/venta.estados.js';
import type { AuthUser } from '../middleware/roleAuth.middleware.js';
import { parseId, toObjectId } from '../shared/utils/object-id.js';
import { UN_DIA_MS, leerFecha } from '../shared/utils/fechas.js';
import { BadRequestError } from '../shared/errors.js';
import { armarComprobante } from './factura.calculo.js';

export interface FacturaFiltros {
    clienteId?: string;
    /** Rango de fecha de emisión, en formato AAAA-MM-DD; ambos extremos incluidos. */
    desde?: string;
    hasta?: string;
}

/** Quién hace la petición (null en usos internos/tests: sin restricciones). */
export type ActorFactura = Partial<Pick<AuthUser, 'rol' | 'usuario' | 'clienteId'>> | null | undefined;

export class FacturaService {
    constructor(
        private readonly repository = new FacturaRepository(),
        private readonly ventaRepository = new VentaRepository(),
    ) {}

    async findAll(filtros: FacturaFiltros = {}, actor?: ActorFactura) {
        const query: Record<string, unknown> = {};
        if (filtros.clienteId) query.cliente = parseId(filtros.clienteId, 'clienteId');
        if (filtros.desde || filtros.hasta) {
            const rango: Record<string, Date> = {};
            if (filtros.desde) rango.$gte = this.fecha(filtros.desde, 'desde');
            // "hasta" incluye todo ese día: se toma el inicio del día siguiente como límite exclusivo
            if (filtros.hasta) rango.$lt = new Date(this.fecha(filtros.hasta, 'hasta').getTime() + UN_DIA_MS);
            if (rango.$gte && rango.$lt && rango.$gte >= rango.$lt) {
                throw new BadRequestError('La fecha "desde" no puede ser posterior a "hasta"');
            }
            query.fechaEmision = rango;
        }

        // Un cliente solo ve sus propias facturas, filtre lo que filtre
        if (actor?.rol === 'cliente') query.cliente = this.clienteDelActor(actor);

        return this.repository.findAll(query);
    }

    async findOne(id: string, actor?: ActorFactura) {
        const factura = await this.repository.findOne({ _id: parseId(id) });
        return this.visiblePara(factura, actor);
    }

    /** La factura de una venta (404 si la venta todavía no se facturó). */
    async findByVenta(ventaId: string, actor?: ActorFactura) {
        const factura = await this.repository.findByVenta(parseId(ventaId, 'ventaId'));
        return this.visiblePara(factura, actor);
    }

    /**
     * CUU Realizar facturación: emite la factura de una venta concretada.
     * La venta pasa a facturada (ya no se puede cancelar). Si algo falla, no cambia nada.
     */
    async facturar(ventaId: string, actor?: ActorFactura) {
        const venta = await this.ventaRepository.findParaGestionar(parseId(ventaId));
        if (!venta) throw new NotFoundError('Venta no encontrada');

        if (venta.estado === 'facturada' || (await this.repository.findByVenta(venta._id))) {
            throw new ConflictError('La venta ya está facturada');
        }
        if (!puedePasar(venta.estado, 'facturada')) throw new ConflictError(motivoRechazo(venta.estado, 'facturada'));
        if (Array.from(venta.items).length === 0) {
            throw new ConflictError('La venta no tiene productos para facturar (los servicios se cotizan por hora)');
        }

        return this.repository.emitir(
            { ...armarComprobante(venta), emitidaPor: actor?.usuario ?? 'sistema', fechaEmision: new Date() },
            venta,
        );
    }

    /** A un cliente, una factura ajena se le informa como inexistente (no revela que existe). */
    private visiblePara<T extends { cliente: { _id: any } }>(factura: T | undefined, actor?: ActorFactura): T {
        if (!factura || (actor?.rol === 'cliente' && !factura.cliente._id.equals(this.clienteDelActor(actor)))) {
            throw new NotFoundError('Factura no encontrada');
        }
        return factura;
    }

    /** clienteId del usuario cliente logueado (403 si su usuario no tiene ficha de cliente). */
    private clienteDelActor(actor: NonNullable<ActorFactura>) {
        const id = toObjectId(actor.clienteId);
        if (!id) throw new ForbiddenError('Tu usuario no tiene una ficha de cliente asociada');
        return id;
    }

    private fecha(valor: string, campo: string): Date {
        const fecha = leerFecha(valor);
        if (Number.isNaN(fecha.getTime())) throw new BadRequestError(`${campo} no es una fecha válida (usá AAAA-MM-DD)`);
        return fecha;
    }
}
