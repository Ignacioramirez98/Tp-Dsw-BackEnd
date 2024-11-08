import { Repository } from "../shared/repository.js";
import { Localidad } from "../localidad/localidad.entity.js";
import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

const localidades = db.collection<Localidad>('localidades');

export class LocalidadRepository implements Repository<Localidad> {
    
    public async findAll(): Promise<Localidad[] | undefined> {
        return await localidades.find().toArray();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Localidad | undefined> {
        // Usamos el _id directamente
        return (await localidades.findOne({ _id: item._id })) || undefined;
    }

    public async add(item: Localidad): Promise<Localidad | undefined> {
        item._id = (await localidades.insertOne(item)).insertedId;
        return item;
    }

public async update(id: ObjectId, item: Localidad): Promise<Localidad | undefined> {
    const _id = new ObjectId(id);
    const result = await localidades.updateOne({ _id }, { $set: item });

    if (result.modifiedCount === 1) {
        // Retornamos el Localidad actualizado si se realizó la modificación
        return await localidades.findOne({ _id }) || undefined;
    }
    return undefined;
}

public async delete(item: { _id: ObjectId }): Promise<Localidad | undefined> {
    const result = await localidades.findOneAndDelete({ _id: item._id });
    return result ? result as Localidad : undefined;
}


}
