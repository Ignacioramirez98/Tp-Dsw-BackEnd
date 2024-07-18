import { ObjectId } from "mongodb";


export class Vendedor 
{
    constructor(
        public nombre : string,
        public apellido : string,
        public mail : string,
        public dni : string,
        public telefono : string,
        public rol: string,
        public _id?: ObjectId
    ){}
}

