import { Repository } from "../shared/repository.js";
import { Producto } from "../Producto/producto.entity.js";
import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

const productos = db.collection<Producto>('productos');

export class ProductoRepository implements Repository<Producto> {
    
    public async findAll(): Promise<Producto[] | undefined> {
        return await productos.find().toArray();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Producto | undefined> {
        // Usamos el _id directamente
        return (await productos.findOne({ _id: item._id })) || undefined;
    }

    public async add(item: Producto): Promise<Producto | undefined> {
        item._id = (await productos.insertOne(item)).insertedId;
        return item;
    }

public async update(id: ObjectId, item: Producto): Promise<Producto | undefined> {
    const _id = new ObjectId(id);
    const result = await productos.updateOne({ _id }, { $set: item });

    if (result.modifiedCount === 1) {
        // Retornamos el producto actualizado si se realizó la modificación
        return await productos.findOne({ _id }) || undefined;
    }
    return undefined;
}

public async delete(item: { _id: ObjectId }): Promise<Producto | undefined> {
    const result = await productos.findOneAndDelete({ _id: item._id });
    return result ? result as Producto : undefined;
}


}
