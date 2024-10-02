import { ObjectId } from "mongodb";

export class Operario 
{
    constructor(
        public nombre : string,
        public apellido : string,
        public mail : string,
        public dni : number,
        public telefono : string,
        public rol : string,
        public _id?: ObjectId
    ){}
}