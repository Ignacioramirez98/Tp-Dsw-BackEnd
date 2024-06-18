const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    estado: {
        type: String,
        required: true,
    },
    fechaContrato: {
        type: Date,
        required: true,
    },
    fechaVenta: {
        type: Date,
        required: true,
    },
    fechaEntrega: {
        type: Date,
        required: true,
    },
    fechaCancelacion: {
        type: Date,
        required: true,
    },
    cantidad: {
    type: Number,
        required: true,
    },
});

const Venta = mongoose.model('Venta', ventaSchema);

module.exports = venta;
