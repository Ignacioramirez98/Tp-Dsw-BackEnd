import Vendedor from "../Vendedor/vendedor.entity.js"; // Importas tanto el modelo como la interfaz
class VendedorRepository {
    async findAll() {
        return Vendedor.find(); // Aquí usas el modelo de Mongoose
    }
    async findOne(filter) {
        return Vendedor.findOne(filter); // Aquí también
    }
    async add(vendedor) {
        const newVendedor = new Vendedor(vendedor); // Creas una nueva instancia del modelo
        return newVendedor.save(); // Guardamos en la base de datos
    }
    async update(id, updateData) {
        // Usamos findByIdAndUpdate con un ObjectId
        return Vendedor.findByIdAndUpdate(id, updateData, { new: true });
    }
    async delete(filter) {
        return Vendedor.findOneAndDelete(filter);
    }
}
export { VendedorRepository };
//# sourceMappingURL=vendedor.repository.js.map