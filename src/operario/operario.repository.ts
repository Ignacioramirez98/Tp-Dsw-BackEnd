import { Repository } from "../shared/repository.js"
import { Operario } from "./operario.entity.js"
import { db } from '../shared/db/conn.js'
import { ObjectId } from "mongodb"

const operarios = db.collection<Operario>('operarios')

export class OperarioRepository implements Repository<Operario>
{
    public async findAll(): Promise<Operario[] | undefined> {
        return await operarios.find().toArray()
    }

    public async findOne(item: { id: string; }): Promise<Operario | undefined>{
        const _id = new ObjectId(item.id);
        return (await operarios.findOne({_id})) || undefined
    }

    public async add(item: Operario): Promise<Operario | undefined> {
        item._id = (await operarios.insertOne(item)).insertedId
        return item
    }

    public async update(id:string, item: Operario): Promise<Operario | undefined>{
        const _id = new ObjectId(id)
        return (await operarios.findOneAndUpdate({_id},{$set:item},{returnDocument:'after'})) || undefined
    }

    public async delete(item: { id: string; }): Promise<Operario | undefined> {
        const _id = new ObjectId(item.id)
        return await (operarios.findOneAndDelete({_id})) || undefined
    }
}