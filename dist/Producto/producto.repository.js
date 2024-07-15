import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const productos = db.collection('productos');
export class ProductoRepository {
    async findAll() {
        return await productos.find().toArray();
    }
    async findOne(item) {
        const _id = new ObjectId(item.id);
        return (await productos.findOne({ _id })) || undefined;
    }
    async add(item) {
        item._id = (await productos.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        return (await productos.findOneAndUpdate({ _id }, { $set: item }, { returnDocument: 'after' })) || undefined;
    }
    async delete(item) {
        const _id = new ObjectId(item.id);
        return await (productos.findOneAndDelete({ _id })) || undefined;
    }
}
//# sourceMappingURL=producto.repository.js.map