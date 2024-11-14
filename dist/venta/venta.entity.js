export class Venta {
    constructor(estado, fechaContacto, fechaDeVenta, fechaEntrega, fechaCancelacion, cliente, productos, // Colección de productos
    servicios, // Colección de servicios
    _id) {
        this.estado = estado;
        this.fechaContacto = fechaContacto;
        this.fechaDeVenta = fechaDeVenta;
        this.fechaEntrega = fechaEntrega;
        this.fechaCancelacion = fechaCancelacion;
        this.cliente = cliente;
        this.productos = productos;
        this.servicios = servicios;
        this._id = _id;
    }
}
//# sourceMappingURL=venta.entity.js.map