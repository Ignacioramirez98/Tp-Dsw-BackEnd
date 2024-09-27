import { ClienteRepository } from "./cliente.repository.js";
import { Cliente } from "./cliente.entity.js";
const repository = new ClienteRepository();
function sanitizeLocalidadInput(req, res, next) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        dni: req.body.dni,
        mail: req.body.mail,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
        razon_social: req.body.razon_social,
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
    const cliente = await repository.findOne({ id });
    if (!cliente) {
        return res.status(404).send({ message: 'Cliente no encontrado' });
    }
    res.json({ data: cliente });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    const clienteInput = new Cliente(input.nombre, input.apellido, input.dni, input.mail, input.telefono, input.direccion, input.razon_social);
    const cliente = await repository.add(clienteInput);
    return res.status(201).send({ message: 'Cliente creado', data: cliente });
}
async function update(req, res) {
    const cliente = await repository.update(req.params.id, req.body.sanitizedInput);
    if (!cliente) {
        return res.status(404).send({ message: 'Cliente no encontrado' });
    }
    return res.status(200).send({ message: 'Cliente actualizado correctamente', data: cliente });
}
async function remove(req, res) {
    const id = req.params.id;
    const cliente = await repository.delete({ id });
    if (!cliente) {
        res.status(404).send({ message: 'Cleinte no encontrado' });
    }
    else {
        res.status(200).send({ message: 'Cliente eliminado correctamente' });
    }
}
export { sanitizeLocalidadInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=cliente.controller.js.map