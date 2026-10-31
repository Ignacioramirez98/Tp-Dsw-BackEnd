import { z } from 'zod';
import { dni, email, objectIdOpcional, telefono, texto } from './common.js';

export const createClienteSchema = z.object({
    nombre: texto('nombre', 100),
    apellido: texto('apellido', 100),
    dni,
    mail: email,
    telefono,
    direccion: texto('direccion'),
    razon_social: z.string().trim().max(200).optional(),
    localidadId: objectIdOpcional('localidadId'),
});

export const updateClienteSchema = createClienteSchema.partial();

export type ClienteInput = z.infer<typeof createClienteSchema>;
