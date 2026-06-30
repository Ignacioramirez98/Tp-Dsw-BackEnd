# Guía de Filtros - API REST

## Introducción

Los endpoints de listado ahora soportan filtros opcionales mediante query parameters. Esto permite búsquedas más específicas sin necesidad de hacer múltiples peticiones.

---

## Filtros por Módulo

### 📌 Clientes - GET /clientes

**Filtros disponibles:**
- `usuario` - Búsqueda case-insensitive por nombre de usuario
- `apellido` - Búsqueda case-insensitive por apellido
- `dni` - Búsqueda exacta por DNI

**Ejemplos:**

```bash
# Buscar cliente por usuario
GET /clientes?usuario=juan
Authorization: Bearer <token>

# Buscar por apellido
GET /clientes?apellido=García

# Buscar por DNI
GET /clientes?dni=34567890

# Combinar filtros
GET /clientes?apellido=García&usuario=juan
```

**Respuesta:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Juan",
      "apellido": "García",
      "usuario": "juangarcia",
      "rol": "cliente"
    }
  ]
}
```

---

### 📦 Productos - GET /productos

**Filtros disponibles:**
- `nombre` - Búsqueda case-insensitive por nombre
- `descripcion` - Búsqueda case-insensitive por descripción

**Ejemplos:**

```bash
# Buscar producto por nombre
GET /productos?nombre=leche
Authorization: Bearer <token>

# Buscar por descripción
GET /productos?descripcion=lacteos

# Combinar filtros
GET /productos?nombre=leche&descripcion=descremada
```

**Respuesta:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "nombre": "Leche Descremada",
      "descripcion": "Lacteos - Leche",
      "importe_venta": 45.50,
      "stock": 100
    }
  ]
}
```

---

### 🛒 Ventas - GET /ventas

**Filtros disponibles:**
- `estado` - Filtro exacto por estado (pendiente, completada, cancelada)
- `clienteId` - Filtro por ID del cliente (ObjectId válido)

**Ejemplos:**

```bash
# Buscar ventas por estado
GET /ventas?estado=completada
Authorization: Bearer <token>

# Buscar ventas de un cliente específico
GET /ventas?clienteId=507f1f77bcf86cd799439011

# Combinar filtros
GET /ventas?estado=completada&clienteId=507f1f77bcf86cd799439011
```

**Respuesta:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "clienteId": "507f1f77bcf86cd799439011",
      "estado": "completada",
      "fechaDeVenta": "2026-01-20T00:00:00.000Z",
      "productoIds": ["507f1f77bcf86cd799439012"],
      "servicioIds": []
    }
  ]
}
```

---

### 🔧 Servicios - GET /servicios

**Filtros disponibles:**
- `descripcion` - Búsqueda case-insensitive por descripción

**Ejemplos:**

```bash
# Buscar servicio por descripción
GET /servicios?descripcion=instalacion
Authorization: Bearer <token>
```

---

## Comportamiento de Filtros

### Búsquedas Case-Insensitive
Filtros como `usuario`, `apellido`, `nombre`, `descripcion` ignoran mayúsculas/minúsculas:

```bash
# Todos retornan el mismo resultado
GET /clientes?usuario=Juan
GET /clientes?usuario=juan
GET /clientes?usuario=JUAN
```

### Búsquedas Parciales
La búsqueda es parcial (contiene):

```bash
# Encontrará: "Juan", "Juanito", "Juana"
GET /clientes?usuario=juan

# Encontrará: "García", "García López"
GET /clientes?apellido=garcía
```

### Búsquedas Exactas
Algunos filtros como `estado` y `dni` son búsquedas exactas:

```bash
# Solo devuelve ventas en estado "completada"
GET /ventas?estado=completada

# Solo devuelve clientes con DNI exacto
GET /clientes?dni=34567890
```

### Sin Filtros
Si no hay query parameters, retorna todos los registros:

```bash
# Retorna todos los clientes
GET /clientes
```

---

## Casos de Uso

### 1️⃣ Buscar cliente por nombre

```bash
GET /clientes?usuario=juan
Authorization: Bearer <token>
```

**Caso de negocio:** Un vendedor busca rápidamente a un cliente específico sin ver toda la lista.

---

### 2️⃣ Filtrar ventas completadas de un cliente

```bash
GET /ventas?estado=completada&clienteId=507f1f77bcf86cd799439011
Authorization: Bearer <token>
```

**Caso de negocio:** Generar reportes de ventas completadas de clientes específicos.

---

### 3️⃣ Buscar productos lacteos

```bash
GET /productos?nombre=leche
Authorization: Bearer <token>
```

**Caso de negocio:** Filtrar por categoría de productos disponibles.

---

### 4️⃣ Listar servicios de instalación

```bash
GET /servicios?descripcion=instalacion
Authorization: Bearer <token>
```

**Caso de negocio:** Ver servicios disponibles de un tipo específico.

---

## Notas Importantes

### ⚠️ Autenticación Requerida
Todos los endpoints de filtrado requieren un token JWT válido en el header:

```bash
Authorization: Bearer <token>
```

### ⚠️ Validación de ObjectId
Si usas `clienteId` o `ventaId`, debe ser un ObjectId válido:

```bash
# ✅ Válido
GET /ventas?clienteId=507f1f77bcf86cd799439011

# ❌ Inválido
GET /ventas?clienteId=invalid123
```

### ⚠️ Roles Requeridos
- Clientes: Requieren rol `cliente` o `admin`
- Productos/Servicios: Requieren rol `vendedor` o `admin`
- Ventas: Requieren rol `vendedor` o `admin`

---

## Ejemplos con REST Client (VS Code)

Usar la extensión REST Client para probar:

**cliente.http:**
```http
### Listar todos los clientes
GET http://localhost:3000/clientes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Buscar cliente por usuario
GET http://localhost:3000/clientes?usuario=juan
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Buscar cliente por apellido
GET http://localhost:3000/clientes?apellido=García
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**producto.http:**
```http
### Listar productos
GET http://localhost:3000/productos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Buscar por nombre
GET http://localhost:3000/productos?nombre=leche
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**venta.http:**
```http
### Listar ventas completadas
GET http://localhost:3000/ventas?estado=completada
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Ventas de un cliente específico
GET http://localhost:3000/ventas?clienteId=507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Mejoras Futuras

- [ ] Paginación (limit, offset)
- [ ] Ordenamiento (sort)
- [ ] Búsquedas avanzadas (AND, OR, NOT)
- [ ] Exportación a CSV/Excel
- [ ] Estadísticas agregadas
