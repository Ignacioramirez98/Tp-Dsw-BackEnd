import { ObjectId } from "mongodb";

export class Producto {
    constructor(
        public nombre: string,
        public descripcion: string,
        public importe_compra: number,
        public importe_venta: number,
        public stock: number,
        public imagen?: {
            data: Buffer;       // Datos binarios de la imagen
            contentType: string; // Tipo MIME de la imagen (ejemplo: image/jpeg)
        },
        public _id?: ObjectId
    ) {}
}