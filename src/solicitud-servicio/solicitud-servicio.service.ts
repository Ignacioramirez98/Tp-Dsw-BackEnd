import { SolicitudServicioRepository } from './solicitud-servicio.repository.js';
import { ServicioRepository } from '../servicio/servicio.repository.js';
import { OperarioRepository } from '../operario/operario.repository.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../shared/errors.js';
import { motivoRechazo, puedePasar, type EstadoSolicitud } from './solicitud-servicio.estados.js';
import type { SolicitudServicio } from './solicitud-servicio.entity.js';
import type { AuthUser } from '../middleware/roleAuth.middleware.js';
import { parseId, toObjectId } from '../shared/utils/object-id.js';
import { UN_DIA_MS, inicioDelDia, leerFecha } from '../shared/utils/fechas.js';

export interface SolicitudFiltros {
    estado?: string;
    /** Rango de la fecha del pedido (fechaSolicitud), en formato AAAA-MM-DD; ambos extremos incluidos. */
    desde?: string;
    hasta?: string;
}

/** Quién hace la petición (null en usos internos/tests: sin restricciones). */
export type Actor = Pick<AuthUser, 'rol'> & Partial<Pick<AuthUser, 'clienteId' | 'operarioId'>> | null | undefined;

export interface CrearSolicitudInput {
    servicioId: string;
    horasEstimadas: number;
    fechaPreferida?: Date | null;
    observaciones?: string | null;
}

const redondear = (valor: number) => Math.round(valor * 100) / 100;

export class SolicitudServicioService {
    constructor(
        private readonly repository = new SolicitudServicioRepository(),
        private readonly servicioRepository = new ServicioRepository(),
        private readonly operarioRepository = new OperarioRepository(),
    ) {}

    findAll(filtros: SolicitudFiltros = {}, actor?: Actor) {
        const query: Record<string, unknown> = {};
        if (filtros.estado) query.estado = filtros.estado;
        if (filtros.desde || filtros.hasta) {
            const rango: Record<string, Date> = {};
            if (filtros.desde) rango.$gte = this.fecha(filtros.desde, 'desde');
            // "hasta" incluye todo ese día: se toma el inicio del día siguiente como límite exclusivo
            if (filtros.hasta) rango.$lt = new Date(this.fecha(filtros.hasta, 'hasta').getTime() + UN_DIA_MS);
            if (rango.$gte && rango.$lt && rango.$gte >= rango.$lt) {
                throw new BadRequestError('La fecha "desde" no puede ser posterior a "hasta"');
            }
            query.fechaSolicitud = rango;
        }

        // Un cliente solo ve las suyas; un operario, las de sus servicios y las que no tienen responsable
        if (actor?.rol === 'cliente') query.cliente = this.clienteDelActor(actor);
        if (actor?.rol === 'operario') {
            query.$or = [{ operario: this.operarioDelActor(actor) }, { operario: null }];
        }

        return this.repository.findAll(query);
    }

    async findOne(id: string, actor?: Actor) {
        const solicitud = await this.repository.findOne({ _id: parseId(id) });
        // Lo que el actor no puede ver se le informa como inexistente (no revela que existe)
        if (!solicitud || !this.puedeVer(solicitud, actor)) throw new NotFoundError('Solicitud no encontrada');
        return solicitud;
    }

    /** El cliente pide un servicio: nace pendiente, a su nombre y con el precio por hora actual. */
    async create(input: CrearSolicitudInput, actor?: Actor) {
        const clienteId = this.clienteDelActor(actor);

        const servicio = await this.servicioRepository.findOne({ _id: parseId(input.servicioId, 'servicioId') });
        if (!servicio) throw new BadRequestError('El servicio indicado no existe');

        const hoy = new Date();
        if (input.fechaPreferida && inicioDelDia(input.fechaPreferida) < inicioDelDia(hoy)) {
            throw new BadRequestError('La fecha preferida no puede ser anterior a hoy');
        }

        const creada = await this.repository.add({
            estado: 'pendiente',
            fechaSolicitud: hoy,
            fechaPreferida: input.fechaPreferida ?? null,
            horasEstimadas: input.horasEstimadas,
            importePorHora: servicio.importe_por_hora,
            importeEstimado: redondear(input.horasEstimadas * servicio.importe_por_hora),
            observaciones: input.observaciones ?? null,
            cliente: clienteId,
            servicio: servicio._id,
            operario: servicio.operario?._id ?? null,
        });
        return this.findOne(creada._id.toHexString(), actor);
    }

    /** Un operario (o el admin) se hace cargo de una solicitud pendiente. */
    async aceptar(id: string, input: { operarioId?: string | null } = {}, actor?: Actor) {
        const solicitud = await this.findOne(id, actor);
        this.exigirTransicion(solicitud, 'aceptada');

        const operarioId = await this.operarioQueAcepta(solicitud, input, actor);
        await this.repository.guardarCambios(solicitud, {
            estado: 'aceptada',
            operario: operarioId,
            fechaAceptacion: new Date(),
        });
        return this.findOne(id, actor);
    }

    /** Se realizó el trabajo: se registran las horas reales (por defecto las estimadas) y el importe final. */
    async finalizar(id: string, input: { horasReales?: number } = {}, actor?: Actor) {
        const solicitud = await this.findOne(id, actor);
        this.exigirTransicion(solicitud, 'finalizada');

        const horasReales = input.horasReales ?? solicitud.horasEstimadas;
        await this.repository.guardarCambios(solicitud, {
            estado: 'finalizada',
            horasReales,
            importeFinal: redondear(horasReales * solicitud.importePorHora),
            fechaFinalizacion: new Date(),
        });
        return this.findOne(id, actor);
    }

    /**
     * Cancelación. El cliente solo cancela sus solicitudes pendientes; operario y admin
     * pueden cancelar también una aceptada, con un motivo opcional.
     */
    async cancelar(id: string, input: { motivo?: string | null } = {}, actor?: Actor) {
        const solicitud = await this.findOne(id, actor);

        if (actor?.rol === 'cliente' && solicitud.estado !== 'pendiente') {
            throw new ConflictError('Solo podés cancelar solicitudes pendientes. Para anular una ya aceptada comunicate con la empresa.');
        }
        this.exigirTransicion(solicitud, 'cancelada');

        await this.repository.guardarCambios(solicitud, {
            estado: 'cancelada',
            motivoCancelacion: input.motivo ?? null,
            fechaCancelacion: new Date(),
        });
        return this.findOne(id, actor);
    }

    private exigirTransicion(solicitud: SolicitudServicio, hacia: EstadoSolicitud) {
        if (!puedePasar(solicitud.estado, hacia)) throw new ConflictError(motivoRechazo(solicitud.estado, hacia));
    }

    private puedeVer(solicitud: SolicitudServicio, actor: Actor) {
        if (actor?.rol === 'cliente') return solicitud.cliente._id.equals(this.clienteDelActor(actor));
        if (actor?.rol === 'operario') {
            return !solicitud.operario || solicitud.operario._id.equals(this.operarioDelActor(actor));
        }
        return true;
    }

    /** Un operario acepta a su nombre; el admin indica el operario (o se usa el ya asignado). */
    private async operarioQueAcepta(solicitud: SolicitudServicio, input: { operarioId?: string | null }, actor: Actor) {
        if (actor?.rol === 'operario') return this.operarioDelActor(actor);

        const id = input.operarioId ? parseId(input.operarioId, 'operarioId') : solicitud.operario?._id;
        if (!id) throw new BadRequestError('Indicá qué operario se hace cargo (operarioId)');
        if (!(await this.operarioRepository.findOne({ _id: id }))) throw new BadRequestError('El operario indicado no existe');
        return id;
    }

    /** Fecha AAAA-MM-DD (día en Argentina) o ISO completa → Date; 400 si no es válida. */
    private fecha(valor: string, campo: string): Date {
        const fecha = leerFecha(valor);
        if (Number.isNaN(fecha.getTime())) throw new BadRequestError(`${campo} no es una fecha válida (usá AAAA-MM-DD)`);
        return fecha;
    }

    /** clienteId del usuario cliente logueado (403 si no es cliente o no tiene ficha). */
    private clienteDelActor(actor: Actor) {
        const id = toObjectId(actor?.clienteId);
        if (actor?.rol !== 'cliente' || !id) throw new ForbiddenError('Tu usuario no tiene una ficha de cliente asociada');
        return id;
    }

    /** operarioId del usuario operario logueado (403 si su usuario no tiene ficha de operario). */
    private operarioDelActor(actor: NonNullable<Actor>) {
        const id = toObjectId(actor.operarioId);
        if (!id) throw new ForbiddenError('Tu usuario no tiene una ficha de operario asociada');
        return id;
    }
}
