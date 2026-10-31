import { ObjectId } from "mongodb";

export interface Repository<T> {
    findAll(filters?: Record<string, any>): Promise<T[] | undefined>;
    findOne(item: { _id: ObjectId }): Promise<T | undefined>;
    add(item: any): Promise<T | undefined>;
    update(id: ObjectId, item: any): Promise<T | undefined>;
    delete(item: { _id: ObjectId }): Promise<T | undefined>;
}
