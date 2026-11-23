/**
 * Convierte el valor de FRONTEND_URL en la lista de orígenes permitidos por CORS.
 *
 * - Admite varias URLs separadas por coma (por ejemplo el front local y el desplegado).
 * - Saca espacios y la barra final: el navegador manda el origen sin barra, y una barra de más
 *   en la variable hace que CORS rechace todo sin dar ningún error claro.
 */
export function parseOrigins(valor: string | undefined, porDefecto = 'http://localhost:4200'): string[] {
    const origenes = (valor ?? '')
        .split(',')
        .map((o) => o.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    return origenes.length ? origenes : [porDefecto];
}
