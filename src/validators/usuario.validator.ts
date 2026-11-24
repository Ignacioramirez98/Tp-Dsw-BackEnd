import { z } from 'zod';

const usuario = z.string({ required_error: 'usuario es obligatorio', invalid_type_error: 'usuario debe ser texto' })
    .trim()
    .min(3, 'Usuario debe tener al menos 3 caracteres')
    .max(50, 'Usuario no puede exceder 50 caracteres');

const contraseña = z.string({ required_error: 'contraseña es obligatoria', invalid_type_error: 'contraseña debe ser texto' })
    .min(6, 'Contraseña debe tener al menos 6 caracteres')
    .max(100, 'Contraseña no puede exceder 100 caracteres');

const objectIdOpcional = z.string().regex(/^[0-9a-fA-F]{24}$/, 'id inválido').optional();

export const loginSchema = z.object({ usuario, contraseña });

export const crearUsuarioSchema = z.object({
    usuario,
    contraseña,
    rol: z.enum(['cliente', 'vendedor', 'operario', 'admin'], { errorMap: () => ({ message: 'rol debe ser cliente, vendedor u operario' }) })
        .refine((rol) => rol !== 'admin', 'Los admins no pueden crearse por API'),
    clienteId: objectIdOpcional,
    vendedorId: objectIdOpcional,
    operarioId: objectIdOpcional,
});

/** Datos editables de un usuario. Cambiar el rol exige indicar el perfil vinculado que le corresponde. */
export const actualizarUsuarioSchema = z.object({
    usuario: usuario.optional(),
    contraseña: contraseña.optional(),
    rol: z.enum(['cliente', 'vendedor', 'operario', 'admin'], { errorMap: () => ({ message: 'rol debe ser cliente, vendedor u operario' }) })
        .refine((rol) => rol !== 'admin', 'Los admins no pueden crearse por API')
        .optional(),
    activo: z.boolean({ invalid_type_error: 'activo debe ser verdadero o falso' }).optional(),
    clienteId: objectIdOpcional,
    vendedorId: objectIdOpcional,
    operarioId: objectIdOpcional,
}).refine((datos) => Object.values(datos).some((valor) => valor !== undefined), 'No hay datos para actualizar');

export type LoginInput = z.infer<typeof loginSchema>;
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
