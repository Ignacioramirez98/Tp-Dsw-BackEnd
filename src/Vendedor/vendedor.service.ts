import { VendedorRepository } from './vendedor.repository.js';
import { VentaRepository } from '../venta/venta.repository.js';
import { ConflictError, NotFoundError } from '../shared/errors.js';
import { parseId } from '../shared/utils/object-id.js';

export class VendedorService {
    constructor(
        private readonly repository = new VendedorRepository(),
        private readonly ventaRepository = new VentaRepository(),
    ) {}

    findAll() {
        return this.repository.findAll();
    }

    async findOne(id: string) {
        const vendedor = await this.repository.findOne({ _id: parseId(id) });
        if (!vendedor) throw new NotFoundError('vendedor no encontrado');
        return vendedor;
    }

    create(input: Record<string, unknown>) {
        return this.repository.add(input);
    }

    async update(id: string, input: Record<string, unknown>) {
        const vendedor = await this.repository.update(parseId(id), input);
        if (!vendedor) throw new NotFoundError('vendedor no encontrado');
        return vendedor;
    }

    async remove(id: string) {
        const vendedorId = parseId(id);
        if (await this.ventaRepository.hasVendedor(vendedorId)) {
            throw new ConflictError('No se puede eliminar el vendedor porque tiene ventas asociadas');
        }
        const vendedor = await this.repository.delete({ _id: vendedorId });
        if (!vendedor) throw new NotFoundError('vendedor no encontrado');
    }
}
