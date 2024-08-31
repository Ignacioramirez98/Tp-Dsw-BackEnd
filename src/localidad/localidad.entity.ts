import { ObjectId } from "mongodb";

export class Localidad {
    constructor(
        public nombre: string,
        public codigo_postal: string,
        public _id?: ObjectId
    ) { }
}
