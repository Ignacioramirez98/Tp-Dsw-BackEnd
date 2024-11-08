import { Repository } from "../shared/repository.js";
import { Venta } from "../venta/venta.entity.js";
import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

const ventas = db.collection<Venta>('ventas');

export class VentaRepository implements Repository<Venta> {
    
    public async findAll(): Promise<Venta[] | undefined> {
        return await ventas.find().toArray();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Venta | undefined> {
        // Usamos el _id directamente
        return (await ventas.findOne({ _id: item._id })) || undefined;
    }

    public async add(item: Venta): Promise<Venta | undefined> {
        item._id = (await ventas.insertOne(item)).insertedId;
        return item;
    }

public async update(id: ObjectId, item: Venta): Promise<Venta | undefined> {
    const _id = new ObjectId(id);
    const result = await ventas.updateOne({ _id }, { $set: item });

    if (result.modifiedCount === 1) {
        // Retornamos el Venta actualizado si se realizó la modificación
        return await ventas.findOne({ _id }) || undefined;
    }
    return undefined;
}

public async delete(item: { _id: ObjectId }): Promise<Venta | undefined> {
    const result = await ventas.findOneAndDelete({ _id: item._id });
    return result ? result as Venta : undefined;
}


}
