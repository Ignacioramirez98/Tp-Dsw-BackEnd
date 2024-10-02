import { ServicioRepository } from "./servicio.repository.js";
import { Servicio } from "./servicio.entity.js";
const repository = new ServicioRepository();
function sanitizeServicioInput(req, res, next) {
    req.body.sanitizedInput = {
        idServicio: req.body.idServicio,
        descripcion: req.body.descripcion,
        importe_por_hora: req.body.importe_por_hora,
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
    const servicio = await repository.findOne({ id });
    if (!servicio) {
        return res.status(404).send({ message: 'Servicio no encontrado' });
    }
    res.json({ data: servicio });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    const servicioInput = new Servicio(input.idServicio, input.descripcion, input.importe_por_hora);
    const servicio = await repository.add(servicioInput);
    return res.status(201).send({ message: 'Servicio creado', data: servicio });
}
async function update(req, res) {
    const servicio = await repository.update(req.params.id, req.body.sanitizedInput);
    if (!servicio) {
        return res.status(404).send({ message: 'servicio not found' });
    }
    return res.status(200).send({ message: 'servicio updated successfully', data: servicio });
}
async function remove(req, res) {
    const id = req.params.id;
    const servicio = await repository.delete({ id });
    if (!servicio) {
        res.status(404).send({ message: 'Servicio not found' });
    }
    else {
        res.status(200).send({ message: 'Servicio deleted successfully' });
    }
}
export { sanitizeServicioInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=servicio.controller.js.map