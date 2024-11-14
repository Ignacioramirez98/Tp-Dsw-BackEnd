import { ObjectId } from "mongodb";
import { Producto } from "../Producto/producto.entity.js";
import { Servicio } from "../servicio/servicio.entity.js";  
import { Cliente } from "../cliente/cliente.entity.js";  
export class Venta {
  constructor(
    public estado: string,
    public fechaContacto: Date,
    public fechaDeVenta: Date,
    public fechaEntrega: Date,
    public fechaCancelacion: Date | undefined | null,
    public cliente: Cliente,
    public productos: Producto[],  // Colección de productos
    public servicios: Servicio[],  // Colección de servicios
    public _id?: ObjectId
  ) {}
}
