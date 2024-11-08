import { ObjectId } from "mongodb";

export interface Repository<T> {
    findAll(): Promise<T[] | undefined>;
    findOne(item: { _id: ObjectId } | { id: string }): Promise<T | undefined>;
    add(item: T): Promise<T | undefined>;
    update(id: ObjectId, item: T): Promise<T | undefined>;
    delete(item: { _id: ObjectId } | { id: string }): Promise<T | undefined>;
}
