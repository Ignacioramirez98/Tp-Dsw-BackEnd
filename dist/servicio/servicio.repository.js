import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const servicios = db.collection('servicios');
export class ServicioRepository {
    async findAll() {
        return await servicios.find().toArray();
    }
    async findOne(item) {
        // Usamos el _id directamente
        return (await servicios.findOne({ _id: item._id })) || undefined;
    }
    async add(item) {
        item._id = (await servicios.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        const result = await servicios.updateOne({ _id }, { $set: item });
        if (result.modifiedCount === 1) {
            // Retornamos el Servicio actualizado si se realizó la modificación
            return await servicios.findOne({ _id }) || undefined;
        }
        return undefined;
    }
    async delete(item) {
        const result = await servicios.findOneAndDelete({ _id: item._id });
        return result ? result : undefined;
    }
}
//# sourceMappingURL=servicio.repository.js.map