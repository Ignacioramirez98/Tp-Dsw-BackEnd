import { BaseRepository } from '../shared/base.repository.js';
import { Vendedor } from './vendedor.entity.js';

export class VendedorRepository extends BaseRepository<Vendedor> {
    protected readonly entity = Vendedor;
}
