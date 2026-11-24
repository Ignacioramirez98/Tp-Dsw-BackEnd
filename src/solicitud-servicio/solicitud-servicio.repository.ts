import { ObjectId } from 'mongodb';
import { BaseRepository } from '../shared/base.repository.js';
import { SolicitudServicio } from './solicitud-servicio.entity.js';

export class SolicitudServicioRepository extends BaseRepository<SolicitudServicio> {
    protected readonly entity = SolicitudServicio;
    protected readonly populate = ['cliente', 'servicio', 'operario'];

    /** Igual que findAll, pero de la más nueva a la más vieja. */
    public override async findAll(filters: Record<string, unknown> = {}): Promise<SolicitudServicio[]> {
        return this.em.find(SolicitudServicio, filters, {
            populate: this.populate as any,
            orderBy: { fechaSolicitud: 'desc' },
        });
    }

    /** Guarda los cambios de la solicitud en un solo flush. */
    public async guardarCambios(solicitud: SolicitudServicio, data: Record<string, unknown>): Promise<void> {
        this.em.assign(solicitud, data);
        await this.em.flush();
    }

    public async hasCliente(clienteId: ObjectId): Promise<boolean> {
        return (await this.em.count(SolicitudServicio, { cliente: clienteId })) > 0;
    }

    public async hasServicio(servicioId: ObjectId): Promise<boolean> {
        return (await this.em.count(SolicitudServicio, { servicio: servicioId })) > 0;
    }

    public async hasOperario(operarioId: ObjectId): Promise<boolean> {
        return (await this.em.count(SolicitudServicio, { operario: operarioId })) > 0;
    }
}
