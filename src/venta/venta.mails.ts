import type { Venta } from './venta.entity.js';
import type { Mail } from '../shared/mail/mailer.js';

/**
 * Contenido de los mails que recibe el cliente sobre su venta.
 * Cada mail tiene versión HTML (con estilos en línea, que es lo que respetan los clientes de correo)
 * y versión de texto plano.
 */

export type ContenidoMail = Omit<Mail, 'para'>;

const VERDE = '#2E5B3B';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const fechaLarga = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });

/** Evita que un nombre con < o & rompa el HTML o inyecte contenido. */
export function escapar(texto: unknown): string {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

interface Renglon {
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
}

function renglones(venta: Venta): Renglon[] {
    return [...(venta.items ?? [])].map((item) => ({
        nombre: item.producto?.nombre ?? 'Producto',
        cantidad: item.cantidad,
        precio: item.precioUnitario,
        subtotal: item.cantidad * item.precioUnitario,
    }));
}

export function totalDeVenta(venta: Venta): number {
    return renglones(venta).reduce((total, r) => total + r.subtotal, 0);
}

function servicios(venta: Venta): string[] {
    return [...(venta.servicios ?? [])].map((s) => s.descripcion);
}

function tablaHtml(venta: Venta): string {
    const filas = renglones(venta)
        .map((r) => `
          <tr>
            <td style="padding:8px 0;border-top:1px solid #EEEAE0">${escapar(r.nombre)}</td>
            <td style="padding:8px;border-top:1px solid #EEEAE0;text-align:right">${r.cantidad}</td>
            <td style="padding:8px 0;border-top:1px solid #EEEAE0;text-align:right">${pesos.format(r.subtotal)}</td>
          </tr>`)
        .join('');
    const listaServicios = servicios(venta).length
        ? `<p style="margin:16px 0 0;font-size:14px"><strong>Servicios:</strong> ${servicios(venta).map(escapar).join(', ')} (se cotizan por hora).</p>`
        : '';
    if (!filas) return listaServicios;
    return `
      <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="color:#5B665F;font-size:12px;text-align:left">
            <th style="padding:8px 0">Producto</th><th style="padding:8px;text-align:right">Cant.</th><th style="padding:8px 0;text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 8px 0 0;text-align:right;border-top:2px solid #1B241F"><strong>Total</strong></td>
            <td style="padding:12px 0 0;text-align:right;border-top:2px solid #1B241F;font-size:18px"><strong>${pesos.format(totalDeVenta(venta))}</strong></td>
          </tr>
        </tfoot>
      </table>${listaServicios}`;
}

function tablaTexto(venta: Venta): string {
    const lineas = renglones(venta).map((r) => `- ${r.nombre} x ${r.cantidad}: ${pesos.format(r.subtotal)}`);
    if (lineas.length) lineas.push(`Total: ${pesos.format(totalDeVenta(venta))}`);
    if (servicios(venta).length) lineas.push(`Servicios: ${servicios(venta).join(', ')} (se cotizan por hora).`);
    return lineas.join('\n');
}

/** Arma el mail completo con el diseño común (encabezado, saludo, cuerpo, botón y pie). */
function plantilla(venta: Venta, opciones: { titulo: string; parrafos: string[]; enlace?: string | null; conDetalle?: boolean }): ContenidoMail {
    const nombre = venta.cliente?.nombre ?? '';
    const enlaceHtml = opciones.enlace
        ? `<p style="margin:24px 0 0"><a href="${escapar(opciones.enlace)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:${VERDE};color:#FFFFFF;text-decoration:none;font-weight:600">Ver mi pedido</a></p>`
        : '';
    const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#F5F3EC;font-family:Arial,Helvetica,sans-serif;color:#1B241F">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E2DED3;border-radius:16px;overflow:hidden">
      <div style="padding:16px 24px;background:#1F3A2A;color:#FFFFFF;font-size:18px;font-weight:700">Pauny CRM</div>
      <div style="padding:24px">
        <h1 style="margin:0 0 16px;font-size:20px">${escapar(opciones.titulo)}</h1>
        <p style="margin:0 0 12px;font-size:15px">Hola ${escapar(nombre)},</p>
        ${opciones.parrafos.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${p}</p>`).join('')}
        ${opciones.conDetalle === false ? '' : tablaHtml(venta)}
        ${enlaceHtml}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #E2DED3;font-size:12px;color:#5B665F">
        Este es un mensaje automático de Pauny CRM. Si tenés dudas, respondé este mail o comunicate con tu vendedor.
      </div>
    </div>
  </body>
</html>`;
    const texto = [
        `Hola ${nombre},`,
        '',
        opciones.parrafos.map(quitarEtiquetas).join('\n\n'),
        '',
        opciones.conDetalle === false ? '' : tablaTexto(venta),
        opciones.enlace ? `\nVer mi pedido: ${opciones.enlace}` : '',
        '\n--\nPauny CRM. Mensaje automático.',
    ].join('\n').replace(/\n{3,}/g, '\n\n');
    return { asunto: opciones.titulo, html, texto };
}

function quitarEtiquetas(html: string): string {
    return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function nombreVendedor(venta: Venta): string | null {
    return venta.vendedor ? `${venta.vendedor.nombre} ${venta.vendedor.apellido}` : null;
}

/** El cliente envió un pedido desde el catálogo: queda pendiente hasta que un vendedor lo concrete. */
export function mailPedidoRecibido(venta: Venta, enlace?: string | null): ContenidoMail {
    return plantilla(venta, {
        titulo: 'Recibimos tu pedido',
        parrafos: [
            'Recibimos tu pedido y quedó <strong>pendiente</strong>. Un vendedor va a confirmar el stock, el precio final y la fecha de entrega, y te avisamos por este medio cuando esté concretado.',
        ],
        enlace,
    });
}

/** CUU Concretar Venta: el vendedor confirmó la venta y se descontó el stock. */
export function mailVentaConcretada(venta: Venta, enlace?: string | null): ContenidoMail {
    const vendedor = nombreVendedor(venta);
    const entrega = venta.fechaEntrega
        ? `La entrega está prevista para el <strong>${escapar(fechaLarga.format(new Date(venta.fechaEntrega)))}</strong>.`
        : 'Tu vendedor se va a comunicar con vos para coordinar la entrega.';
    return plantilla(venta, {
        titulo: '¡Tu compra fue confirmada!',
        parrafos: [
            `Confirmamos tu compra${vendedor ? ` con <strong>${escapar(vendedor)}</strong>` : ''}. ${entrega}`,
            'Este es el detalle:',
        ],
        enlace,
    });
}

/** La venta se canceló (por el cliente o por la empresa). */
export function mailVentaCancelada(venta: Venta, enlace?: string | null): ContenidoMail {
    return plantilla(venta, {
        titulo: 'Tu pedido fue cancelado',
        parrafos: [
            'Te avisamos que este pedido fue <strong>cancelado</strong> y no se va a entregar. Si no lo pediste vos o querés volver a hacerlo, comunicate con tu vendedor o armá un pedido nuevo desde el catálogo.',
            'Este era el detalle:',
        ],
        enlace,
    });
}
