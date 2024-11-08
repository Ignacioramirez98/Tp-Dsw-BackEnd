import { Repository } from "../shared/repository.js";
import { Servicio } from "../servicio/servicio.entity.js";
import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

const servicios = db.collection<Servicio>('servicios');

export class ServicioRepository implements Repository<Servicio> {
    
    public async findAll(): Promise<Servicio[] | undefined> {
        return await servicios.find().toArray();
    }

    public async findOne(item: { _id: ObjectId }): Promise<Servicio | undefined> {
        // Usamos el _id directamente
        return (await servicios.findOne({ _id: item._id })) || undefined;
    }

    public async add(item: Servicio): Promise<Servicio | undefined> {
        item._id = (await servicios.insertOne(item)).insertedId;
        return item;
    }

public async update(id: ObjectId, item: Servicio): Promise<Servicio | undefined> {
    const _id = new ObjectId(id);
    const result = await servicios.updateOne({ _id }, { $set: item });

    if (result.modifiedCount === 1) {
        // Retornamos el Servicio actualizado si se realizó la modificación
        return await servicios.findOne({ _id }) || undefined;
    }
    return undefined;
}

public async delete(item: { _id: ObjectId }): Promise<Servicio | undefined> {
    const result = await servicios.findOneAndDelete({ _id: item._id });
    return result ? result as Servicio : undefined;
}


}
