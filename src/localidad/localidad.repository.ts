import { BaseRepository } from '../shared/base.repository.js';
import { Localidad } from './localidad.entity.js';

export class LocalidadRepository extends BaseRepository<Localidad> {
    protected readonly entity = Localidad;
}
