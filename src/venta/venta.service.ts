import { ObjectId } from 'mongodb';
import { VentaRepository, ItemVentaInput } from './venta.repository.js';
import { ClienteRepository } from '../cliente/cliente.repository.js';
import { VendedorRepository } from '../Vendedor/vendedor.repository.js';
import { ProductoRepository } from '../producto/producto.repository.js';
import { ServicioRepository } from '../servicio/servicio.repository.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../shared/errors.js';
import { descontoStock, motivoRechazo, puedePasar, type EstadoVenta } from './venta.estados.js';
import type { Venta } from './venta.entity.js';
import type { Producto } from '../producto/producto.entity.js';
import type { AuthUser } from '../middleware/roleAuth.middleware.js';
import { parseId, toObjectId } from '../shared/utils/object-id.js';
import { UN_DIA_MS, inicioDelDia, leerFecha } from '../shared/utils/fechas.js';

export interface VentaFiltros {
    estado?: string;
    clienteId?: string;
    vendedorId?: string;
    /** Rango de fecha del pedido (fechaContacto), en formato AAAA-MM-DD; ambos extremos incluidos. */
    desde?: string;
    hasta?: string;
}

/** Quién hace la petición (null en usos internos/tests: sin restricciones). */
export type Actor = Pick<AuthUser, 'rol' | 'clienteId'> & Partial<Pick<AuthUser, 'vendedorId'>> | null | undefined;

export interface ConcretarInput {
    /** Solo para admin: el vendedor que concreta. Un vendedor concreta siempre a su nombre. */
    vendedorId?: string | null;
    fechaEntrega?: Date | null;
}

// El estado y sus fechas no se editan a mano: cambian con concretar / cancelar / facturar
const CAMPOS_SIMPLES = ['fechaContacto', 'fechaEntrega'];

// Lo que define el pedido: solo se puede cambiar mientras la venta está pendiente
const CAMPOS_DEL_PEDIDO = ['clienteId', 'items', 'productoIds', 'servicioIds'];


export class VentaService {
    constructor(
        private readonly repository = new VentaRepository(),
        private readonly clienteRepository = new ClienteRepository(),
        private readonly vendedorRepository = new VendedorRepository(),
        private readonly productoRepository = new ProductoRepository(),
        private readonly servicioRepository = new ServicioRepository(),
    ) {}

    findAll(filtros: VentaFiltros = {}, actor?: Actor) {
        const query: Record<string, unknown> = {};
        if (filtros.estado) query.estado = filtros.estado;
        if (filtros.clienteId) query.cliente = parseId(filtros.clienteId, 'clienteId');
        if (filtros.vendedorId) query.vendedor = parseId(filtros.vendedorId, 'vendedorId');
        if (filtros.desde || filtros.hasta) {
            const rango: Record<string, Date> = {};
            if (filtros.desde) rango.$gte = this.fecha(filtros.desde, 'desde');
            // "hasta" incluye todo ese día: se toma el inicio del día siguiente como límite exclusivo
            if (filtros.hasta) rango.$lt = new Date(this.fecha(filtros.hasta, 'hasta').getTime() + UN_DIA_MS);
            if (rango.$gte && rango.$lt && rango.$gte >= rango.$lt) {
                throw new BadRequestError('La fecha "desde" no puede ser posterior a "hasta"');
            }
            query.fechaContacto = rango;
        }

        // Un cliente solo ve sus propias compras, filtre lo que filtre
        if (actor?.rol === 'cliente') query.cliente = this.clienteDelActor(actor);

        return this.repository.findAll(query);
    }

    async findOne(id: string, actor?: Actor) {
        const venta = await this.repository.findOne({ _id: parseId(id) });
        // A un cliente, una venta ajena se le informa como inexistente (no revela que existe)
        if (!venta || (actor?.rol === 'cliente' && !venta.cliente._id.equals(this.clienteDelActor(actor)))) {
            throw new NotFoundError('Venta no encontrada');
        }
        return venta;
    }

    async create(input: Record<string, any>, actor?: Actor) {
        if (actor?.rol === 'cliente') {
            // Pedido hecho por el cliente: siempre a su nombre, pendiente y sin vendedor asignado
            const { vendedorId, ...pedido } = input;
            input = { ...pedido, clienteId: this.clienteDelActor(actor).toHexString() };
        }
        if (!input.clienteId) throw new BadRequestError('clienteId es obligatorio');

        const { data, items } = await this.resolverRelaciones(input);
        // Toda venta nace pendiente; se concreta después con POST /ventas/:id/concretar
        data.estado = 'pendiente';
        data.fechaContacto ??= new Date();

        const creada = await this.repository.addConItems(data, items ?? []);
        return this.findOne(creada._id.toHexString());
    }

    async update(id: string, input: Record<string, any>) {
        const ventaId = parseId(id);
        if (CAMPOS_DEL_PEDIDO.some((campo) => campo in input)) {
            const actual = await this.repository.findOne({ _id: ventaId });
            if (actual && actual.estado !== undefined && actual.estado !== 'pendiente') {
                throw new ConflictError(`La venta está ${actual.estado}: ya no se pueden cambiar el cliente, los productos ni los servicios`);
            }
        }
        const { data, items } = await this.resolverRelaciones(input);

        const actualizada = await this.repository.updateConItems(ventaId, data, items);
        if (!actualizada) throw new NotFoundError('Venta no encontrada');
        return this.findOne(id);
    }

    async remove(id: string) {
        const ventaId = parseId(id);
        const actual = await this.repository.findOne({ _id: ventaId });
        if (!actual) throw new NotFoundError('Venta no encontrada');
        if (descontoStock(actual.estado)) {
            throw new ConflictError(`No se puede eliminar una venta ${actual.estado}. Si hace falta anularla, cancelala.`);
        }
        await this.repository.delete({ _id: ventaId });
    }

    /**
     * CUU Concretar Venta: un vendedor confirma un pedido pendiente.
     * Verifica que haya stock de todos los productos, lo descuenta, asigna el vendedor
     * y registra la fecha de venta. Si falta stock de algo, no cambia nada.
     */
    async concretar(id: string, input: ConcretarInput = {}, actor?: Actor) {
        const venta = await this.ventaParaGestionar(id);
        this.exigirTransicion(venta, 'concretada');

        const vendedorId = await this.vendedorQueConcreta(venta, input, actor);
        const hoy = new Date();
        if (input.fechaEntrega && inicioDelDia(input.fechaEntrega) < inicioDelDia(hoy)) {
            throw new BadRequestError('La fecha de entrega no puede ser anterior a hoy');
        }

        // Cantidades pedidas por producto (un producto puede repetirse en varios renglones)
        const pedidos = new Map<string, { producto: Producto; cantidad: number }>();
        for (const item of venta.items) {
            const clave = item.producto._id.toHexString();
            const pedido = pedidos.get(clave) ?? { producto: item.producto, cantidad: 0 };
            pedido.cantidad += item.cantidad;
            pedidos.set(clave, pedido);
        }

        const faltantes = [...pedidos.values()]
            .filter(({ producto, cantidad }) => producto.stock < cantidad)
            .map(({ producto, cantidad }) => `${producto.nombre} (pedido ${cantidad}, disponible ${producto.stock})`);
        if (faltantes.length > 0) {
            throw new ConflictError(`Stock insuficiente: ${faltantes.join('; ')}`);
        }

        for (const { producto, cantidad } of pedidos.values()) {
            producto.stock -= cantidad;
        }

        await this.repository.guardarCambios(venta, {
            estado: 'concretada',
            vendedor: vendedorId,
            fechaDeVenta: hoy,
            ...(input.fechaEntrega !== undefined && { fechaEntrega: input.fechaEntrega }),
        });
        return this.findOne(id);
    }

    /**
     * Cancelación de la venta. Vendedor/admin pueden cancelar una venta pendiente o concretada
     * (si estaba concretada, el stock vuelve); el cliente solo puede cancelar sus pedidos pendientes.
     */
    async cancelar(id: string, actor?: Actor) {
        const venta = await this.ventaParaGestionar(id);

        if (actor?.rol === 'cliente') {
            if (!venta.cliente._id.equals(this.clienteDelActor(actor))) throw new NotFoundError('Venta no encontrada');
            if (venta.estado !== 'pendiente') {
                throw new ConflictError('Solo podés cancelar pedidos pendientes. Para anular una compra concretada comunicate con tu vendedor.');
            }
        }
        this.exigirTransicion(venta, 'cancelada');

        if (descontoStock(venta.estado)) {
            for (const item of venta.items) {
                item.producto.stock += item.cantidad;
            }
        }

        await this.repository.guardarCambios(venta, { estado: 'cancelada', fechaCancelacion: new Date() });
        return this.findOne(id, actor);
    }

    private async ventaParaGestionar(id: string) {
        const venta = await this.repository.findParaGestionar(parseId(id));
        if (!venta) throw new NotFoundError('Venta no encontrada');
        return venta;
    }

    private exigirTransicion(venta: Venta, hacia: EstadoVenta) {
        if (!puedePasar(venta.estado, hacia)) throw new ConflictError(motivoRechazo(venta.estado, hacia));
    }

    /** Un vendedor concreta a su nombre; el admin indica el vendedor (o se usa el ya asignado). */
    private async vendedorQueConcreta(venta: Venta, input: ConcretarInput, actor: Actor) {
        let id: ObjectId | undefined;
        if (actor?.rol === 'vendedor') {
            id = toObjectId(actor.vendedorId) ?? undefined;
            if (!id) throw new ForbiddenError('Tu usuario no tiene una ficha de vendedor asociada');
        } else if (input.vendedorId) {
            id = parseId(input.vendedorId, 'vendedorId');
        } else {
            id = venta.vendedor?._id;
        }
        if (!id) throw new BadRequestError('Indicá qué vendedor concreta la venta (vendedorId)');
        if (!(await this.vendedorRepository.findOne({ _id: id }))) throw new BadRequestError('El vendedor indicado no existe');
        return id;
    }

    /** Fecha AAAA-MM-DD (día en Argentina) o ISO completa → Date; 400 si no es válida. */
    private fecha(valor: string, campo: string): Date {
        const fecha = leerFecha(valor);
        if (Number.isNaN(fecha.getTime())) throw new BadRequestError(`${campo} no es una fecha válida (usá AAAA-MM-DD)`);
        return fecha;
    }

    /** clienteId del usuario cliente logueado (403 si su usuario no tiene ficha de cliente). */
    private clienteDelActor(actor: NonNullable<Actor>) {
        const id = toObjectId(actor.clienteId);
        if (!id) throw new ForbiddenError('Tu usuario no tiene una ficha de cliente asociada');
        return id;
    }

    /** Traduce los ids recibidos en referencias válidas; lanza 400 si algo no existe. */
    private async resolverRelaciones(input: Record<string, any>) {
        const data: Record<string, any> = {};
        let items: ItemVentaInput[] | undefined;

        for (const campo of CAMPOS_SIMPLES) {
            if (campo in input) data[campo] = input[campo];
        }

        if ('clienteId' in input) {
            const id = parseId(input.clienteId, 'clienteId');
            if (!(await this.clienteRepository.findOne({ _id: id }))) throw new BadRequestError('El cliente indicado no existe');
            data.cliente = id;
        }

        if ('vendedorId' in input) {
            if (input.vendedorId === null || input.vendedorId === '') {
                data.vendedor = null;
            } else {
                const id = parseId(input.vendedorId, 'vendedorId');
                if (!(await this.vendedorRepository.findOne({ _id: id }))) throw new BadRequestError('El vendedor indicado no existe');
                data.vendedor = id;
            }
        }

        // items: [{ productoId, cantidad }]. También se acepta productoIds (formato anterior, cantidad 1)
        const itemsInput: { productoId: unknown; cantidad?: unknown }[] | undefined =
            input.items ?? (Array.isArray(input.productoIds)
                ? input.productoIds.map((productoId: unknown) => ({ productoId, cantidad: 1 }))
                : undefined);

        if (itemsInput !== undefined) {
            if (!Array.isArray(itemsInput)) throw new BadRequestError('items debe ser una lista');
            items = [];
            for (const item of itemsInput) {
                const productoId = toObjectId(item?.productoId);
                const cantidad = Number(item?.cantidad);
                if (!productoId) throw new BadRequestError('productoId inválido en items');
                if (!Number.isInteger(cantidad) || cantidad < 1) {
                    throw new BadRequestError('La cantidad de cada ítem debe ser un entero mayor a 0');
                }

                const producto = await this.productoRepository.findOne({ _id: productoId });
                if (!producto) throw new BadRequestError(`El producto ${productoId.toHexString()} no existe`);

                items.push({ producto: productoId, cantidad, precioUnitario: producto.importe_venta });
            }
        }

        if ('servicioIds' in input) {
            if (!Array.isArray(input.servicioIds)) throw new BadRequestError('servicioIds debe ser una lista');
            const ids: ObjectId[] = [];
            for (const raw of input.servicioIds) {
                const id = parseId(raw, 'servicioId');
                if (!(await this.servicioRepository.findOne({ _id: id }))) {
                    throw new BadRequestError(`El servicio ${id.toHexString()} no existe`);
                }
                ids.push(id);
            }
            data.servicios = ids;
        }

        return { data, items };
    }
}
