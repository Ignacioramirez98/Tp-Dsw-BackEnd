import { LocalidadRepository } from "./localidad.repository.js";
import { Localidad } from "./localidad.entity.js";
const repository = new LocalidadRepository();
function sanitizeLocalidadInput(req, res, next) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        codigo_postal: req.body.codigo_postal,
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
    const localidad = await repository.findOne({ id });
    if (!localidad) {
        return res.status(404).send({ message: 'Localidad no encontrada' });
    }
    res.json({ data: localidad });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    const localidadInput = new Localidad(input.nombre, input.codigo_postal);
    const localidad = await repository.add(localidadInput);
    return res.status(201).send({ message: 'Localidad creada', data: localidad });
}
async function update(req, res) {
    const localidad = await repository.update(req.params.id, req.body.sanitizedInput);
    if (!localidad) {
        return res.status(404).send({ message: 'localidad no encontrada' });
    }
    return res.status(200).send({ message: 'localidad actualizada correctamente', data: localidad });
}
async function remove(req, res) {
    const id = req.params.id;
    const localidad = await repository.delete({ id });
    if (!localidad) {
        res.status(404).send({ message: 'Localidad no encontrada' });
    }
    else {
        res.status(200).send({ message: 'Localidad eliminada correctamente' });
    }
}
export { sanitizeLocalidadInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=localidad.controller.js.map