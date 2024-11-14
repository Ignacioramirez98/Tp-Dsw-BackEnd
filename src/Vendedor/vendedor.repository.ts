import { Repository } from "../shared/repository.js";
import { Vendedor } from "../Vendedor/vendedor.entity.js";
import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

const vendedores = db.collection<Vendedor>('vendedores');

export class VendedorRepository implements Repository<Vendedor> {
    
    public async findAll(): Promise<Vendedor[] | undefined> {
        return await vendedores.find().toArray();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Vendedor | undefined> {
        // Usamos el _id directamente
        return (await vendedores.findOne({ _id: item._id })) || undefined;
    }

    public async add(item: Vendedor): Promise<Vendedor | undefined> {
        item._id = (await vendedores.insertOne(item)).insertedId;
        return item;
    }

public async update(id: ObjectId, item: Vendedor): Promise<Vendedor | undefined> {
    const _id = new ObjectId(id);
    const result = await vendedores.updateOne({ _id }, { $set: item });

    if (result.modifiedCount === 1) {
        // Retornamos el Vendedor actualizado si se realizó la modificación
        return await vendedores.findOne({ _id }) || undefined;
    }
    return undefined;
}

public async delete(item: { _id: ObjectId }): Promise<Vendedor | undefined> {
    const result = await vendedores.findOneAndDelete({ _id: item._id });
    return result ? result as Vendedor : undefined;
}


}
