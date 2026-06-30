# CRM Backend - Documentación de Requisitos

## Requisitos Técnicos de Regularidad

### ✅ Desarrollarse en JavaScript

- Backend implementado en **TypeScript** (superset de JavaScript)
- Compilado a JavaScript para ejecución

### ✅ Framework web con middlewares

- **Express.js** utilizado como framework principal
- Middlewares implementados:
  - `cors()` - Configurado para frontend en `http://localhost:4200`
  - `express.json()` - Parser de JSON
  - `protectRoute` - Middleware de autenticación JWT
  - `requireRole` - Middleware de control de roles
  - `sanitizeInput` - Sanitización de datos

### ✅ API REST

- Endpoints RESTful implementados para 7 módulos:
  - `/clientes` - Gestión de clientes
  - `/vendedores` - Gestión de vendedores
  - `/productos` - Gestión de productos
  - `/servicios` - Gestión de servicios
  - `/localidades` - Gestión de localidades
  - `/operarios` - Gestión de operarios
  - `/ventas` - Gestión de ventas
- Métodos: GET, POST, PUT, PATCH, DELETE

### ✅ Base de datos persistente externa

- **MongoDB Atlas** - Base de datos en la nube
- URL de conexión en `.env`
- No es una BD embebida

### ✅ ORM/ODM

- **MikroORM** con driver MongoDB
- Mapeo de objetos a documentos MongoDB
- Repositorio genérico `Repository<T>`

### ✅ Arquitectura en capas

Cada módulo tiene la estructura:

- **Entity** - Definición del modelo
- **Repository** - Acceso a datos
- **Controller** - Lógica de negocio
- **Routes** - Definición de rutas

### ✅ Validación de entrada y manejo de errores

- **Zod** para validación de esquemas
- Try-catch en funciones críticas
- Mensajes de error informativos
- Status HTTP apropiados (400, 401, 403, 404, 500)

### ✅ Dependencias registradas

- `package.json` con todas las dependencias
- `package-lock.json` para versionado
- Install automático con `npm install`

---

## Requisitos para Aprobación Directa o Examen

### ✅ Tests automatizados (1 por integrante)

Ubicados en `src/tests/`:

- **cliente.test.ts** - Tests unitarios de bcrypt y validación
- **integration.test.ts** - Tests de integración de configuración
- **validation.test.ts** - Tests de validación con Zod

Ejecutar con: `npm test`

### ✅ Login con autenticación

- Endpoint: `POST /clientes/login`
- Utiliza **JWT (jsonwebtoken)**
- Hashea contraseñas con **bcryptjs**
- Retorna token válido por 1 hora
- Token incluye rol del usuario

### ✅ 2+ niveles de acceso

Roles implementados:

1. **cliente** - Acceso básico de usuario
2. **vendedor** - Acceso a operaciones comerciales
3. **operario** - Acceso a tareas operacionales
4. **admin** - Acceso total (CRUD en todos los recursos)

### ✅ Protección de rutas por rol

Middleware `requireRole` aplicado en todas las rutas:

- Clientes: Lectura/escritura de clientes
- Vendedores: Gestión de vendedores (solo admin crea)
- Productos: Solo vendedor/admin puede ver
- Servicios: Solo vendedor/admin
- Localidades: Solo vendedor/admin
- Operarios: Solo operario/admin
- Ventas: Solo vendedor/admin

### ✅ Ambientes definidos con .env

Variables de entorno configuradas:

```
MONGO_URI=mongodb+srv://...
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1h
PORT=3000
FRONTEND_URL=http://localhost:4200
```

---

## Cómo Ejecutar

### Instalar dependencias

```bash
npm install
```

### Ejecutar en modo desarrollo

```bash
npm run start:dev
```

### Ejecutar tests

```bash
npm test
npm test:ui  # Con interfaz visual
```

### Build para producción

```bash
npm run build
```

---

## Estructura del Proyecto

```
src/
├── app.ts                    # Configuración principal
├── cliente/                  # Módulo de clientes
├── vendedor/                # Módulo de vendedores
├── producto/                # Módulo de productos
├── servicio/                # Módulo de servicios
├── localidad/               # Módulo de localidades
├── operario/                # Módulo de operarios
├── venta/                   # Módulo de ventas
├── middleware/
│   ├── auth.middleware.ts   # (Deprecado - usar roleAuth)
│   └── roleAuth.middleware.ts # Autenticación y autorización
├── validators/
│   └── cliente.validator.ts # Validación con Zod
├── shared/
│   ├── repository.ts        # Interfaz genérica Repository
│   └── db/conn.ts          # Inicialización de MikroORM
└── tests/
    ├── cliente.test.ts
    ├── integration.test.ts
    └── validation.test.ts
```

---

## Documentación API

### Login

```http
POST /clientes/login
Content-Type: application/json

{
  "usuario": "usuario",
  "contraseña": "contraseña"
}
```

**Response:**

```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "clienteId": "...ObjectId...",
  "rol": "cliente"
}
```

### Acceder a rutas protegidas

```http
GET /clientes/
Authorization: Bearer <token>
```

---

## Notas Importantes

1. **JWT_SECRET** - Cambiar en producción a valor seguro
2. **MONGO_URI** - Actualizar con credenciales reales
3. **Roles** - Extendibles agregando nuevos roles en `roleAuth.middleware.ts`
4. **Validación** - Usar `createClienteSchema` como patrón para otros módulos

---

## Integrantes

- Ignacio Ramirez
- Milton Sarkissian
