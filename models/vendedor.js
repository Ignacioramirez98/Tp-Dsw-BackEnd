const mongoose = require('mongoose');

const vendedorSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true,
    },
    apellido: {
        type: String,
        required: true,
    },
    mail: {
        type: String,
        required: true,
    },
    dni: {
        type: String,
        required: true,
    },
    telefono: {
        type: String,
        required: false,
    },
    rol: {
        type: String,
        required: true,
    },
});

const Vendedor = mongoose.model('Vendedor', vendedorSchema);

module.exports = vendedor;