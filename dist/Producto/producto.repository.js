import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const productos = db.collection('productos');
export class ProductoRepository {
    async findAll() {
        return await productos.find().toArray();
    }
    async findOne(item) {
        // Usamos el _id directamente
        return (await productos.findOne({ _id: item._id })) || undefined;
    }
    async add(item) {
        item._id = (await productos.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        const result = await productos.updateOne({ _id }, { $set: item });
        if (result.modifiedCount === 1) {
            // Retornamos el producto actualizado si se realizó la modificación
            return await productos.findOne({ _id }) || undefined;
        }
        return undefined;
    }
    async delete(item) {
        const result = await productos.findOneAndDelete({ _id: item._id });
        return result ? result : undefined;
    }
}
//# sourceMappingURL=producto.repository.js.map