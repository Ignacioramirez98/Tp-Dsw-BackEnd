import { Cliente } from './cliente.entity.js'; // Importar el modelo Cliente
export class ClienteRepository {
    // Método para buscar un solo cliente
    async findOne(filter) {
        return await Cliente.findOne(filter); // Usar el modelo Cliente
    }
    // Método para buscar todos los clientes
    async findAll() {
        return await Cliente.find(); // Usar el modelo Cliente
    }
    // Método para agregar un nuevo cliente
    async add(cliente) {
        return await Cliente.create(cliente); // Usar el modelo Cliente
    }
    // Método para actualizar un cliente
    async update(id, updatedData) {
        return await Cliente.findOneAndUpdate({ _id: id }, updatedData, { new: true });
    }
    // Método para eliminar un cliente
    async delete(filter) {
        return await Cliente.findOneAndDelete(filter); // Usar el modelo Cliente
    }
}
//# sourceMappingURL=cliente.repository.js.map