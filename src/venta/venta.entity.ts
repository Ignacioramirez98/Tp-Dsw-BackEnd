import { ObjectId } from "mongodb";

// Asegúrate de tener definidos los modelos Producto y Servicio
import { Producto } from "../Producto/producto.entity.js";  // Ruta del archivo de Producto
import { Servicio } from "../servicio/servicio.entity.js";  // Ruta del archivo de Servicio

export class Venta {
  constructor(
    public estado: string,
    public fechaContacto: Date,
    public fechaDeVenta: Date,
    public fechaEntrega: Date,
    public fechaCancelacion: Date | undefined | null,
    public productos: Producto[],  // Colección de productos
    public servicios: Servicio[],  // Colección de servicios
    public _id?: ObjectId
  ) {}
}
