import 'dotenv/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/** Un mail listo para enviar (con versión HTML y de texto plano). */
export interface Mail {
    para: string;
    asunto: string;
    html: string;
    texto: string;
}

/** Resultado de un envío. Un mail que no sale nunca corta la operación que lo pidió. */
export type EstadoEnvio = 'enviado' | 'fallido' | 'desactivado';

export interface Mailer {
    enviar(mail: Mail): Promise<EstadoEnvio>;
}

export interface ConfigMail {
    host: string;
    port: number;
    user: string;
    pass: string;
    remitente: string;
}

/**
 * Lee la configuración SMTP del entorno. Si falta SMTP_HOST, SMTP_USER o SMTP_PASS
 * devuelve null y el envío queda desactivado (cómodo para desarrollo y tests).
 */
export function leerConfigMail(env: NodeJS.ProcessEnv = process.env): ConfigMail | null {
    const host = env.SMTP_HOST?.trim();
    const user = env.SMTP_USER?.trim();
    // Gmail muestra la contraseña de aplicación en grupos de 4 con espacios: se aceptan tal cual
    const pass = env.SMTP_PASS?.replace(/\s+/g, '');
    if (!host || !user || !pass) return null;
    return {
        host,
        port: Number(env.SMTP_PORT) || 465,
        user,
        pass,
        remitente: env.MAIL_FROM?.trim() || `Pauny CRM <${user}>`,
    };
}

type CrearTransporte = (opciones: Parameters<typeof nodemailer.createTransport>[0]) => Pick<Transporter, 'sendMail'>;

/**
 * Envía mails por SMTP con Nodemailer (por ejemplo Gmail con contraseña de aplicación).
 * Cualquier proveedor SMTP sirve: solo cambian las variables de entorno.
 */
export class SmtpMailer implements Mailer {
    private transporte: Pick<Transporter, 'sendMail'> | null = null;

    constructor(
        private readonly config: ConfigMail | null = leerConfigMail(),
        private readonly crearTransporte: CrearTransporte = (opciones) => nodemailer.createTransport(opciones),
    ) {}

    get activo(): boolean {
        return this.config !== null;
    }

    async enviar(mail: Mail): Promise<EstadoEnvio> {
        if (!this.config) {
            if (process.env.NODE_ENV !== 'test') {
                console.info(`[mail] SMTP sin configurar: no se envió "${mail.asunto}" a ${mail.para}`);
            }
            return 'desactivado';
        }
        try {
            this.transporte ??= this.crearTransporte({
                host: this.config.host,
                port: this.config.port,
                secure: this.config.port === 465, // 465 = TLS directo; 587 = STARTTLS
                auth: { user: this.config.user, pass: this.config.pass },
                // Límites cortos: en Vercel la función espera el envío y no debe colgarse
                connectionTimeout: 10_000,
                greetingTimeout: 10_000,
                socketTimeout: 15_000,
            });
            await this.transporte.sendMail({
                from: this.config.remitente,
                to: mail.para,
                subject: mail.asunto,
                html: mail.html,
                text: mail.texto,
            });
            return 'enviado';
        } catch (error) {
            console.error(`[mail] No se pudo enviar "${mail.asunto}" a ${mail.para}:`, (error as Error).message);
            return 'fallido';
        }
    }
}

/** Mailer de la aplicación (uno solo: reutiliza la conexión SMTP entre envíos). */
export const mailer: Mailer = new SmtpMailer();
