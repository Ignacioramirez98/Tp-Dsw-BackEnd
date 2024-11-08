import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const localidades = db.collection('localidades');
export class LocalidadRepository {
    async findAll() {
        return await localidades.find().toArray();
    }
    async findOne(item) {
        // Usamos el _id directamente
        return (await localidades.findOne({ _id: item._id })) || undefined;
    }
    async add(item) {
        item._id = (await localidades.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        const result = await localidades.updateOne({ _id }, { $set: item });
        if (result.modifiedCount === 1) {
            // Retornamos el Localidad actualizado si se realizó la modificación
            return await localidades.findOne({ _id }) || undefined;
        }
        return undefined;
    }
    async delete(item) {
        const result = await localidades.findOneAndDelete({ _id: item._id });
        return result ? result : undefined;
    }
}
//# sourceMappingURL=localidad.repository.js.map