import { BaseRepository } from '../shared/base.repository.js';
import { Cliente } from './cliente.entity.js';

export class ClienteRepository extends BaseRepository<Cliente> {
    protected readonly entity = Cliente;
    protected readonly populate = ['localidad'];
}
