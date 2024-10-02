import { Repository } from "../shared/repository.js"
import { Producto } from "../Producto/producto.entity.js"
import { db } from '../shared/db/conn.js'
import { ObjectId } from "mongodb"

const productos = db.collection<Producto>('productos')

export class ProductoRepository implements Repository<Producto>
{
    public async findAll(): Promise<Producto[] | undefined> {
        return await productos.find().toArray()
    }

    public async findOne(item: { id: string; }): Promise<Producto | undefined>{
        const _id = new ObjectId(item.id);
        return (await productos.findOne({_id})) || undefined
    }

    public async add(item: Producto): Promise<Producto | undefined> {
        item._id = (await productos.insertOne(item)).insertedId
        return item
    }

    public async update(id:string, item: Producto): Promise<Producto | undefined>{
        const _id = new ObjectId(id)
        return (await productos.findOneAndUpdate({_id},{$set:item},{returnDocument:'after'})) || undefined
    }

    public async delete(item: { id: string; }): Promise<Producto | undefined> {
        const _id = new ObjectId(item.id)
        return await (productos.findOneAndDelete({_id})) || undefined
    }
}