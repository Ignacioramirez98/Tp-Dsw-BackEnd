import { z } from 'zod';

export const createClienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  dni: z.string().min(7, 'DNI inválido (mínimo 7 caracteres)'),
  mail: z.string().email('Email inválido'),
  telefono: z.string().min(8, 'Teléfono inválido (mínimo 8 caracteres)'),
  direccion: z.string().min(1, 'Dirección requerida'),
  razon_social: z.string().optional()
});

export type ClienteInput = z.infer<typeof createClienteSchema>;
