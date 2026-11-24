import type { Venta } from './venta.entity.js';
import { mailer as mailerPorDefecto, type EstadoEnvio, type Mailer } from '../shared/mail/mailer.js';
import { mailPedidoRecibido, mailVentaCancelada, mailVentaConcretada, type ContenidoMail } from './venta.mails.js';
import { config } from '../shared/config.js';

/**
 * Qué pasó con el aviso al cliente. La API lo devuelve para que el front le diga al vendedor
 * si el cliente se enteró o hay que avisarle por otro medio.
 * - enviado / fallido / desactivado: resultado del envío (desactivado = SMTP sin configurar)
 * - sin_mail: el cliente no tiene mail cargado
 * - omitido: quien hizo la operación eligió no avisar
 */
export type EstadoNotificacion = EstadoEnvio | 'sin_mail' | 'omitido';

export interface Notificacion {
    estado: EstadoNotificacion;
    para?: string;
}

export const NOTIFICACION_OMITIDA: Notificacion = { estado: 'omitido' };

/** Enlace a la venta en el front desplegado (si hay una URL https configurada, se prefiere esa). */
function enlaceAVenta(venta: Venta, origenes: string[] = config.frontendOrigins): string | null {
    const base = origenes.find((o) => o.startsWith('https://')) ?? origenes[0];
    return base ? `${base}/ventas/${venta._id.toHexString()}` : null;
}

/**
 * Avisos por mail al cliente sobre su venta. Separado de VentaService para que la lógica
 * de negocio no dependa de cómo se envían los mails, y para poder probarlo con un mailer falso.
 * Un mail que falla nunca hace fallar la venta: solo se informa en la respuesta.
 */
export class VentaNotificador {
    constructor(
        private readonly mailer: Mailer = mailerPorDefecto,
        private readonly enlace: (venta: Venta) => string | null = enlaceAVenta,
    ) {}

    pedidoRecibido(venta: Venta): Promise<Notificacion> {
        return this.enviar(venta, mailPedidoRecibido(venta, this.enlace(venta)));
    }

    ventaConcretada(venta: Venta): Promise<Notificacion> {
        return this.enviar(venta, mailVentaConcretada(venta, this.enlace(venta)));
    }

    ventaCancelada(venta: Venta): Promise<Notificacion> {
        return this.enviar(venta, mailVentaCancelada(venta, this.enlace(venta)));
    }

    private async enviar(venta: Venta, contenido: ContenidoMail): Promise<Notificacion> {
        const para = venta.cliente?.mail?.trim();
        if (!para) return { estado: 'sin_mail' };
        const estado = await this.mailer.enviar({ para, ...contenido });
        return { estado, para };
    }
}
