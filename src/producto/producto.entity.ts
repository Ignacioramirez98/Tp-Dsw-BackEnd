import { ObjectId } from "mongodb";
import crypto from 'node:crypto'

export class Producto 
{
    constructor(
        public nombre : string,
        public descripcion : string,
        public importe_compra : number,
        public importe_venta : number,
        public stock : number,
        public _id?: ObjectId
    ){}
}
