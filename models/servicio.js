const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    descripcion: {
        type: String,
        required: false,
    },
    importeHora: {
        type: Number,
        required: true,
    },
});

const Servicio = mongoose.model('Servicio', servicioSchema);

module.exports = servicio;
