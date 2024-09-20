import { ProductoRepository } from "./producto.repository.js";
import { Producto } from "./producto.entity.js";
import multer from 'multer';
const repository = new ProductoRepository();
const storage = multer.memoryStorage();
const upload = multer({ storage });
function uploadImage(req, res, next) {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(400).send({ message: 'Error uploading image', error: err });
        }
        next();
    });
}
function sanitizeProductoInput(req, res, next) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        importe_compra: req.body.importe_compra,
        importe_venta: req.body.importe_venta,
        stock: req.body.stock,
    };
    Object.keys(req.body.sanitizedInput).forEach((key) => {
        if (req.body.sanitizedInput[key] === undefined) {
            delete req.body.sanitizedInput[key];
        }
    });
    next();
}
async function findAll(req, res) {
    res.json({ data: await repository.findAll() });
}
async function findOne(req, res) {
    const id = req.params.id;
    const producto = await repository.findOne({ id });
    if (!producto) {
        return res.status(404).send({ message: 'Producto no encontrado' });
    }
    res.json({ data: producto });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    const productoInput = new Producto(input.nombre, input.descripcion, input.importe_compra, input.importe_venta, input.stock, input.imagen // Incluye imagen si existe
    );
    const producto = await repository.add(productoInput);
    return res.status(201).send({ message: 'Producto creado', data: producto });
}
async function update(req, res) {
    const producto = await repository.update(req.params.id, req.body.sanitizedInput);
    if (!producto) {
        return res.status(404).send({ message: 'producto not found' });
    }
    return res.status(200).send({ message: 'producto updated successfully', data: producto });
}
async function remove(req, res) {
    const id = req.params.id;
    const producto = await repository.delete({ id });
    if (!producto) {
        res.status(404).send({ message: 'Producto not found' });
    }
    else {
        res.status(200).send({ message: 'Producto deleted successfully' });
    }
}
export { sanitizeProductoInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=producto.controller.js.map