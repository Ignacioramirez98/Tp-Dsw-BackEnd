import { BaseRepository } from '../shared/base.repository.js';
import { Usuario } from './usuario.entity.js';

export class UsuarioRepository extends BaseRepository<Usuario> {
    protected readonly entity = Usuario;

    public async findByUsuario(usuario: string): Promise<Usuario | undefined> {
        const result = await this.em.findOne(Usuario, { usuario });
        return result ?? undefined;
    }
}
