import { z } from 'zod';

export const loginSchema = z.object({
    usuario: z.string()
        .min(3, 'Usuario debe tener al menos 3 caracteres')
        .max(50, 'Usuario no puede exceder 50 caracteres'),
    contraseña: z.string()
        .min(6, 'Contraseña debe tener al menos 6 caracteres')
        .max(100, 'Contraseña no puede exceder 100 caracteres')
});

export const crearUsuarioSchema = z.object({
    usuario: z.string()
        .min(3, 'Usuario debe tener al menos 3 caracteres')
        .max(50, 'Usuario no puede exceder 50 caracteres'),
    contraseña: z.string()
        .min(6, 'Contraseña debe tener al menos 6 caracteres')
        .max(100, 'Contraseña no puede exceder 100 caracteres'),
    rol: z.enum(['cliente', 'vendedor', 'operario', 'admin'])
        .refine(rol => rol !== 'admin', 'Los admins no pueden crearse por API'),
    clienteId: z.string().optional(),
    vendedorId: z.string().optional(),
    operarioId: z.string().optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
