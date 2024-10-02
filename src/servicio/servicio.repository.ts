import { Repository } from "../shared/repository.js"
import { Servicio } from "./servicio.entity.js"
import { db } from '../shared/db/conn.js'
import { ObjectId } from "mongodb"

const servicios = db.collection<Servicio>('servicios')

export class ServicioRepository implements Repository<Servicio>
{
    public async findAll(): Promise<Servicio[] | undefined> {
        return await servicios.find().toArray()
    }

    public async findOne(item: { id: string; }): Promise<Servicio | undefined>{
        const _id = new ObjectId(item.id);
        return (await servicios.findOne({_id})) || undefined
    }

    public async add(item: Servicio): Promise<Servicio | undefined> {
        item._id = (await servicios.insertOne(item)).insertedId
        return item
    }

    public async update(id:string, item: Servicio): Promise<Servicio | undefined>{
        const _id = new ObjectId(id)
        return (await servicios.findOneAndUpdate({_id},{$set:item},{returnDocument:'after'})) || undefined
    }

    public async delete(item: { id: string; }): Promise<Servicio | undefined> {
        const _id = new ObjectId(item.id)
        return await (servicios.findOneAndDelete({_id})) || undefined
    }
}