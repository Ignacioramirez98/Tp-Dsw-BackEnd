import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const operarios = db.collection('operarios');
export class OperarioRepository {
    async findAll() {
        return await operarios.find().toArray();
    }
    async findOne(item) {
        // Usamos el _id directamente
        return (await operarios.findOne({ _id: item._id })) || undefined;
    }
    async add(item) {
        item._id = (await operarios.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        const result = await operarios.updateOne({ _id }, { $set: item });
        if (result.modifiedCount === 1) {
            // Retornamos el Operario actualizado si se realizó la modificación
            return await operarios.findOne({ _id }) || undefined;
        }
        return undefined;
    }
    async delete(item) {
        const result = await operarios.findOneAndDelete({ _id: item._id });
        return result ? result : undefined;
    }
}
//# sourceMappingURL=operario.repository.js.map