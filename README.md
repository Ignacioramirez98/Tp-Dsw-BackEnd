# CRM Backend - Tp-Dsw

App backend desarrollada para la facultad UTN en la materia de Desarrollo de Software 2026.

Sistema de gestión de relaciones con clientes (CRM) con autenticación JWT, roles basados en acceso, validación de datos y filtros avanzados.

**App desplegada:** https://pauny-crm.vercel.app (API: https://pauny-crm-api.vercel.app) · **Documentación del proyecto** (usuarios de prueba, casos de uso, API, tests, minutas): [repo del grupo](https://github.com/miltonsark/TP-DSW-COM-304-Dominio-Sarkissian/blob/main/docs/README.md)

---

## Inicio Rápido

### Requisitos Previos

- **Node.js** v18+ (descargar de https://nodejs.org/)
- **npm** (viene incluido con Node.js)
- **MongoDB Atlas** (base de datos en la nube - conexión ya configurada)

### Instalación

#### 1 Clonar el repositorio

```bash
git clone https://github.com/miltonsark/Tp-Dsw-BackEnd.git
cd Tp-Dsw-BackEnd
```

#### 2 Instalar dependencias

```bash
npm install
```

Esto descargará todas las librerías necesarias (Express, MongoDB, JWT, etc.)

#### 3 Configurar variables de entorno

Copiar el archivo de ejemplo y completar los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
| --- | --- |
| `MONGO_URI` | Connection string de MongoDB Atlas (pedirla al equipo, **nunca** commitearla) |
| `NODE_ENV` | `development`, `production` o `test` |
| `PORT` | Puerto del servidor (por defecto `3000`) |
| `JWT_SECRET` | **Obligatorio.** Clave para firmar los tokens. Generar una con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Duración del token (ej. `1h`) |
| `FRONTEND_URL` | URL del frontend habilitada en CORS (ej. `http://localhost:4200`). En producción: la URL exacta del front desplegado, con `https://` y sin barra final. Admite varias separadas por coma. También se usa para el enlace "Ver mi pedido" de los mails |
| `BLOB_READ_WRITE_TOKEN` | Solo en Vercel (la agrega Vercel al conectar un Blob store). Con ella, las imágenes se guardan en Vercel Blob; sin ella, en `public/uploads` |
| `DNS_SERVERS` | Opcional. DNS para resolver la URL `mongodb+srv` de Atlas. Por defecto en desarrollo se usan `8.8.8.8,1.1.1.1` (evita `querySrv ECONNREFUSED` en algunas redes); `sistema` usa los DNS de la red. En Vercel no hace falta |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Opcionales. Servidor de correo para avisar al cliente por mail (ver [Avisos por mail](#avisos-por-mail)). Si faltan, la app funciona igual y no manda mails |

El servidor no arranca si falta `MONGO_URI` o `JWT_SECRET`.

#### 4 Cargar datos iniciales (opcional)

Los usuarios administradores no se pueden crear desde la API. Para una base nueva:

```bash
npm run seed            # crea el usuario admin
npm run seed -- --demo  # además carga datos de ejemplo y un usuario por rol
```

El script no duplica registros: si ya existen, los deja como están. Las credenciales del admin se toman de `SEED_ADMIN_USUARIO` y `SEED_ADMIN_PASSWORD` del `.env` (por defecto `admin` / `admin123`).

Usuarios de prueba que crea `--demo`:

| Usuario | Contraseña | Rol |
| --- | --- | --- |
| `admin` | `admin123` | admin |
| `vendedor` | `vendedor123` | vendedor |
| `operario` | `operario123` | operario |
| `cliente` | `cliente123` | cliente |

---

## Scripts Disponibles

| Comando | Qué hace |
| --- | --- |
| `npm run start:dev` | Compila y levanta el servidor en `http://localhost:3000` con recarga automática |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Levanta el servidor ya compilado (`dist/src/server.js`) |
| `npm test` | Corre todos los tests (unitarios + integración) |
| `npm run test:unit` | Solo tests unitarios (no necesitan base de datos) |
| `npm run test:integration` | Solo el test de integración (levanta una base MongoDB en memoria) |
| `npm run e2e:server` | API de prueba para los tests end-to-end del front: base MongoDB en memoria con datos fijos (`cliente` / `cliente123`) en el puerto 3000. No usa el `.env` ni toca la base real |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:ui` | Interfaz visual de Vitest |
| `npm run seed` | Crea el usuario admin (`-- --demo` para datos de ejemplo) |

### Tests

- **Unitarios** (`src/tests/unit`): lógica de ventas, validaciones Zod, login y control de roles. Usan repositorios en memoria.
- **Integración** (`src/tests/integration`): levanta la API completa con [supertest](https://github.com/ladjs/supertest) contra una base MongoDB de prueba (`crm_test`) y recorre el flujo login → alta de datos → venta → detalle, el CUU Concretar Venta (stock, estados y permisos), el CUU Realizar facturación (comprobante, numeración, doble facturación simultánea y permisos) y el filtro por rango de fechas. Por defecto usa `mongodb-memory-server`, que **descarga MongoDB la primera vez** (puede tardar un par de minutos). Para usar otro servidor de prueba: `TEST_MONGO_URI=mongodb://... npm run test:integration`. Nunca usa la base real.

---

## Estructura del Proyecto

```
src/
├── app.ts                    # Arma la app Express (middlewares + rutas)
├── server.ts                 # Conecta a la base y levanta el servidor
├── cliente/                  # Módulo de Clientes (CRUD + Login)
├── vendedor/                # Módulo de Vendedores
├── producto/                # Módulo de Productos
├── servicio/                # Módulo de Servicios
├── localidad/               # Módulo de Localidades
├── operario/                # Módulo de Operarios
├── venta/                   # Módulo de Ventas
├── factura/                 # Facturación de ventas concretadas
├── middleware/
│   └── roleAuth.middleware.ts # Autenticación y Control de Roles
├── validators/
│   └── cliente.validator.ts  # Validación con Zod
├── shared/
│   ├── repository.ts        # Interfaz genérica para repositorios
│   └── db/conn.ts          # Conexión a MongoDB
└── tests/
    ├── cliente.test.ts
    ├── integration.test.ts
    └── validation.test.ts
```

---

## Autenticación

### Login

```bash
POST http://localhost:3000/usuarios/login
Content-Type: application/json

{
  "usuario": "admin",
  "contraseña": "admin123"
}
```

**Respuesta:**

```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { "usuarioId": "...", "usuario": "admin", "rol": "admin" }
}
```

### Usar el Token

Agregar a todas las peticiones protegidas:

```bash
Authorization: Bearer <token>
```

---

## Endpoints Principales

### Clientes

- `POST /clientes` - Registrar nuevo cliente (público)
- `GET /clientes` - Listar clientes (con filtros opcionales)
- `GET /clientes/:id` - Obtener detalles de cliente
- `PUT /clientes/:id` - Actualizar cliente
- `DELETE /clientes/:id` - Eliminar cliente

### Productos

- `GET /productos` - Listar productos (con filtros)
- `POST /productos` - Crear producto
- `PUT /productos/:id` - Actualizar producto
- `DELETE /productos/:id` - Eliminar producto

### Ventas

- `GET /ventas` - Listar ventas, de la más nueva a la más vieja. Filtros: `estado`, `clienteId`, `vendedorId` y rango de fecha del pedido `desde` / `hasta` (AAAA-MM-DD, ambos días incluidos)
- `GET /ventas/:id` - Detalle completo (cliente con localidad, vendedor, productos y servicios)
- `POST /ventas` - Crear venta (siempre nace `pendiente`)
- `PUT/PATCH /ventas/:id` - Actualizar venta (cliente, productos y servicios solo mientras está pendiente)
- `POST /ventas/:id/concretar` - **CUU Concretar Venta** (ver abajo)
- `POST /ventas/:id/cancelar` - Cancelar la venta
- `POST /ventas/:id/facturar` - **CUU Realizar facturación** (ver abajo)
- `GET /ventas/:id/factura` - La factura de la venta (`404` si todavía no se facturó)
- `DELETE /ventas/:id` - Eliminar venta (solo pendientes o canceladas)

### Facturas

- `GET /facturas` - Listar, de la más nueva a la más vieja. Filtros: `clienteId` y rango de fecha de emisión `desde` / `hasta` (AAAA-MM-DD, ambos días incluidos). Admin y vendedor ven todas; el cliente, solo las suyas
- `GET /facturas/:id` - Detalle del comprobante (una factura ajena responde `404` al cliente)

Las facturas **no se crean, editan ni borran** por estos endpoints: se emiten con `POST /ventas/:id/facturar` y son inmutables.

### Usuarios (solo admin)

- `POST /usuarios` - Crear usuario (`usuario`, `contraseña`, `rol` y, según el rol, `clienteId`, `vendedorId` u `operarioId`). Los admins no se crean por API
- `GET /usuarios` y `GET /usuarios/:id` - Listar y ver (la contraseña nunca se devuelve)
- `PATCH /usuarios/:id` - Editar `usuario`, `contraseña`, `activo`, `rol` y perfil vinculado. Cambiar el rol exige el perfil que le corresponde (por ejemplo `rol: "vendedor"` + `vendedorId`)
- `PATCH /usuarios/:id/desactivar` y `PATCH /usuarios/:id/activar` - Bloquear o devolver el acceso (un usuario desactivado no puede iniciar sesión)
- `DELETE /usuarios/:id` - Eliminar. Un usuario vinculado a un cliente, vendedor u operario **no se elimina** (409): se desactiva

Reglas: un admin no puede desactivarse ni eliminarse a sí mismo, ni cambiar de rol. Cuando se elimina un cliente, vendedor u operario, su usuario queda desactivado y sin vínculo, así que después se puede eliminar. Un perfil solo puede tener un usuario (409 si ya tiene).

Un token ya emitido sigue valiendo hasta que vence, aunque se desactive al usuario (el bloqueo se aplica al iniciar sesión).

### Solicitudes de servicio

- `GET /solicitudes-servicio` - Listar, de la más nueva a la más vieja. Filtros: `estado` y rango `desde` / `hasta` (AAAA-MM-DD). Cada rol ve lo suyo (ver abajo)
- `GET /solicitudes-servicio/:id` - Detalle (cliente, servicio y operario)
- `POST /solicitudes-servicio` - **CUU Solicitar Servicio** (solo cliente): `servicioId`, `horasEstimadas`, `fechaPreferida` y `observaciones` opcionales
- `POST /solicitudes-servicio/:id/aceptar` - Un operario (o el admin) se hace cargo
- `POST /solicitudes-servicio/:id/finalizar` - Registra el trabajo hecho; `horasReales` opcional (por defecto las estimadas)
- `POST /solicitudes-servicio/:id/cancelar` - Cancela; `motivo` opcional

#### Ciclo de vida de una solicitud

```
pendiente ──aceptar──▶ aceptada ──finalizar──▶ finalizada
    │                     │
    └──────cancelar───────┴──▶ cancelada
```

- Nace siempre `pendiente`, a nombre del cliente de la sesión. Guarda el precio por hora del servicio al momento del pedido y calcula `importeEstimado`; al finalizar, `importeFinal = horasReales × importePorHora`.
- El responsable es el operario del servicio. Si el servicio no tiene operario, cualquiera puede aceptarla y queda a su nombre; el admin puede indicar `operarioId`.
- El operario ve las solicitudes de sus servicios y las que no tienen responsable; el cliente, solo las suyas (una ajena responde `404`).
- El cliente cancela solo sus solicitudes `pendientes`; operario y admin también las `aceptadas`. Una transición no permitida responde `409`.
- No se puede eliminar un cliente, servicio u operario que tenga solicitudes.

#### Ciclo de vida de una venta

```
pendiente ──concretar──▶ concretada ──facturar──▶ facturada
    │                        │
    └───────cancelar─────────┴──▶ cancelada
```

- **Concretar** (vendedor o admin): verifica que haya stock de todos los productos y lo descuenta, deja la venta a nombre del vendedor (el admin indica `vendedorId`) y registra la fecha de venta. Acepta `fechaEntrega` opcional (no anterior a hoy). Si falta stock responde `409` con el detalle (`Stock insuficiente: Tractor (pedido 2, disponible 1)`) y no cambia nada.
- **Cancelar**: vendedor o admin cancelan una venta pendiente o concretada; si estaba concretada, el stock vuelve. El cliente solo puede cancelar sus pedidos pendientes.
- **Facturar** (vendedor o admin): solo una venta `concretada`. Emite la factura y la venta pasa a `facturada`; desde ahí ya no se puede cancelar ni eliminar.
- Una transición no permitida (ej. concretar una venta cancelada) responde `409`.

#### Facturación

La factura toma como entrada la venta concretada:

- **Renglones**: uno por ítem de la venta, con el precio al que se vendió. Los precios de los productos se toman como **netos**: el IVA (21 %) se suma y se discrimina, así que `total = subtotal + iva` (redondeado a dos decimales).
- **Servicios**: no se facturan desde la venta, porque se cotizan por hora (ver solicitudes de servicio). Una venta sin productos no se puede facturar (`409`).
- **Comprobante inmutable**: guarda una copia de los datos del cliente (nombre, DNI, razón social, dirección, localidad y mail) y de los renglones, y quién la emitió (`emitidaPor`). Si después cambia un producto, un precio o el cliente, la factura no se altera.
- **Numeración**: correlativa con punto de venta, `0001-00000001`, con un contador atómico en la base. Los números no se reutilizan.
- **Una sola factura por venta**: facturar de nuevo responde `409` (`La venta ya está facturada`). Si dos personas facturan a la vez, solo una lo logra y la otra recibe `409`.
- Una venta que no está `concretada` responde `409` (`No se puede facturar una venta pendiente`).
- La anulación de facturas (nota de crédito) queda fuera de este alcance.

#### Avisos por mail

El cliente recibe un mail cuando:

| Evento | Asunto |
|---|---|
| Envía un pedido desde el catálogo | Recibimos tu pedido |
| Se concreta su venta | ¡Tu compra fue confirmada! (con productos, total, vendedor y fecha de entrega) |
| Se cancela su venta | Tu pedido fue cancelado |

- Concretar y cancelar aceptan `"notificarCliente": false` en el body para no mandar el mail (por defecto se manda).
- Las respuestas de crear, concretar y cancelar incluyen `notificacion`, por ejemplo `{ "estado": "enviado", "para": "juan@campo.com" }`. Estados: `enviado`, `fallido` (el SMTP rechazó: la venta se guarda igual), `desactivado` (SMTP sin configurar), `sin_mail` (el cliente no tiene mail) y `omitido` (se pidió no avisar).
- El mail se envía después de guardar: **si falla, la venta no se pierde**.

**Configurar Gmail (gratis):**

1. En la cuenta de Google que va a enviar los mails, activar la [verificación en 2 pasos](https://myaccount.google.com/signinoptions/twosv).
2. Crear una [contraseña de aplicación](https://myaccount.google.com/apppasswords) (nombre: "Pauny CRM"). Google muestra 16 letras.
3. En el `.env` (y en las variables de Vercel al desplegar):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=la-cuenta@gmail.com
SMTP_PASS=las 16 letras (con o sin espacios)
MAIL_FROM=Pauny CRM <la-cuenta@gmail.com>
```

Gmail permite unos 500 mails por día. Cualquier otro proveedor SMTP sirve cambiando estas variables. Los tests y `npm run e2e:server` nunca mandan mails, aunque el `.env` tenga SMTP configurado.

### Y más...

Módulos: Vendedores, Servicios, Localidades, Operarios

---

## Roles y Permisos

Todas las rutas (salvo el login y el alta de cliente) requieren el header `Authorization: Bearer <token>`.
"Propio" significa que ese rol solo accede a su propio registro; si pide otro, la API responde 403.

| Recurso | admin | vendedor | operario | cliente |
| --- | --- | --- | --- | --- |
| Localidades | ABM | ver | ver | ver |
| Productos | ABM | ver | ver | ver |
| Servicios | ABM | ver | crear y editar | ver |
| Clientes | ABM | ver, crear y editar | ver | ver y editar el propio |
| Vendedores | ABM | ver; editar el propio | — | — |
| Operarios | ABM | ver | ver; editar el propio | — |
| Solicitudes de servicio | ver todas, aceptar, finalizar y cancelar | — | ver las de sus servicios y las sin responsable; aceptar, finalizar y cancelar | ver las propias; pedir un servicio y cancelar uno propio pendiente |
| Ventas | ABM, concretar, cancelar y facturar | ver, crear, editar, concretar, cancelar y facturar | — | ver las propias; crear y cancelar un pedido propio pendiente |
| Facturas | ver todas | ver todas | — | ver las propias |
| Usuarios | ABM, activar y desactivar (no a sí mismo) | — | — | — |

Cuando un cliente crea una venta, la API la registra siempre a su nombre, en estado `pendiente` y sin vendedor, aunque envíe otros datos. El estado no se edita a mano: solo cambia con concretar, cancelar y facturar.

---

## Deploy en Vercel

La API corre en Vercel como función serverless: `api/index.js` usa el código compilado por `npm run build` (`dist/`) y abre la conexión a MongoDB una sola vez por instancia. `vercel.json` manda todas las rutas a esa función y sirve `public/` como archivos estáticos.

1. **Base de datos:** cluster de MongoDB Atlas con un usuario de lectura/escritura y `0.0.0.0/0` en *Network Access* (Vercel no tiene IP fija). Cargar datos con `npm run seed -- --demo` apuntando el `.env` a esa base: además de los datos, el seed crea los índices únicos.
2. **Proyecto en Vercel:** importar el repo, Framework Preset *Other*, Root Directory `./`. El build (`npm run build`) y la salida los define `vercel.json`.
3. **Variables de entorno** del proyecto:

| Variable | Valor |
|---|---|
| `MONGO_URI` | Cadena `mongodb+srv://...` de Atlas |
| `MONGO_DB_NAME` | `crm` |
| `JWT_SECRET` | Clave larga y aleatoria, distinta de la de desarrollo |
| `JWT_EXPIRES_IN` | Ej. `8h` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | URL del front desplegado, sin barra final (ej. `https://pauny-crm.vercel.app`) |
| `SMTP_*`, `MAIL_FROM` | Los de [Avisos por mail](#avisos-por-mail) |
| `BLOB_READ_WRITE_TOKEN` | Se agrega sola al crear un Blob store (*Storage → Blob*) y conectarlo al proyecto |

4. Después de agregar o cambiar variables, hacer *Redeploy*. Los errores se ven en la pestaña **Logs** del proyecto.

Comprobación rápida: `GET /productos` sin token tiene que responder `401` con `{"message":"Token no proporcionado"}` (la API está viva y conectada).

## Solución de Problemas

### Error: "Cannot find module 'dotenv'"

```bash
npm install
```

### Error: "ECONNREFUSED" (MongoDB)

- Verificar conexión a Internet
- Confirmar que `.env` tiene `MONGO_URI` válida
- Revisar credenciales en MongoDB Atlas

### Error: "Port 3000 already in use"

```bash
# Cambiar puerto en .env
PORT=3001
```

### Tests fallan

```bash
npm test
```

Si hay errores, verificar output del test

---

## Tecnologías Utilizadas

- **Express.js** - Framework web
- **TypeScript** - Lenguaje tipado
- **MongoDB + MikroORM** - Base de datos y ORM
- **JWT** - Autenticación
- **bcryptjs** - Hashing seguro
- **Zod** - Validación de esquemas
- **Nodemailer** - Envío de mails por SMTP
- **Vitest** - Testing
- **CORS** - Control de acceso

---

## Integrantes

- Milton Sarkissian
- Constanza Dominio

---
