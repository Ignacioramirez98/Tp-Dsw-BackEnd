import { ObjectId } from 'mongodb';
import { VentaRepository, ItemVentaInput } from './venta.repository.js';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { VendedorRepository } from '../Vendedor/vendedor.repository.js';
import { ProductoRepository } from '../producto/producto.repository.js';
import { ServicioRepository } from '../servicio/servicio.repository.js';
import { BadRequestError, NotFoundError } from '../shared/errors.js';
import { parseId, toObjectId } from '../shared/utils/object-id.js';

export interface VentaFiltros {
    estado?: string;
    clienteId?: string;
    vendedorId?: string;
}

const CAMPOS_SIMPLES = ['estado', 'fechaContacto', 'fechaDeVenta', 'fechaEntrega', 'fechaCancelacion'];

export class VentaService {
    constructor(
        private readonly repository = new VentaRepository(),
        private readonly clienteRepository = new ClienteRepository(),
        private readonly vendedorRepository = new VendedorRepository(),
        private readonly productoRepository = new ProductoRepository(),
        private readonly servicioRepository = new ServicioRepository(),
    ) {}

    findAll(filtros: VentaFiltros = {}) {
        const query: Record<string, unknown> = {};
        if (filtros.estado) query.estado = filtros.estado;
        if (filtros.clienteId) query.cliente = parseId(filtros.clienteId, 'clienteId');
        if (filtros.vendedorId) query.vendedor = parseId(filtros.vendedorId, 'vendedorId');
        return this.repository.findAll(query);
    }

    async findOne(id: string) {
        const venta = await this.repository.findOne({ _id: parseId(id) });
        if (!venta) throw new NotFoundError('Venta no encontrada');
        return venta;
    }

    async create(input: Record<string, any>) {
        if (!input.clienteId) throw new BadRequestError('clienteId es obligatorio');

        const { data, items } = await this.resolverRelaciones(input);
        data.estado ??= 'pendiente';
        data.fechaContacto ??= new Date();

        const creada = await this.repository.addConItems(data, items ?? []);
        return this.findOne(creada._id.toHexString());
    }

    async update(id: string, input: Record<string, any>) {
        const ventaId = parseId(id);
        const { data, items } = await this.resolverRelaciones(input);

        const actualizada = await this.repository.updateConItems(ventaId, data, items);
        if (!actualizada) throw new NotFoundError('Venta no encontrada');
        return this.findOne(id);
    }

    async remove(id: string) {
        const venta = await this.repository.delete({ _id: parseId(id) });
        if (!venta) throw new NotFoundError('Venta no encontrada');
    }

    /** Traduce los ids recibidos en referencias válidas; lanza 400 si algo no existe. */
    private async resolverRelaciones(input: Record<string, any>) {
        const data: Record<string, any> = {};
        let items: ItemVentaInput[] | undefined;

        for (const campo of CAMPOS_SIMPLES) {
            if (campo in input) data[campo] = input[campo];
        }

        if ('clienteId' in input) {
            const id = parseId(input.clienteId, 'clienteId');
            if (!(await this.clienteRepository.findOne({ _id: id }))) throw new BadRequestError('El cliente indicado no existe');
            data.cliente = id;
        }

        if ('vendedorId' in input) {
            if (input.vendedorId === null || input.vendedorId === '') {
                data.vendedor = null;
            } else {
                const id = parseId(input.vendedorId, 'vendedorId');
                if (!(await this.vendedorRepository.findOne({ _id: id }))) throw new BadRequestError('El vendedor indicado no existe');
                data.vendedor = id;
            }
        }

        // items: [{ productoId, cantidad }]. También se acepta productoIds (formato anterior, cantidad 1)
        const itemsInput: { productoId: unknown; cantidad?: unknown }[] | undefined =
            input.items ?? (Array.isArray(input.productoIds)
                ? input.productoIds.map((productoId: unknown) => ({ productoId, cantidad: 1 }))
                : undefined);

        if (itemsInput !== undefined) {
            if (!Array.isArray(itemsInput)) throw new BadRequestError('items debe ser una lista');
            items = [];
            for (const item of itemsInput) {
                const productoId = toObjectId(item?.productoId);
                const cantidad = Number(item?.cantidad);
                if (!productoId) throw new BadRequestError('productoId inválido en items');
                if (!Number.isInteger(cantidad) || cantidad < 1) {
                    throw new BadRequestError('La cantidad de cada ítem debe ser un entero mayor a 0');
                }

                const producto = await this.productoRepository.findOne({ _id: productoId });
                if (!producto) throw new BadRequestError(`El producto ${productoId.toHexString()} no existe`);

                items.push({ producto: productoId, cantidad, precioUnitario: producto.importe_venta });
            }
        }

        if ('servicioIds' in input) {
            if (!Array.isArray(input.servicioIds)) throw new BadRequestError('servicioIds debe ser una lista');
            const ids: ObjectId[] = [];
            for (const raw of input.servicioIds) {
                const id = parseId(raw, 'servicioId');
                if (!(await this.servicioRepository.findOne({ _id: id }))) {
                    throw new BadRequestError(`El servicio ${id.toHexString()} no existe`);
                }
                ids.push(id);
            }
            data.servicios = ids;
        }

        return { data, items };
    }
}
