import type { FilterQuery } from '@mikro-orm/core';
import type { ObjectId } from 'mongodb';
import { BaseRepository } from '../shared/base.repository.js';
import { Usuario } from './usuario.entity.js';

/** Campos de Usuario que apuntan a un perfil de negocio. */
export type CampoPerfil = 'cliente' | 'vendedor' | 'operario';

export class UsuarioRepository extends BaseRepository<Usuario> {
    protected readonly entity = Usuario;

    public async findByUsuario(usuario: string): Promise<Usuario | undefined> {
        const result = await this.em.findOne(Usuario, { usuario });
        return result ?? undefined;
    }

    /** Usuario vinculado a un perfil (cliente, vendedor u operario), si existe. */
    public async findByPerfil(campo: CampoPerfil, perfilId: ObjectId): Promise<Usuario | undefined> {
        const result = await this.em.findOne(Usuario, { [campo]: perfilId } as FilterQuery<Usuario>);
        return result ?? undefined;
    }

    /**
     * Cuando se elimina un perfil, su usuario ya no puede entrar: queda desactivado
     * y sin vínculo (así después se puede eliminar sin conflicto).
     */
    public async desactivarYDesvincular(campo: CampoPerfil, perfilId: ObjectId): Promise<void> {
        const usuarios = await this.em.find(Usuario, { [campo]: perfilId } as FilterQuery<Usuario>);
        for (const usuario of usuarios) {
            usuario.activo = false;
            usuario[campo] = null;
        }
        await this.em.flush();
    }
}
