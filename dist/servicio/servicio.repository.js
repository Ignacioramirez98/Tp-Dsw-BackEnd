import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const servicios = db.collection('servicios');
export class ServicioRepository {
    async findAll() {
        return await servicios.find().toArray();
    }
    async findOne(item) {
        const _id = new ObjectId(item.id);
        return (await servicios.findOne({ _id })) || undefined;
    }
    async add(item) {
        item._id = (await servicios.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        return (await servicios.findOneAndUpdate({ _id }, { $set: item }, { returnDocument: 'after' })) || undefined;
    }
    async delete(item) {
        const _id = new ObjectId(item.id);
        return await (servicios.findOneAndDelete({ _id })) || undefined;
    }
}
//# sourceMappingURL=servicio.repository.js.map