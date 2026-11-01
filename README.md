# CRM Backend - Tp-Dsw

App backend desarrollada para la facultad UTN en la materia de Desarrollo de Software 2026.

Sistema de gestión de relaciones con clientes (CRM) con autenticación JWT, roles basados en acceso, validación de datos y filtros avanzados.

---

## Inicio Rápido

### Requisitos Previos

- **Node.js** v18+ (descargar de https://nodejs.org/)
- **npm** (viene incluido con Node.js)
- **MongoDB Atlas** (base de datos en la nube - conexión ya configurada)

### Instalación

#### 1 Clonar el repositorio

```bash
git clone https://github.com/Ignacioramirez98/Tp-Dsw-BackEnd.git
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
| `FRONTEND_URL` | URL del frontend habilitada en CORS (ej. `http://localhost:4200`) |

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
| `npm run test:watch` | Tests en modo watch |
| `npm run test:ui` | Interfaz visual de Vitest |
| `npm run seed` | Crea el usuario admin (`-- --demo` para datos de ejemplo) |

### Tests

- **Unitarios** (`src/tests/unit`): lógica de ventas, validaciones Zod, login y control de roles. Usan repositorios en memoria.
- **Integración** (`src/tests/integration`): levanta la API completa con [supertest](https://github.com/ladjs/supertest) contra una base MongoDB de prueba (`crm_test`) y recorre el flujo login → alta de datos → venta → detalle. Por defecto usa `mongodb-memory-server`, que **descarga MongoDB la primera vez** (puede tardar un par de minutos). Para usar otro servidor de prueba: `TEST_MONGO_URI=mongodb://... npm run test:integration`. Nunca usa la base real.

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
POST http://localhost:3000/clientes/login
Content-Type: application/json

{
  "usuario": "testuser",
  "contraseña": "password123"
}
```

**Respuesta:**

```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "clienteId": "ObjectId(...)",
  "rol": "cliente"
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

- `POST /clientes` - Registrar nuevo cliente
- `POST /clientes/login` - Autenticar cliente
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

- `GET /ventas` - Listar ventas (con filtros: estado, clienteId)
- `POST /ventas` - Crear venta
- `PUT /ventas/:id` - Actualizar venta
- `DELETE /ventas/:id` - Eliminar venta

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
| Ventas | ABM | ver, crear y editar | — | ver las propias; crear un pedido propio |
| Usuarios | ABM | — | — | — |

Cuando un cliente crea una venta, la API la registra siempre a su nombre, en estado `pendiente` y sin vendedor, aunque envíe otros datos.

---

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
- **Vitest** - Testing
- **CORS** - Control de acceso

---

## Integrantes

- Milton Sarkissian
- Constanza Dominio

---
