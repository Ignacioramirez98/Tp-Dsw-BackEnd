import { LocalidadRepository } from "../localidad/localidad.repository.js";
import { Localidad } from "../localidad/localidad.entity.js";
import { ObjectId } from "mongodb"; // Importar ObjectId para la validación
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
// Función para validar y convertir el id en ObjectId
function validateAndConvertId(id) {
    if (ObjectId.isValid(id)) {
        return new ObjectId(id); // Convertir a ObjectId
    }
    return null; // Retornar null si el id no es válido
}
async function findAll(req, res) {
    res.json({ data: await repository.findAll() });
}
async function findOne(req, res) {
    const { id } = req.params;
    // Validar y convertir el id
    const localidadId = validateAndConvertId(id);
    if (!localidadId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    const localidad = await repository.findOne({ _id: localidadId });
    if (!localidad) {
        return res.status(404).send({ message: 'localidad no encontrado' });
    }
    res.json({ data: localidad });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    const localidadInput = new Localidad(input.nombre, input.codigo_postal);
    const localidad = await repository.add(localidadInput);
    return res.status(201).send({ message: 'localidad creado', data: localidad });
}
async function update(req, res) {
    const { id } = req.params;
    // Validar y convertir el id
    const localidadId = validateAndConvertId(id);
    if (!localidadId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    // Actualizar el localidad con los datos sanitizados
    const localidad = await repository.update(localidadId, req.body.sanitizedInput);
    if (!localidad) {
        return res.status(404).send({ message: 'localidad no encontrado' });
    }
    return res.status(200).send({ message: 'localidad actualizado exitosamente', data: localidad });
}
async function remove(req, res) {
    const { id } = req.params;
    // Validar y convertir el id
    const localidadId = validateAndConvertId(id);
    if (!localidadId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    const localidad = await repository.delete({ _id: localidadId });
    if (!localidad) {
        return res.status(404).send({ message: 'localidad no encontrado' });
    }
    return res.status(200).send({ message: 'localidad eliminado exitosamente' });
}
export { sanitizeLocalidadInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=localidad.controller.js.map