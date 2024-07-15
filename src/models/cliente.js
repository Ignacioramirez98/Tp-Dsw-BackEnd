const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    nombre: {
        type: String,
        required: false,
    },
    apellido: {
        type: String,
        required: false,
    },
    razonSocial: {
        type: String,
        required: true,
    },
    dni: {
        type: String,
        required: false,
    },
    cuil: {
        type: String,
        required: true,
    },
    mail: {
        type: String,
        required: true,
    },
    telefono: {
        type: String,
        required: true,
    },
    direccion: {
        type: String,
        required: true,
    },
});

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = cliente;
