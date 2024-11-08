import Vendedor, { IVendedor } from "../Vendedor/vendedor.entity.js"; // Importas tanto el modelo como la interfaz
import { ObjectId } from "mongodb";

class VendedorRepository {
    async findAll(): Promise<IVendedor[]> {
        return Vendedor.find();  // Aquí usas el modelo de Mongoose
    }

    async findOne(filter: object): Promise<IVendedor | null> {
        return Vendedor.findOne(filter);  // Aquí también
    }

    async add(vendedor: IVendedor): Promise<IVendedor> {
        const newVendedor = new Vendedor(vendedor);  // Creas una nueva instancia del modelo
        return newVendedor.save();  // Guardamos en la base de datos
    }

async update(id: ObjectId, updateData: object): Promise<IVendedor | null> {
        // Usamos findByIdAndUpdate con un ObjectId
        return Vendedor.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(filter: object): Promise<IVendedor | null> {
        return Vendedor.findOneAndDelete(filter);
    }
}

export { VendedorRepository };
