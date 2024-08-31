import { Repository } from "../shared/repository.js"
import { Cliente } from "./cliente.entity.js"
import { db } from '../shared/db/conn.js'
import { ObjectId } from "mongodb"

const cliente = db.collection<Cliente>('cliente')

export class ClienteRepository implements Repository<Cliente> {
    public async findAll(): Promise<Cliente[] | undefined> {
        return await cliente.find().toArray()
    }

    public async findOne(item: { id: string; }): Promise<Cliente | undefined> {
        const _id = new ObjectId(item.id);
        return (await cliente.findOne({ _id })) || undefined
    }

    public async add(item: Cliente): Promise<Cliente | undefined> {
        item._id = (await cliente.insertOne(item)).insertedId
        return item
    }

    public async update(id: string, item: Cliente): Promise<Cliente | undefined> {
        const _id = new ObjectId(id)
        return (await cliente.findOneAndUpdate({ _id }, { $set: item }, { returnDocument: 'after' })) || undefined
    }

    public async delete(item: { id: string; }): Promise<Cliente | undefined> {
        const _id = new ObjectId(item.id)
        return await (cliente.findOneAndDelete({ _id })) || undefined
    }
}