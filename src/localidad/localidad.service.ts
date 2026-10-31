import { LocalidadRepository } from './localidad.repository.js';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { ConflictError, NotFoundError } from '../shared/errors.js';
import { parseId } from '../shared/utils/object-id.js';

export class LocalidadService {
    constructor(
        private readonly repository = new LocalidadRepository(),
        private readonly clienteRepository = new ClienteRepository(),
    ) {}

    findAll() {
        return this.repository.findAll();
    }

    async findOne(id: string) {
        const localidad = await this.repository.findOne({ _id: parseId(id) });
        if (!localidad) throw new NotFoundError('localidad no encontrada');
        return localidad;
    }

    create(input: Record<string, unknown>) {
        return this.repository.add(input);
    }

    async update(id: string, input: Record<string, unknown>) {
        const localidad = await this.repository.update(parseId(id), input);
        if (!localidad) throw new NotFoundError('localidad no encontrada');
        return localidad;
    }

    async remove(id: string) {
        const localidadId = parseId(id);
        if (await this.clienteRepository.count({ localidad: localidadId })) {
            throw new ConflictError('No se puede eliminar la localidad porque tiene clientes asociados');
        }
        const localidad = await this.repository.delete({ _id: localidadId });
        if (!localidad) throw new NotFoundError('localidad no encontrada');
    }
}
