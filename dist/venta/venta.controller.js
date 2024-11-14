import { VentaRepository } from "../venta/venta.repository.js";
import { Venta } from "../venta/venta.entity.js";
import { Producto } from "../Producto/producto.entity.js";
import { Servicio } from "../servicio/servicio.entity.js";
import { Cliente } from "../cliente/cliente.entity.js";
import { ObjectId } from "mongodb";
const repository = new VentaRepository();
// Función para sanitizar la entrada de datos de venta
function sanitizeVentaInput(req, res, next) {
    req.body.sanitizedInput = {
        estado: req.body.estado,
        fechaContacto: req.body.fechaContacto,
        fechaDeVenta: req.body.fechaDeVenta,
        fechaEntrega: req.body.fechaEntrega,
        fechaCancelacion: req.body.fechaCancelacion,
        cliente: req.body.cliente,
        productos: req.body.productos,
        servicios: req.body.servicios
    };
    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key];
        }
    });
    next();
}
// Función para validar y convertir el id en ObjectId
function validateAndConvertId(id) {
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
}
async function findAll(req, res) {
    res.json({ data: await repository.findAll() });
}
async function findOne(req, res) {
    const { id } = req.params;
    const ventaId = validateAndConvertId(id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    const venta = await repository.findOne({ _id: ventaId });
    if (!venta) {
        return res.status(404).send({ message: 'Venta no encontrada' });
    }
    res.json({ data: venta });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    const cliente = new Cliente(input.cliente.nombre, input.cliente.apellido, input.cliente.dni, input.cliente.email, input.cliente.telefono, input.cliente.direccion, input.cliente.razon_social, input.cliente.usuario, input.cliente.contraseña, input.cliente._id);
    const productos = (input.productos || []).map((p) => new Producto(p.nombre, p.descripcion, p.importe_compra, p.importe_venta, p.stock, p._id));
    const servicios = (input.servicios || []).map((s) => new Servicio(s.descripcion, s.importe_por_hora, s._id));
    const ventaInput = new Venta(input.estado, input.fechaContacto, input.fechaDeVenta, input.fechaEntrega, input.fechaCancelacion, cliente, productos, servicios);
    const venta = await repository.add(ventaInput);
    return res.status(201).send({ message: 'Venta creada', data: venta });
}
async function update(req, res) {
    const { id } = req.params;
    const ventaId = validateAndConvertId(id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    const input = req.body.sanitizedInput;
    const cliente = new Cliente(input.cliente.nombre, input.cliente.apellido, input.cliente.dni, input.cliente.email, input.cliente.telefono, input.cliente.direccion, input.cliente.razon_social, input.cliente.usuario, input.cliente.contraseña, input.cliente._id);
    const productos = (input.productos || []).map((p) => new Producto(p.nombre, p.descripcion, p.importe_compra, p.importe_venta, p.stock, p._id));
    const servicios = (input.servicios || []).map((s) => new Servicio(s.descripcion, s.importe_por_hora, s._id));
    const ventaInput = {
        ...input,
        productos,
        servicios
    };
    const venta = await repository.update(ventaId, ventaInput);
    if (!venta) {
        return res.status(404).send({ message: 'Venta no encontrada' });
    }
    return res.status(200).send({ message: 'Venta actualizada exitosamente', data: venta });
}
async function remove(req, res) {
    const { id } = req.params;
    const ventaId = validateAndConvertId(id);
    if (!ventaId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    const venta = await repository.delete({ _id: ventaId });
    if (!venta) {
        return res.status(404).send({ message: 'Venta no encontrada' });
    }
    return res.status(200).send({ message: 'Venta eliminada exitosamente' });
}
export { sanitizeVentaInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=venta.controller.js.map