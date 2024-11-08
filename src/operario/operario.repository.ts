import { Repository } from "../shared/repository.js";
import { Operario } from "../operario/operario.entity.js";
import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

const operarios = db.collection<Operario>('operarios');

export class OperarioRepository implements Repository<Operario> {
    
    public async findAll(): Promise<Operario[] | undefined> {
        return await operarios.find().toArray();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Operario | undefined> {
        // Usamos el _id directamente
        return (await operarios.findOne({ _id: item._id })) || undefined;
    }

    public async add(item: Operario): Promise<Operario | undefined> {
        item._id = (await operarios.insertOne(item)).insertedId;
        return item;
    }

public async update(id: ObjectId, item: Operario): Promise<Operario | undefined> {
    const _id = new ObjectId(id);
    const result = await operarios.updateOne({ _id }, { $set: item });

    if (result.modifiedCount === 1) {
        // Retornamos el Operario actualizado si se realizó la modificación
        return await operarios.findOne({ _id }) || undefined;
    }
    return undefined;
}

public async delete(item: { _id: ObjectId }): Promise<Operario | undefined> {
    const result = await operarios.findOneAndDelete({ _id: item._id });
    return result ? result as Operario : undefined;
}


}
