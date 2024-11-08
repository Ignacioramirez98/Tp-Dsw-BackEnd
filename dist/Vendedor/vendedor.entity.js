import mongoose, { Schema } from 'mongoose';
// Definimos el esquema de Mongoose
const VendedorSchema = new Schema({
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
const Vendedor = mongoose.model('Vendedor', VendedorSchema);
export default Vendedor;
//# sourceMappingURL=vendedor.entity.js.map