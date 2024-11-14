import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";
const vendedores = db.collection('vendedores');
export class VendedorRepository {
    async findAll() {
        return await vendedores.find().toArray();
    }
    async findOne(item) {
        // Usamos el _id directamente
        return (await vendedores.findOne({ _id: item._id })) || undefined;
    }
    async add(item) {
        item._id = (await vendedores.insertOne(item)).insertedId;
        return item;
    }
    async update(id, item) {
        const _id = new ObjectId(id);
        const result = await vendedores.updateOne({ _id }, { $set: item });
        if (result.modifiedCount === 1) {
            // Retornamos el Vendedor actualizado si se realizó la modificación
            return await vendedores.findOne({ _id }) || undefined;
        }
        return undefined;
    }
    async delete(item) {
        const result = await vendedores.findOneAndDelete({ _id: item._id });
        return result ? result : undefined;
    }
}
//# sourceMappingURL=vendedor.repository.js.map