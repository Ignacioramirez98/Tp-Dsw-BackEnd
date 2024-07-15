const mongoose = require('mongoose');

const localidadSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    nombre: {
        type: String,
        required: true,
    },
    cp: {
        type: String,
        required: true,
    },
});

const Localidad = mongoose.model('Localidad', localidadSchema);

module.exports = localidad;
