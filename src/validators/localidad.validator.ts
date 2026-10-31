import { z } from 'zod';
import { comoTexto, texto } from './common.js';

export const createLocalidadSchema = z.object({
    nombre: texto('nombre', 100),
    // Código postal: 4 dígitos (2000) o CPA de 8 caracteres (S2000ABC)
    codigo_postal: comoTexto('codigo_postal')
        .pipe(z.string().regex(/^([A-Za-z]\d{4}[A-Za-z]{3}|\d{4})$/, 'codigo_postal debe tener 4 dígitos (2000) o formato CPA (S2000ABC)')),
});

export const updateLocalidadSchema = createLocalidadSchema.partial();
