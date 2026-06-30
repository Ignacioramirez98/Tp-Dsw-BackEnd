import { ClienteRepository } from "../cliente/cliente.repository.js";
import { Cliente } from "../cliente/cliente.entity.js";
import { ObjectId } from "mongodb"; // Importar ObjectId para la validación
import { createClienteSchema } from "../validators/cliente.validator.js";
const repository = new ClienteRepository();
function sanitizeClienteInput(req, res, next) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        dni: req.body.dni,
        mail: req.body.mail,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
        razon_social: req.body.razon_social,
        usuario: req.body.usuario,
        contraseña: req.body.contraseña,
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
    const filters = {};
    // Filtro por usuario
    if (req.query.usuario) {
        filters.usuario = { $regex: req.query.usuario, $options: 'i' };
    }
    // Filtro por apellido
    if (req.query.apellido) {
        filters.apellido = { $regex: req.query.apellido, $options: 'i' };
    }
    // Filtro por DNI
    if (req.query.dni) {
        filters.dni = req.query.dni;
    }
    res.json({ data: await repository.findAll(Object.keys(filters).length > 0 ? filters : undefined) });
}
async function findOne(req, res) {
    const { id } = req.params;
    // Validar y convertir el id
    const clienteId = validateAndConvertId(id);
    if (!clienteId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    const cliente = await repository.findOne({ _id: clienteId });
    if (!cliente) {
        return res.status(404).send({ message: 'cliente no encontrado' });
    }
    res.json({ data: cliente });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    try {
        const validated = createClienteSchema.parse(input);
        const clienteInput = new Cliente({
            nombre: validated.nombre,
            apellido: validated.apellido,
            dni: validated.dni,
            mail: validated.mail,
            telefono: validated.telefono,
            direccion: validated.direccion,
            razon_social: validated.razon_social || ""
        });
        const cliente = await repository.add(clienteInput);
        return res.status(201).send({ message: 'cliente creado', data: cliente });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).send({ message: 'Validación fallida', errors: error.errors });
        }
        return res.status(500).send({ message: 'Error al crear cliente' });
    }
}
async function update(req, res) {
    const { id } = req.params;
    // Validar y convertir el id
    const clienteId = validateAndConvertId(id);
    if (!clienteId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    // Actualizar el cliente con los datos sanitizados
    const cliente = await repository.update(clienteId, req.body.sanitizedInput);
    if (!cliente) {
        return res.status(404).send({ message: 'cliente no encontrado' });
    }
    return res.status(200).send({ message: 'cliente actualizado exitosamente', data: cliente });
}
async function remove(req, res) {
    const { id } = req.params;
    // Validar y convertir el id
    const clienteId = validateAndConvertId(id);
    if (!clienteId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    const cliente = await repository.delete({ _id: clienteId });
    if (!cliente) {
        return res.status(404).send({ message: 'cliente no encontrado' });
    }
    return res.status(200).send({ message: 'cliente eliminado exitosamente' });
}
export { sanitizeClienteInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=cliente.controller.js.map