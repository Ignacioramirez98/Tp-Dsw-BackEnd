import { BaseRepository } from '../shared/base.repository.js';
import { Operario } from './operario.entity.js';

export class OperarioRepository extends BaseRepository<Operario> {
    protected readonly entity = Operario;
}
