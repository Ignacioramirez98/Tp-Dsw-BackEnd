import { ObjectId } from "mongodb";

export class Cliente {
    constructor(
        public nombre: string,
        public apellido: string,
        public dni: string,
        public mail: string,
        public telefono: string,
        public direccion: string,
        public razon_social: string,
        public _id?: ObjectId
    ) { }
}
