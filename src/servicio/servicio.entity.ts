import { ObjectId } from "mongodb";

export class Servicio 
{
    constructor(
        public descripcion : string,
        public importe_por_hora : number,
        public _id?: ObjectId
    ){}
}