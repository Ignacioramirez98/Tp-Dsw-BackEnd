import { z } from 'zod';
import { importePositivo, objectIdOpcional, texto } from './common.js';

export const createServicioSchema = z.object({
    descripcion: texto('descripcion', 1000),
    importe_por_hora: importePositivo('importe_por_hora'),
    operarioId: objectIdOpcional('operarioId'),
});

export const updateServicioSchema = createServicioSchema.partial();
