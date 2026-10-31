import { OperarioRepository } from './operario.repository.js';
import { ServicioRepository } from '../servicio/servicio.repository.js';
import { ConflictError, NotFoundError } from '../shared/errors.js';
import { parseId } from '../shared/utils/object-id.js';

export class OperarioService {
    constructor(
        private readonly repository = new OperarioRepository(),
        private readonly servicioRepository = new ServicioRepository(),
    ) {}

    findAll() {
        return this.repository.findAll();
    }

    async findOne(id: string) {
        const operario = await this.repository.findOne({ _id: parseId(id) });
        if (!operario) throw new NotFoundError('operario no encontrado');
        return operario;
    }

    create(input: Record<string, unknown>) {
        return this.repository.add(input);
    }

    async update(id: string, input: Record<string, unknown>) {
        const operario = await this.repository.update(parseId(id), input);
        if (!operario) throw new NotFoundError('operario no encontrado');
        return operario;
    }

    async remove(id: string) {
        const operarioId = parseId(id);
        if (await this.servicioRepository.count({ operario: operarioId })) {
            throw new ConflictError('No se puede eliminar el operario porque tiene servicios asignados');
        }
        const operario = await this.repository.delete({ _id: operarioId });
        if (!operario) throw new NotFoundError('operario no encontrado');
    }
}
