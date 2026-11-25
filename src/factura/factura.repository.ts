import { ObjectId } from 'mongodb';
import type { MongoConnection } from '@mikro-orm/mongodb';
import { BaseRepository } from '../shared/base.repository.js';
import { ConflictError } from '../shared/errors.js';
import { Venta } from '../venta/venta.entity.js';
import { Factura } from './factura.entity.js';
import { formatearNumero, type Comprobante } from './factura.calculo.js';

/** Datos propios de la emisión, además del contenido del comprobante. */
export interface DatosFactura extends Comprobante {
    emitidaPor: string;
    fechaEmision: Date;
}

export class FacturaRepository extends BaseRepository<Factura> {
    protected readonly entity = Factura;

    /** Igual que findAll, pero de la más nueva a la más vieja. */
    public override async findAll(filters: Record<string, unknown> = {}): Promise<Factura[]> {
        return this.em.find(Factura, filters, { orderBy: { fechaEmision: 'desc', numero: 'desc' } });
    }

    public async findByVenta(ventaId: ObjectId): Promise<Factura | undefined> {
        return (await this.em.findOne(Factura, { venta: ventaId })) ?? undefined;
    }

    /**
     * Emite la factura y deja la venta facturada.
     * Primero "reclama" la venta con una actualización atómica condicionada a que siga concretada:
     * si dos personas facturan a la vez, solo una lo logra y la otra recibe 409.
     * Si después falla el guardado de la factura, la venta vuelve a concretada.
     */
    public async emitir(datos: DatosFactura, venta: Venta): Promise<Factura> {
        const reclamadas = await this.em.nativeUpdate(Venta, { _id: venta._id, estado: 'concretada' } as any, { estado: 'facturada' });
        if (reclamadas === 0) throw new ConflictError('La venta ya fue facturada o dejó de estar concretada');

        try {
            const numero = await this.siguienteNumero();
            venta.estado = 'facturada';
            const factura = this.em.create(Factura, { ...datos, numero, venta, cliente: venta.cliente } as any);
            await this.em.flush();
            return factura;
        } catch (error) {
            await this.em.nativeUpdate(Venta, { _id: venta._id } as any, { estado: 'concretada' });
            venta.estado = 'concretada';
            throw error;
        }
    }

    /** Próximo número correlativo, con un contador atómico en la base (dos facturas nunca repiten número). */
    private async siguienteNumero(): Promise<string> {
        const contadores = (this.em.getConnection() as MongoConnection).getCollection<{ _id: string; secuencia: number }>('contadores');
        const resultado: any = await contadores.findOneAndUpdate(
            { _id: 'factura' },
            { $inc: { secuencia: 1 } },
            { upsert: true, returnDocument: 'after' },
        );
        // Según la versión del driver devuelve el documento o { value: documento }
        const secuencia = (resultado?.value ?? resultado)?.secuencia;
        if (typeof secuencia !== 'number') throw new Error('No se pudo obtener el número de factura');
        return formatearNumero(secuencia);
    }
}
