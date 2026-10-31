import { BaseRepository } from '../shared/base.repository.js';
import { Producto } from './producto.entity.js';

export class ProductoRepository extends BaseRepository<Producto> {
    protected readonly entity = Producto;
}
