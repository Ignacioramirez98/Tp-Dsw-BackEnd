import { Repository } from "../shared/repository.js";
import { Cliente } from "../cliente/cliente.entity.js";
import { db } from '../shared/db/conn.js';
import { ObjectId } from "mongodb";

const clientes = db.collection<Cliente>('clientes');

export class ClienteRepository implements Repository<Cliente> {
    
    public async findAll(): Promise<Cliente[] | undefined> {
        return await clientes.find().toArray();
    }

public async findOne(filter: { _id: ObjectId }): Promise<Cliente | undefined>;
public async findOne(filter: { usuario: string }): Promise<Cliente | undefined>;
public async findOne(filter: { [key: string]: any }): Promise<Cliente | undefined> {
    return await clientes.findOne(filter) || undefined;
}

    public async add(item: Cliente): Promise<Cliente | undefined> {
        item._id = (await clientes.insertOne(item)).insertedId;
        return item;
    }

public async update(id: ObjectId, item: Cliente): Promise<Cliente | undefined> {
    const _id = new ObjectId(id);
    const result = await clientes.updateOne({ _id }, { $set: item });

    if (result.modifiedCount === 1) {
        // Retornamos el Cliente actualizado si se realizó la modificación
        return await clientes.findOne({ _id }) || undefined;
    }
    return undefined;
}

public async delete(item: { _id: ObjectId }): Promise<Cliente | undefined> {
    const result = await clientes.findOneAndDelete({ _id: item._id });
    return result ? result as Cliente : undefined;
}


}
