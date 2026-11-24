import { describe, it, expect, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { SmtpMailer, leerConfigMail, type Mail } from '../../shared/mail/mailer.js';
import { VentaNotificador } from '../../venta/venta.notificador.js';
import { escapar, mailVentaConcretada, mailPedidoRecibido, totalDeVenta } from '../../venta/venta.mails.js';
import { VentaService } from '../../venta/venta.service.js';

/**
 * Tests unitarios de los avisos por mail al cliente: configuración SMTP, contenido de los mails,
 * a quién se mandan y que un mail que falla nunca haga fallar la venta. Sin SMTP real.
 */

function ventaDePrueba(extra: Record<string, unknown> = {}): any {
    return {
        _id: new ObjectId(),
        estado: 'concretada',
        cliente: { _id: new ObjectId(), nombre: 'Juan', apellido: 'Pérez', mail: 'juan@campo.com' },
        vendedor: { nombre: 'Laura', apellido: 'Martínez' },
        fechaEntrega: new Date('2026-12-04T03:00:00Z'),
        items: [
            { producto: { nombre: 'Tractor 120 HP' }, cantidad: 1, precioUnitario: 45_000_000 },
            { producto: { nombre: 'Rastra de discos 28' }, cantidad: 2, precioUnitario: 7_900_000 },
        ],
        servicios: [{ descripcion: 'Service de 250 horas' }],
        ...extra,
    };
}

/** Mailer falso que guarda lo que "envía". */
function mailerFalso(estado: 'enviado' | 'fallido' | 'desactivado' = 'enviado') {
    const enviados: Mail[] = [];
    return { enviados, enviar: vi.fn(async (mail: Mail) => { enviados.push(mail); return estado; }) };
}

describe('leerConfigMail', () => {
    it('sin host, usuario o contraseña el envío queda desactivado', () => {
        expect(leerConfigMail({})).toBeNull();
        expect(leerConfigMail({ SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'a@gmail.com' })).toBeNull();
    });

    it('acepta la contraseña de aplicación de Gmail con espacios y usa el puerto 465 por defecto', () => {
        const config = leerConfigMail({ SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'pauny@gmail.com', SMTP_PASS: 'abcd efgh ijkl mnop' });
        expect(config).toEqual({
            host: 'smtp.gmail.com', port: 465, user: 'pauny@gmail.com', pass: 'abcdefghijklmnop',
            remitente: 'Pauny CRM <pauny@gmail.com>',
        });
    });
});

describe('SmtpMailer', () => {
    const config = { host: 'smtp.gmail.com', port: 465, user: 'pauny@gmail.com', pass: 'x', remitente: 'Pauny <pauny@gmail.com>' };
    const mail: Mail = { para: 'juan@campo.com', asunto: 'Hola', html: '<p>Hola</p>', texto: 'Hola' };

    it('sin configuración no intenta enviar', async () => {
        const crear = vi.fn();
        expect(await new SmtpMailer(null, crear).enviar(mail)).toBe('desactivado');
        expect(crear).not.toHaveBeenCalled();
    });

    it('envía con el remitente configurado y TLS en el puerto 465', async () => {
        const sendMail = vi.fn().mockResolvedValue({});
        const crear = vi.fn().mockReturnValue({ sendMail });
        expect(await new SmtpMailer(config, crear).enviar(mail)).toBe('enviado');
        expect(crear).toHaveBeenCalledWith(expect.objectContaining({ host: 'smtp.gmail.com', port: 465, secure: true }));
        expect(sendMail).toHaveBeenCalledWith({ from: 'Pauny <pauny@gmail.com>', to: 'juan@campo.com', subject: 'Hola', html: '<p>Hola</p>', text: 'Hola' });
    });

    it('si el servidor SMTP rechaza, devuelve "fallido" en lugar de lanzar el error', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const crear = vi.fn().mockReturnValue({ sendMail: vi.fn().mockRejectedValue(new Error('Invalid login')) });
        expect(await new SmtpMailer(config, crear).enviar(mail)).toBe('fallido');
        error.mockRestore();
    });
});

describe('Contenido de los mails', () => {
    it('la confirmación de compra trae productos, total, vendedor, fecha de entrega y enlace', () => {
        const venta = ventaDePrueba();
        const { asunto, html, texto } = mailVentaConcretada(venta, 'https://pauny.vercel.app/ventas/1');

        expect(asunto).toBe('¡Tu compra fue confirmada!');
        expect(totalDeVenta(venta)).toBe(60_800_000);
        for (const contenido of [html, texto]) {
            expect(contenido).toContain('Tractor 120 HP');
            expect(contenido).toMatch(/60\.800\.000/);
            expect(contenido).toContain('Laura Martínez');
            expect(contenido).toContain('4 de diciembre de 2026');
            expect(contenido).toContain('https://pauny.vercel.app/ventas/1');
            expect(contenido).toContain('Service de 250 horas');
        }
    });

    it('sin fecha de entrega avisa que el vendedor la coordina', () => {
        const { texto } = mailVentaConcretada(ventaDePrueba({ fechaEntrega: null }));
        expect(texto).toContain('coordinar la entrega');
    });

    it('escapa los datos del cliente para que no rompan ni inyecten HTML', () => {
        expect(escapar('<script>"x"&</script>')).toBe('&lt;script&gt;&quot;x&quot;&amp;&lt;/script&gt;');
        const { html } = mailPedidoRecibido(ventaDePrueba({ cliente: { nombre: '<b>Juan</b>', mail: 'j@c.com' } }));
        expect(html).toContain('Hola &lt;b&gt;Juan&lt;/b&gt;');
        expect(html).not.toContain('<b>Juan</b>');
    });
});

describe('VentaNotificador', () => {
    it('le manda el mail al cliente de la venta', async () => {
        const mailer = mailerFalso();
        const notificacion = await new VentaNotificador(mailer, () => null).ventaConcretada(ventaDePrueba());
        expect(notificacion).toEqual({ estado: 'enviado', para: 'juan@campo.com' });
        expect(mailer.enviados[0].asunto).toBe('¡Tu compra fue confirmada!');
    });

    it('si el cliente no tiene mail no intenta enviar', async () => {
        const mailer = mailerFalso();
        const venta = ventaDePrueba({ cliente: { nombre: 'Juan', mail: '' } });
        expect(await new VentaNotificador(mailer, () => null).ventaCancelada(venta)).toEqual({ estado: 'sin_mail' });
        expect(mailer.enviar).not.toHaveBeenCalled();
    });
});

describe('VentaService: avisos al concretar y cancelar', () => {
    function armar(estado: string, resultadoMail: 'enviado' | 'fallido' = 'enviado') {
        const venta: any = ventaDePrueba({ estado, vendedor: null, items: [{ producto: { _id: new ObjectId(), nombre: 'Tractor', stock: 5 }, cantidad: 1, precioUnitario: 100 }] });
        const vendedorId = new ObjectId();
        const repo = {
            findParaGestionar: async () => venta,
            findOne: async () => venta,
            guardarCambios: async (v: any, data: Record<string, unknown>) => Object.assign(v, data),
        };
        const vendedores = { findOne: async () => ({ _id: vendedorId }) };
        const mailer = mailerFalso(resultadoMail);
        const service = new VentaService(repo as any, {} as any, vendedores as any, {} as any, {} as any, new VentaNotificador(mailer, () => null));
        const actor = { rol: 'vendedor' as const, clienteId: null, vendedorId: vendedorId.toHexString() };
        return { service, venta, mailer, actor, id: venta._id.toHexString() };
    }

    it('al concretar avisa al cliente y devuelve el resultado del aviso', async () => {
        const { service, mailer, actor, id } = armar('pendiente');
        const { venta, notificacion } = await service.concretar(id, {}, actor);
        expect(venta.estado).toBe('concretada');
        expect(notificacion).toEqual({ estado: 'enviado', para: 'juan@campo.com' });
        expect(mailer.enviar).toHaveBeenCalledOnce();
    });

    it('con notificarCliente: false concreta sin mandar mail', async () => {
        const { service, mailer, actor, id } = armar('pendiente');
        const { notificacion } = await service.concretar(id, { notificarCliente: false }, actor);
        expect(notificacion).toEqual({ estado: 'omitido' });
        expect(mailer.enviar).not.toHaveBeenCalled();
    });

    it('si el mail falla, la venta queda concretada igual', async () => {
        const { service, actor, id, venta } = armar('pendiente', 'fallido');
        const resultado = await service.concretar(id, {}, actor);
        expect(venta.estado).toBe('concretada');
        expect(resultado.notificacion?.estado).toBe('fallido');
    });

    it('al cancelar también avisa al cliente', async () => {
        const { service, mailer, actor, id } = armar('pendiente');
        const { notificacion } = await service.cancelar(id, actor);
        expect(notificacion?.estado).toBe('enviado');
        expect(mailer.enviados[0].asunto).toBe('Tu pedido fue cancelado');
    });
});
