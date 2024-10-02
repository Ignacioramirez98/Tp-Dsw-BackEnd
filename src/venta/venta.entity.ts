import { ObjectId } from "mongodb";


export class Venta 
{
    constructor(
        public estado : string,
        public fechaContacto : Date,
        public fechaDeVenta : Date,
        public fechaEntrega : Date,
        public fechaCancelacion : Date,
        public cantidad: number,
        public _id?: ObjectId
    ){}
}