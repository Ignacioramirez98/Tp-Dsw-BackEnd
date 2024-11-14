import { VendedorRepository } from "../Vendedor/vendedor.repository.js";
import { Vendedor } from "../Vendedor/vendedor.entity.js";
import { ObjectId } from "mongodb"; // Importar ObjectId para la validación
const repository = new VendedorRepository();
function sanitizeVendedorInput(req, res, next) {
    req.body.sanitizedInput = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        mail: req.body.mail,
        dni: req.body.dni,
        telefono: req.body.telefono,
        rol: req.body.rol,
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
    const vendedorId = validateAndConvertId(id);
    if (!vendedorId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    const vendedor = await repository.findOne({ _id: vendedorId });
    if (!vendedor) {
        return res.status(404).send({ message: 'vendedor no encontrado' });
    }
    res.json({ data: vendedor });
}
async function add(req, res) {
    const input = req.body.sanitizedInput;
    const vendedorInput = new Vendedor(input.nombre, input.apellido, input.mail, input.dni, input.telefono, input.rol, input.usuario, input.contraseña);
    const vendedor = await repository.add(vendedorInput);
    return res.status(201).send({ message: 'vendedor creado', data: vendedor });
}
async function update(req, res) {
    const { id } = req.params;
    // Validar y convertir el id
    const vendedorId = validateAndConvertId(id);
    if (!vendedorId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    // Actualizar el vendedor con los datos sanitizados
    const vendedor = await repository.update(vendedorId, req.body.sanitizedInput);
    if (!vendedor) {
        return res.status(404).send({ message: 'vendedor no encontrado' });
    }
    return res.status(200).send({ message: 'vendedor actualizado exitosamente', data: vendedor });
}
async function remove(req, res) {
    const { id } = req.params;
    // Validar y convertir el id
    const vendedorId = validateAndConvertId(id);
    if (!vendedorId) {
        return res.status(400).send({ message: 'ID inválido' });
    }
    const vendedor = await repository.delete({ _id: vendedorId });
    if (!vendedor) {
        return res.status(404).send({ message: 'vendedor no encontrado' });
    }
    return res.status(200).send({ message: 'vendedor eliminado exitosamente' });
}
export { sanitizeVendedorInput, findAll, findOne, add, update, remove };
//# sourceMappingURL=vendedor.controller.js.map