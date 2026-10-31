import { BaseRepository } from '../shared/base.repository.js';
import { Servicio } from './servicio.entity.js';

export class ServicioRepository extends BaseRepository<Servicio> {
    protected readonly entity = Servicio;
    protected readonly populate = ['operario'];
}
