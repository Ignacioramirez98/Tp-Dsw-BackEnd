import { z } from 'zod';
import { dni, email, telefono, texto } from './common.js';

const persona = {
    nombre: texto('nombre', 100),
    apellido: texto('apellido', 100),
    mail: email,
    dni,
    telefono,
};

export const createOperarioSchema = z.object(persona);
export const updateOperarioSchema = createOperarioSchema.partial();

export const createVendedorSchema = z.object({
    ...persona,
    rol: z.string().trim().min(1).max(50).default('vendedor'),
});
export const updateVendedorSchema = z.object(persona).extend({ rol: z.string().trim().min(1).max(50) }).partial();
