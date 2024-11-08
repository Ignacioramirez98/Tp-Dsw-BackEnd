import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const ventas = db.collection('ventas');
export class VentaRepository {
    async findAll() {
        return await ventas.find().toArray();
    }
    async findOne(item) {
        // Usamos el _id directamente
        return (await ventas.findOne({ _id: item._id })) || undefined;
    }
    async add(item) {
        item._id = (await ventas.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        const result = await ventas.updateOne({ _id }, { $set: item });
        if (result.modifiedCount === 1) {
            // Retornamos el Venta actualizado si se realizó la modificación
            return await ventas.findOne({ _id }) || undefined;
        }
        return undefined;
    }
    async delete(item) {
        const result = await ventas.findOneAndDelete({ _id: item._id });
        return result ? result : undefined;
    }
}
//# sourceMappingURL=venta.repository.js.map