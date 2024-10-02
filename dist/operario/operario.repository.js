import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const operarios = db.collection('operarios');
export class OperarioRepository {
    async findAll() {
        return await operarios.find().toArray();
    }
    async findOne(item) {
        const _id = new ObjectId(item.id);
        return (await operarios.findOne({ _id })) || undefined;
    }
    async add(item) {
        item._id = (await operarios.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        return (await operarios.findOneAndUpdate({ _id }, { $set: item }, { returnDocument: 'after' })) || undefined;
    }
    async delete(item) {
        const _id = new ObjectId(item.id);
        return await (operarios.findOneAndDelete({ _id })) || undefined;
    }
}
//# sourceMappingURL=operario.repository.js.map