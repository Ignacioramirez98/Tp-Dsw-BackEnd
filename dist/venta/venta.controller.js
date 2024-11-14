import { VentaRepository } from "../venta/venta.repository.js";
import { Venta } from "../venta/venta.entity.js";
import { Producto } from "../Producto/producto.entity.js";
import { Servicio } from "../servicio/servicio.entity.js";
import { ObjectId } from "mongodb"; // Importar ObjectId para la validación
const repository = new VentaRepository();
// Función para sanitizar la entrada de datos de venta
function sanitizeVentaInput(req, res, next) {
    req.body.sanitizedInput = {
        estado: req.body.estado,
        fechaContacto: req.body.fechaContacto,
        fechaDeVenta: req.body.fechaDeVenta,
        fechaEntrega: req.body.fechaEntrega,
        fechaCancelacion: req.body.fechaCancelacion,
        productos: req.body.productos,
        servicios: req.body.servicios // Espera un array de servicios
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
    // Mapear arrays de productos y servicios a instancias de Producto y Servicio
    const productos = (input.productos || []).map((p) => new Producto(p.nombre, p.descripcion, p.importe_compra, p.importe_venta, p.stock, p._id));
    const servicios = (input.servicios || []).map((s) => new Servicio(s.descripcion, s.importe_por_hora, s._id));
    const ventaInput = new Venta(input.estado, input.fechaContacto, input.fechaDeVenta, input.fechaEntrega, input.fechaCancelacion, productos, servicios);
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