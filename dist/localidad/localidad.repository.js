import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const localidades = db.collection('localidades');
export class LocalidadRepository {
    async findAll() {
        return await localidades.find().toArray();
    }
    async findOne(item) {
        const _id = new ObjectId(item.id);
        return (await localidades.findOne({ _id })) || undefined;
    }
    async add(item) {
        item._id = (await localidades.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        return (await localidades.findOneAndUpdate({ _id }, { $set: item }, { returnDocument: 'after' })) || undefined;
    }
    async delete(item) {
        const _id = new ObjectId(item.id);
        return await (localidades.findOneAndDelete({ _id })) || undefined;
    }
}
//# sourceMappingURL=localidad.repository.js.map