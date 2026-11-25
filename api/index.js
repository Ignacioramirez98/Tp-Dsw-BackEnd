/**
 * Punto de entrada para Vercel.
 *
 * En Vercel la app no queda escuchando un puerto: cada pedido llega a esta función.
 * Se usa el código ya compilado por `npm run build` (dist/) y la conexión a MongoDB se abre
 * una sola vez por instancia y se reutiliza en los pedidos siguientes.
 * En desarrollo se sigue usando `npm run start:dev` (src/server.ts).
 */
import { initializeORM } from '../dist/src/shared/db/conn.js';
import { createApp } from '../dist/src/app.js';

let app;

async function obtenerApp() {
    if (!app) {
        app = initializeORM()
            .then((orm) => createApp(orm))
            .catch((error) => {
                app = undefined; // el próximo pedido vuelve a intentar conectar
                throw error;
            });
    }
    return app;
}

export default async function handler(req, res) {
    try {
        const express = await obtenerApp();
        return express(req, res);
    } catch (error) {
        console.error('No se pudo iniciar la API:', error);
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ message: 'El servidor no pudo conectarse a la base de datos. Probá de nuevo en un momento.' }));
    }
}
