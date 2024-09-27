import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const cliente = db.collection('cliente');
export class ClienteRepository {
    async findAll() {
        return await cliente.find().toArray();
    }
    async findOne(item) {
        const _id = new ObjectId(item.id);
        return (await cliente.findOne({ _id })) || undefined;
    }
    async add(item) {
        item._id = (await cliente.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        return (await cliente.findOneAndUpdate({ _id }, { $set: item }, { returnDocument: 'after' })) || undefined;
    }
    async delete(item) {
        const _id = new ObjectId(item.id);
        return await (cliente.findOneAndDelete({ _id })) || undefined;
    }
}
//# sourceMappingURL=cliente.repository.js.map