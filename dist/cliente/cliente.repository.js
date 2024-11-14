import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const clientes = db.collection('clientes');
export class ClienteRepository {
    async findAll() {
        return await clientes.find().toArray();
    }
    async findOne(filter) {
        return await clientes.findOne(filter) || undefined;
    }
    async add(item) {
        item._id = (await clientes.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        const result = await clientes.updateOne({ _id }, { $set: item });
        if (result.modifiedCount === 1) {
            // Retornamos el Cliente actualizado si se realizó la modificación
            return await clientes.findOne({ _id }) || undefined;
        }
        return undefined;
    }
    async delete(item) {
        const result = await clientes.findOneAndDelete({ _id: item._id });
        return result ? result : undefined;
    }
}
//# sourceMappingURL=cliente.repository.js.map