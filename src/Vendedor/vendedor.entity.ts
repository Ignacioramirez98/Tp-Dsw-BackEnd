import mongoose, { Schema, Document } from 'mongoose';

// Definimos la interfaz para los documentos de Vendedor
export interface IVendedor extends Document {
    nombre: string;
    apellido: string;
    mail: string;
    dni: string;
    telefono: string;
    rol: string;
    usuario: string;
    contraseña: string;
}

// Definimos el esquema de Mongoose
const VendedorSchema: Schema = new Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    mail: { type: String, required: true, unique: true },
    dni: { type: String, required: true, unique: true },
    telefono: { type: String, required: true },
    rol: { type: String, required: true },
    usuario: { type: String, required: true },
    contraseña: { type: String, required: true }
});

// Creamos y exportamos el modelo basado en el esquema
const Vendedor = mongoose.model<IVendedor>('Vendedor', VendedorSchema);
export default Vendedor;
