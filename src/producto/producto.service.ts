import { ProductoRepository } from './producto.repository.js';
import { VentaRepository } from '../venta/venta.repository.js';
import { ConflictError, NotFoundError } from '../shared/errors.js';
import { parseId } from '../shared/utils/object-id.js';

export interface ProductoFiltros {
    nombre?: string;
    descripcion?: string;
}

export class ProductoService {
    constructor(
        private readonly repository = new ProductoRepository(),
        private readonly ventaRepository = new VentaRepository(),
    ) {}

    findAll(filtros: ProductoFiltros = {}) {
        const query: Record<string, unknown> = {};
        if (filtros.nombre) query.nombre = { $regex: filtros.nombre, $options: 'i' };
        if (filtros.descripcion) query.descripcion = { $regex: filtros.descripcion, $options: 'i' };
        return this.repository.findAll(query);
    }

    async findOne(id: string) {
        const producto = await this.repository.findOne({ _id: parseId(id) });
        if (!producto) throw new NotFoundError('Producto no encontrado');
        return producto;
    }

    create(input: Record<string, unknown>) {
        return this.repository.add(input);
    }

    async update(id: string, input: Record<string, unknown>) {
        const producto = await this.repository.update(parseId(id), input);
        if (!producto) throw new NotFoundError('Producto no encontrado');
        return producto;
    }

    async remove(id: string) {
        const productoId = parseId(id);
        await this.findOne(id);
        if (await this.ventaRepository.hasProducto(productoId)) {
            throw new ConflictError('No se puede eliminar el producto porque está asociado a una venta');
        }
        await this.repository.delete({ _id: productoId });
    }
}
