import { ClienteRepository } from "../cliente/cliente.repository.js";
import { Cliente } from "../cliente/cliente.entity.js"; // Importa el modelo Cliente, no el tipo ClienteDocument
import { ObjectId } from "mongodb"; // Importar ObjectId para la validación
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
    res.json({ data: await repository.findAll() });
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
        return res.status(404).send({ message: 'Cliente no encontrado' });
    }
    res.json({ data: cliente });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    const clienteInput = new Cliente({
        nombre: input.nombre,
        apellido: input.apellido,
        dni: input.dni,
        mail: input.mail,
        telefono: input.telefono,
        direccion: input.direccion,
        razon_social: input.razon_social,
        usuario: input.usuario,
        contraseña: input.contraseña,
    });
    const cliente = await repository.add(clienteInput);
    return res.status(201).send({ message: 'Cliente creado', data: cliente });
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
        return res.status(404).send({ message: 'Cliente no encontrado' });
    }
    return res.status(200).send({ message: 'Cliente actualizado exitosamente', data: cliente });
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
        return res.status(404).send({ message: 'Cliente no encontrado' });
    }
    return res.status(200).send({ message: 'Cliente eliminado exitosamente' });
}
export { sanitizeClienteInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=cliente.controller.js.map