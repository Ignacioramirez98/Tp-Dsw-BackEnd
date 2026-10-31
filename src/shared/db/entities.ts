import { Cliente } from '../../cliente/cliente.entity.js';
import { Localidad } from '../../localidad/localidad.entity.js';
import { Operario } from '../../operario/operario.entity.js';
import { Producto } from '../../producto/producto.entity.js';
import { Servicio } from '../../servicio/servicio.entity.js';
import { Usuario } from '../../usuario/usuario.entity.js';
import { Vendedor } from '../../Vendedor/vendedor.entity.js';
import { ItemVenta } from '../../venta/item-venta.entity.js';
import { Venta } from '../../venta/venta.entity.js';

// Lista explícita de entidades (en vez de buscarlas por glob en dist/)
export const entities = [Cliente, Localidad, Operario, Producto, Servicio, Usuario, Vendedor, Venta, ItemVenta];
