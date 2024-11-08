// services/login.service.ts
import { Cliente } from "../cliente/cliente.entity.js"; // Asegúrate de usar Cliente como el modelo exportado
import Vendedor from '../Vendedor/vendedor.entity';
import bcrypt from 'bcryptjs';
async function login(usuario, password, userType) {
    let user;
    if (userType === 'cliente') {
        user = await Cliente.findOne({ usuario });
    }
    else if (userType === 'vendedor') {
        user = await Vendedor.findOne({ usuario });
    }
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    const isMatch = await bcrypt.compare(password, user.contraseña);
    if (!isMatch) {
        throw new Error('Contraseña incorrecta');
    }
    return { message: 'Login exitoso', user };
}
export default { login };
//# sourceMappingURL=login.service.js.map