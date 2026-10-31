import { ServicioRepository } from './servicio.repository.js';
import { OperarioRepository } from '../operario/operario.repository.js';
import { VentaRepository } from '../venta/venta.repository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../shared/errors.js';
import { parseId, toObjectId } from '../shared/utils/object-id.js';

export interface ServicioFiltros {
    descripcion?: string;
    operarioId?: string;
}

export class ServicioService {
    constructor(
        private readonly repository = new ServicioRepository(),
        private readonly operarioRepository = new OperarioRepository(),
        private readonly ventaRepository = new VentaRepository(),
    ) {}

    findAll(filtros: ServicioFiltros = {}) {
        const query: Record<string, unknown> = {};
        if (filtros.descripcion) query.descripcion = { $regex: filtros.descripcion, $options: 'i' };
        if (filtros.operarioId) query.operario = parseId(filtros.operarioId, 'operarioId');
        return this.repository.findAll(query);
    }

    async findOne(id: string) {
        const servicio = await this.repository.findOne({ _id: parseId(id) });
        if (!servicio) throw new NotFoundError('servicio no encontrado');
        return servicio;
    }

    async create(input: Record<string, unknown>) {
        return this.repository.add(await this.resolverOperario(input));
    }

    async update(id: string, input: Record<string, unknown>) {
        const servicio = await this.repository.update(parseId(id), await this.resolverOperario(input));
        if (!servicio) throw new NotFoundError('servicio no encontrado');
        return servicio;
    }

    async remove(id: string) {
        const servicioId = parseId(id);
        await this.findOne(id);
        if (await this.ventaRepository.hasServicio(servicioId)) {
            throw new ConflictError('No se puede eliminar el servicio porque está asociado a una venta');
        }
        await this.repository.delete({ _id: servicioId });
    }

    /** Convierte operarioId en la referencia al Operario responsable (null lo quita). */
    private async resolverOperario(input: Record<string, unknown>) {
        const { operarioId, ...data } = input;
        if (operarioId === undefined) return data;
        if (operarioId === null || operarioId === '') return { ...data, operario: null };

        const id = toObjectId(operarioId);
        if (!id) throw new BadRequestError('operarioId inválido');
        if (!(await this.operarioRepository.findOne({ _id: id }))) {
            throw new BadRequestError('El operario indicado no existe');
        }
        return { ...data, operario: id };
    }
}
