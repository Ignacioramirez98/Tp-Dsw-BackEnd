const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: false,
    },
    importe_compra: {
        type: Number,
        required: true,
    },
    importe_venta: {
        type: Number,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
});

const Producto = mongoose.model('Producto', productoSchema);

module.exports = Producto;
