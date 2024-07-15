const mongoose = require('mongoose');

const operarioSchema = new mongoose.Schema({
    id: {
        type: Number,
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
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
});

const Operario = mongoose.model('Operario', operarioSchema);

module.exports = operario;