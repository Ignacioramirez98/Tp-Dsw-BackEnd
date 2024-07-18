import { Repository } from "../shared/repository.js"
import { Vendedor } from "./vendedor.entity.js"
import { db } from '../shared/db/conn.js'
import { ObjectId } from "mongodb"

const vendedores = db.collection<Vendedor>('vendedores')

export class VendedorRepository implements Repository<Vendedor>
{
    public async findAll(): Promise<Vendedor[] | undefined> {
        return await vendedores.find().toArray()
    }

    public async findOne(item: { id: string; }): Promise<Vendedor | undefined>{
        const _id = new ObjectId(item.id);
        return (await vendedores.findOne({_id})) || undefined
    }

    public async add(item: Vendedor): Promise<Vendedor | undefined> {
        item._id = (await vendedores.insertOne(item)).insertedId
        return item
    }

    public async update(id:string, item: Vendedor): Promise<Vendedor | undefined>{
        const _id = new ObjectId(id)
        return (await vendedores.findOneAndUpdate({_id},{$set:item},{returnDocument:'after'})) || undefined
    }

    public async delete(item: { id: string; }): Promise<Vendedor | undefined> {
        const _id = new ObjectId(item.id)
        return await (vendedores.findOneAndDelete({_id})) || undefined
    }
}