import { Repository } from "../shared/repository.js"
import { Venta } from "./venta.entity.js"
import { db } from '../shared/db/conn.js'
import { ObjectId } from "mongodb"

const ventas = db.collection<Venta>('ventas')

export class VentaRepository implements Repository<Venta>
{
    public async findAll(): Promise<Venta[] | undefined> {
        return await ventas.find().toArray()
    }

    public async findOne(item: { id: string; }): Promise<Venta | undefined>{
        const _id = new ObjectId(item.id);
        return (await ventas.findOne({_id})) || undefined
    }

    public async add(item: Venta): Promise<Venta | undefined> {
        item._id = (await ventas.insertOne(item)).insertedId
        return item
    }

    public async update(id:string, item: Venta): Promise<Venta | undefined>{
        const _id = new ObjectId(id)
        return (await ventas.findOneAndUpdate({_id},{$set:item},{returnDocument:'after'})) || undefined
    }

    public async delete(item: { id: string; }): Promise<Venta | undefined> {
        const _id = new ObjectId(item.id)
        return await (ventas.findOneAndDelete({_id})) || undefined
    }
}