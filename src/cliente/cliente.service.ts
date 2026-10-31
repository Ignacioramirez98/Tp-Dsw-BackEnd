import { ClienteRepository } from './cliente.repository.js';
import { LocalidadRepository } from '../localidad/localidad.repository.js';
import { VentaRepository } from '../venta/venta.repository.js';
import { createClienteSchema } from '../validators/cliente.validator.js';
import { BadRequestError, ConflictError, NotFoundError } from '../shared/errors.js';
import { parseId, toObjectId } from '../shared/utils/object-id.js';

export interface ClienteFiltros {
    nombre?: string;
    apellido?: string;
    dni?: string;
    localidadId?: string;
}

export class ClienteService {
    constructor(
        private readonly repository = new ClienteRepository(),
        private readonly localidadRepository = new LocalidadRepository(),
        private readonly ventaRepository = new VentaRepository(),
    ) {}

    findAll(filtros: ClienteFiltros = {}) {
        const query: Record<string, unknown> = {};
        if (filtros.nombre) query.nombre = { $regex: filtros.nombre, $options: 'i' };
        if (filtros.apellido) query.apellido = { $regex: filtros.apellido, $options: 'i' };
        if (filtros.dni) query.dni = filtros.dni;
        if (filtros.localidadId) query.localidad = parseId(filtros.localidadId, 'localidadId');
        return this.repository.findAll(query);
    }

    async findOne(id: string) {
        const cliente = await this.repository.findOne({ _id: parseId(id) });
        if (!cliente) throw new NotFoundError('cliente no encontrado');
        return cliente;
    }

    async create(input: Record<string, unknown>) {
        const validated = createClienteSchema.parse(input); // ZodError -> 400
        const data = await this.resolverLocalidad({ ...validated, razon_social: validated.razon_social || '' });
        return this.repository.add(data);
    }

    async update(id: string, input: Record<string, unknown>) {
        const cliente = await this.repository.update(parseId(id), await this.resolverLocalidad(input));
        if (!cliente) throw new NotFoundError('cliente no encontrado');
        return cliente;
    }

    async remove(id: string) {
        const clienteId = parseId(id);
        if (await this.ventaRepository.hasCliente(clienteId)) {
            throw new ConflictError('No se puede eliminar el cliente porque tiene ventas asociadas');
        }
        const cliente = await this.repository.delete({ _id: clienteId });
        if (!cliente) throw new NotFoundError('cliente no encontrado');
    }

    /** Convierte localidadId en la referencia a Localidad (null la quita). */
    private async resolverLocalidad(input: Record<string, unknown>) {
        const { localidadId, ...data } = input;
        if (localidadId === undefined) return data;
        if (localidadId === null || localidadId === '') return { ...data, localidad: null };

        const id = toObjectId(localidadId);
        if (!id) throw new BadRequestError('localidadId inválido');
        if (!(await this.localidadRepository.findOne({ _id: id }))) {
            throw new BadRequestError('La localidad indicada no existe');
        }
        return { ...data, localidad: id };
    }
}
