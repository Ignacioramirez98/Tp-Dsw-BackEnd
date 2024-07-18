import { VendedorRepository } from "./vendedor.repository.js";
import { Vendedor } from "./vendedor.entity.js";
const repository = new VendedorRepository();
function sanitizeVendedorInput(req, res, next) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        mail: req.body.mail,
        dni: req.body.dni,
        telefono: req.body.telefono,
        rol: req.body.rol,
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
    const vendedor = await repository.findOne({ id });
    if (!vendedor) {
        return res.status(404).send({ message: 'Vendedor no encontrado' });
    }
    res.json({ data: vendedor });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    const vendedorInput = new Vendedor(input.nombre, input.apellido, input.mail, input.dni, input.telefono, input.rol);
    const vendedor = await repository.add(vendedorInput);
    return res.status(201).send({ message: 'Vendedor creado', data: vendedor });
}
async function update(req, res) {
    const vendedor = await repository.update(req.params.id, req.body.sanitizedInput);
    if (!vendedor) {
        return res.status(404).send({ message: 'Vendedor not found' });
    }
    return res.status(200).send({ message: 'Vendedor updated successfully', data: vendedor });
}
async function remove(req, res) {
    const id = req.params.id;
    const vendedor = await repository.delete({ id });
    if (!vendedor) {
        res.status(404).send({ message: 'Vendedor not found' });
    }
    else {
        res.status(200).send({ message: 'Vendedor deleted successfully' });
    }
}
export { sanitizeVendedorInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=vendedor.controller.js.map