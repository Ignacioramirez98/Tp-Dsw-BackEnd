import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const vendedores = db.collection('vendedores');
export class VendedorRepository {
    async findAll() {
        return await vendedores.find().toArray();
    }
    async findOne(item) {
        const _id = new ObjectId(item.id);
        return (await vendedores.findOne({ _id })) || undefined;
    }
    async add(item) {
        item._id = (await vendedores.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        return (await vendedores.findOneAndUpdate({ _id }, { $set: item }, { returnDocument: 'after' })) || undefined;
    }
    async delete(item) {
        const _id = new ObjectId(item.id);
        return await (vendedores.findOneAndDelete({ _id })) || undefined;
    }
}
//# sourceMappingURL=vendedor.repository.js.map