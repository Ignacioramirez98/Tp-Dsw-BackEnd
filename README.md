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

El archivo `.env` ya está configurado. Verificar que contiene:

```env
MONGO_URI=mongodb+srv://nacho98nacho98:dsw123@cluster0.z5xdoug.mongodb.net/crm
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1h
PORT=3000
FRONTEND_URL=http://localhost:4200
```

**IMPORTANTE para Producción:** Cambiar `JWT_SECRET` a un valor seguro.

---

## Scripts Disponibles

### Ejecutar en Desarrollo (Hot Reload)

```bash
npm run start:dev
```

Inicia el servidor en `http://localhost:3000`
Recarga automática al cambiar archivos TypeScript

### Compilar a JavaScript

```bash
npm run build
```

Genera carpeta `dist/` con código compilado

### Ejecutar Tests

```bash
npm test
```

Ejecuta tests unitarios e integración con Vitest

### Ejecutar Tests con UI

```bash
npm test:ui
```

Abre interfaz visual para ver resultados de tests

---

## Estructura del Proyecto

```
src/
├── app.ts                    # Configuración principal de Express
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

## Pruebas

### Ejecutar Tests

```bash
npm test
```

### Ver resultados en UI

```bash
npm test:ui
```

---

## Roles y Permisos

| Rol          | Puede Hacer                                 |
| ------------ | ------------------------------------------- |
| **cliente**  | Ver/actualizar su perfil, ver productos     |
| **vendedor** | Ver clientes, crear ventas, ver productos   |
| **operario** | Ver y gestionar operarios                   |
| **admin**    | Acceso total (crear, editar, eliminar todo) |

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

- Constanza Dominio
- Milton Sarkissian

---
