import { z } from 'zod';
import { enteroNoNegativo, importe, importePositivo, texto } from './common.js';

export const createProductoSchema = z.object({
    nombre: texto('nombre', 150),
    descripcion: texto('descripcion', 1000),
    importe_compra: importe('importe_compra'),
    importe_venta: importePositivo('importe_venta'),
    stock: enteroNoNegativo('stock'),
});

export const updateProductoSchema = createProductoSchema.partial();
