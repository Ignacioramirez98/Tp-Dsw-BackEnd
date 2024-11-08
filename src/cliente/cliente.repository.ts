import { Cliente } from './cliente.entity.js';  // Importar el modelo Cliente
import { ClienteDocument } from './cliente.entity.js';  // Importar la interfaz ClienteDocument
import { ObjectId } from 'mongodb';  // Importar ObjectId

export class ClienteRepository {
    // Método para buscar un solo cliente
    async findOne(filter: { _id: ObjectId }): Promise<ClienteDocument | null> {
        return await Cliente.findOne(filter);  // Usar el modelo Cliente
    }

    // Método para buscar todos los clientes
    async findAll(): Promise<ClienteDocument[]> {
        return await Cliente.find();  // Usar el modelo Cliente
    }

    // Método para agregar un nuevo cliente
    async add(cliente: ClienteDocument): Promise<ClienteDocument> {
        return await Cliente.create(cliente);  // Usar el modelo Cliente
    }

    // Método para actualizar un cliente
    async update(id: ObjectId, updatedData: Partial<ClienteDocument>): Promise<ClienteDocument | null> {
        return await Cliente.findOneAndUpdate({ _id: id }, updatedData, { new: true });
    }

    // Método para eliminar un cliente
    async delete(filter: { _id: ObjectId }): Promise<ClienteDocument | null> {
        return await Cliente.findOneAndDelete(filter);  // Usar el modelo Cliente
    }
}
