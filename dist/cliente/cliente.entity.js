// cliente.entity.ts o cliente.entity.js
import { Schema, model } from 'mongoose';
// Definir el esquema de Mongoose para Cliente
const clienteSchema = new Schema({
    nombre: String,
    apellido: String,
    dni: String,
    mail: String,
    telefono: String,
    direccion: String,
    razon_social: String,
    usuario: String,
    contraseña: String,
}, {
    timestamps: true, // Si quieres registrar las fechas de creación y actualización automáticamente
});
// Aquí exportas el modelo Cliente que se puede usar para crear instancias
export const Cliente = model('Cliente', clienteSchema);
//# sourceMappingURL=cliente.entity.js.map