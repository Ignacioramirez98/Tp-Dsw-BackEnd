import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const ventas = db.collection('ventas');
export class VentaRepository {
    async findAll() {
        return await ventas.find().toArray();
    }
    async findOne(item) {
        const _id = new ObjectId(item.id);
        return (await ventas.findOne({ _id })) || undefined;
    }
    async add(item) {
        item._id = (await ventas.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        return (await ventas.findOneAndUpdate({ _id }, { $set: item }, { returnDocument: 'after' })) || undefined;
    }
    async delete(item) {
        const _id = new ObjectId(item.id);
        return await (ventas.findOneAndDelete({ _id })) || undefined;
    }
}
//# sourceMappingURL=venta.repository.js.map