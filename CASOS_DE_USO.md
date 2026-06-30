# Casos de Uso - CRM Backend

## Descripción General
El sistema CRM es una aplicación web que gestiona relaciones con clientes, vendedores, productos y servicios. Los casos de uso siguientes representan los flujos principales de negocio implementados en el backend.

---

## Caso de Uso 1: Registrar Cliente en el Sistema (Milton)

### Descripción
Un cliente nuevo se registra en el sistema CRM, proporcionando sus datos personales y comerciales. El sistema valida la información, hashea la contraseña y almacena el registro en la base de datos.

### Actores
- **Cliente** (usuario no autenticado)
- **Sistema**

### Flujo Principal
1. Cliente accede al endpoint `/clientes` con método POST
2. Proporciona datos: nombre, apellido, DNI, email, teléfono, dirección, usuario, contraseña
3. Sistema valida los datos con Zod:
   - DNI: mínimo 7 caracteres
   - Usuario: mínimo 3 caracteres
   - Contraseña: mínimo 6 caracteres
   - Email: formato válido
4. Sistema hashea la contraseña con bcryptjs (sal 10)
5. Sistema crea el cliente con rol 'cliente'
6. Sistema retorna: ID del cliente, mensaje de éxito, status 201

### Datos de Entrada
```json
{
  "nombre": "Juan",
  "apellido": "García",
  "dni": "34567890",
  "mail": "juan@example.com",
  "telefono": "1123456789",
  "direccion": "Calle 123",
  "razon_social": "García S.A.",
  "usuario": "juangarcia",
  "contraseña": "Segura123"
}
```

### Datos de Salida
```json
{
  "message": "cliente creado",
  "data": {
    "_id": "ObjectId(...)",
    "nombre": "Juan",
    "apellido": "García",
    "usuario": "juangarcia",
    "rol": "cliente"
  }
}
```

### Validaciones
- Email debe ser formato válido (@, dominio)
- Contraseña mínimo 6 caracteres
- Usuario mínimo 3 caracteres
- DNI mínimo 7 caracteres
- Todos los campos obligatorios presentes

### Flujos Alternativos
- **A1**: Validación falla → Retorna 400 con detalles del error
- **A2**: Usuario ya existe → Retorna error de duplicado

### Postcondiciones
- Cliente creado en MongoDB
- Contraseña almacenada de forma segura (hasheada)
- Cliente puede ahora hacer login

---

## Caso de Uso 2: Autenticar Cliente - Login (Milton)

### Descripción
Un cliente registrado se autentica proporcionando usuario y contraseña. El sistema valida las credenciales y emite un token JWT válido por 1 hora.

### Actores
- **Cliente** (usuario registrado)
- **Sistema**

### Flujo Principal
1. Cliente accede a `/clientes/login` con POST
2. Proporciona usuario y contraseña
3. Sistema valida con Zod que ambos campos estén presentes
4. Sistema busca cliente por usuario
5. Sistema compara contraseña ingresada con hash almacenado (bcryptjs)
6. Si coincide:
   - Genera JWT con payload: {id, usuario, rol: 'cliente'}
   - Token válido 1 hora
   - Retorna token + clienteId + rol
7. Si no coincide: Retorna 401 No autorizado

### Datos de Entrada
```json
{
  "usuario": "juangarcia",
  "contraseña": "Segura123"
}
```

### Datos de Salida
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "clienteId": "ObjectId(...)",
  "rol": "cliente"
}
```

### Validaciones
- Usuario debe estar registrado
- Contraseña debe coincidir con hash almacenado
- Token debe incluir rol para control de acceso

### Postcondiciones
- Cliente obtiene token válido
- Puede realizar peticiones autenticadas
- Token incluye identificación del usuario y su rol

---

## Caso de Uso 3: Crear Venta para Cliente (Ignacio)

### Descripción
Un vendedor registra una nueva venta en el sistema, relacionándola con un cliente específico, productos y servicios. La venta sirve como documento central que agrupa toda la transacción comercial.

### Actores
- **Vendedor** (autenticado con rol 'vendedor')
- **Sistema**

### Flujo Principal
1. Vendedor accede a `/ventas` con método POST
2. Proporciona:
   - clienteId (ID del cliente de Caso de Uso 1)
   - productoIds (array de IDs de productos)
   - servicioIds (array de IDs de servicios)
   - estado (ej: "pendiente", "completada")
   - fechas: contacto, venta, entrega, cancelación
3. Sistema valida que clienteId sea ObjectId válido
4. Sistema valida que todos los IDs sean ObjectId válidos
5. Sistema filtra productos y servicios válidos
6. Sistema crea la venta con relaciones referenciadas
7. Sistema retorna: venta creada con status 201

### Datos de Entrada
```json
{
  "clienteId": "ObjectId(...)",
  "productoIds": ["ObjectId(...)", "ObjectId(...)"],
  "servicioIds": ["ObjectId(...)"],
  "estado": "completada",
  "fechaContacto": "2026-01-15",
  "fechaDeVenta": "2026-01-20",
  "fechaEntrega": "2026-02-01",
  "fechaCancelacion": null
}
```

### Datos de Salida
```json
{
  "message": "Venta creada",
  "data": {
    "_id": "ObjectId(...)",
    "clienteId": "ObjectId(...)",
    "productoIds": ["ObjectId(...)", "ObjectId(...)"],
    "servicioIds": ["ObjectId(...)"],
    "estado": "completada",
    "fechaDeVenta": "2026-01-20"
  }
}
```

### Relaciones (Dependencias)
- **Cliente** (Caso de Uso 1): La venta debe referenciar a un cliente existente
- **Productos**: La venta puede incluir múltiples productos
- **Servicios**: La venta puede incluir múltiples servicios

### Validaciones
- clienteId debe existir en BD
- Todos los IDs deben ser ObjectId válidos
- Mínimo un producto o servicio
- Fechas deben ser lógicamente coherentes

### Postcondiciones
- Venta creada en MongoDB
- Vinculaciones establecidas mediante IDs
- Vendedor puede consultar, modificar o cancelar la venta

---

## Caso de Uso 4: Listar Clientes Filtrados

### Descripción
Un usuario autenticado (vendedor o admin) puede consultar el listado de clientes con filtros opcionales por usuario, apellido o DNI.

### Endpoint
`GET /clientes?usuario=juan&apellido=García&dni=34567890`

### Filtros Disponibles
- **usuario** - Búsqueda case-insensitive por nombre de usuario
- **apellido** - Búsqueda case-insensitive por apellido
- **dni** - Búsqueda exacta por DNI

### Ejemplo
```bash
GET /clientes?apellido=García
```

### Respuesta
```json
{
  "data": [
    {
      "_id": "ObjectId(...)",
      "nombre": "Juan",
      "apellido": "García",
      "usuario": "juangarcia",
      "rol": "cliente"
    }
  ]
}
```

---

## Caso de Uso 5: Listar Productos Filtrados

### Descripción
Un vendedor puede consultar productos con filtros por nombre o descripción.

### Endpoint
`GET /productos?nombre=leche&descripcion=lacteos`

### Filtros Disponibles
- **nombre** - Búsqueda case-insensitive por nombre
- **descripcion** - Búsqueda case-insensitive por descripción

### Ejemplo
```bash
GET /productos?nombre=leche
```

---

## Caso de Uso 6: Listar Ventas Filtradas

### Descripción
Un vendedor puede consultar sus ventas filtradas por estado o cliente específico.

### Endpoint
`GET /ventas?estado=completada&clienteId=ObjectId(...)`

### Filtros Disponibles
- **estado** - Filtro exacto por estado (pendiente, completada, cancelada)
- **clienteId** - Filtro exacto por ID del cliente

### Ejemplo
```bash
GET /ventas?estado=completada
GET /ventas?clienteId=507f1f77bcf86cd799439011
```

---

## Relaciones entre Casos de Uso

### Flujo Completo de Transacción
```
CU1: Registrar Cliente
     ↓
CU2: Autenticar Cliente (Login)
     ↓
CU3: Crear Venta para Cliente ← Requiere cliente de CU1
     ↓
CU4, CU5, CU6: Consultar datos con filtros
```

### Dependencias
- **CU3 depende de CU1**: Una venta necesita un cliente registrado
- **CU2 permite CU3**: El vendedor debe autenticarse para crear ventas
- **CU4-6 requieren autenticación**: Todos los listados están protegidos por JWT

### Valor de Negocio
- **CU1 + CU2**: Gestión de acceso y seguridad
- **CU3**: Documentación de transacciones comerciales
- **CU4-6**: Reportes y búsquedas para análisis de negocio

---

## Roles y Permisos

### Cliente
- ✅ Registrarse (POST /clientes)
- ✅ Hacer login
- ✅ Ver su perfil
- ❌ Crear ventas
- ❌ Ver todos los productos

### Vendedor
- ✅ Ver clientes
- ✅ Ver productos
- ✅ Crear ventas
- ✅ Ver ventas propias
- ❌ Eliminar clientes
- ❌ Crear productos

### Admin
- ✅ Acceso a todo
- ✅ Crear productos
- ✅ Eliminar clientes
- ✅ Crear vendedores
- ✅ Ver reportes

---

## Tecnologías Utilizadas

### Autenticación y Seguridad
- **JWT** - Tokens para autenticación sin estado
- **bcryptjs** - Hashing seguro de contraseñas
- **Middleware roleAuth** - Control de roles por endpoint

### Validación
- **Zod** - Validación de esquemas TypeScript
- **Sanitización** - Validación en API boundaries

### Base de Datos
- **MongoDB** - Almacenamiento principal
- **MikroORM** - ORM para mapeo objeto-documento
- **ObjectId** - Identificadores únicos

---

## Requisitos Cumplidos

### Regularidad
- ✅ 1 CRUD Simple por integrante (7 CRUDs totales)
- ✅ 1 CRUD Dependiente (Venta depende de Cliente, Producto, Servicio)
- ✅ 1 Listado con filtro (Clientes, Productos, Ventas)
- ✅ Detalle al seleccionar elemento (GET por ID)
- ✅ 1 Epic/CU con valor de negocio (Crear Venta)

### Aprobación
- ✅ CRUDs de todas las clases de negocio
- ✅ 2+ Epics relacionados:
  - CU1 (Milton): Registrar Cliente
  - CU2 (Milton): Autenticar Cliente
  - CU3 (Ignacio): Crear Venta (usa datos de CU1)
  - Relación: CU1 → CU3 (cliente registrado → venta creada)

---

## Pruebas Sugeridas

### Test CU1: Registrar Cliente
```bash
POST /clientes
Content-Type: application/json

{
  "nombre": "Test",
  "apellido": "User",
  "dni": "1234567",
  "mail": "test@example.com",
  "telefono": "1234567890",
  "direccion": "Test St",
  "usuario": "testuser",
  "contraseña": "Test1234"
}
```

### Test CU2: Login
```bash
POST /clientes/login
{
  "usuario": "testuser",
  "contraseña": "Test1234"
}
```

### Test CU3: Crear Venta
```bash
POST /ventas
Authorization: Bearer <token>
{
  "clienteId": "ObjectId_del_cliente_creado",
  "productoIds": ["ObjectId_producto"],
  "servicioIds": [],
  "estado": "completada",
  "fechaContacto": "2026-01-15"
}
```

### Test CU4: Listar Clientes con Filtro
```bash
GET /clientes?apellido=User
Authorization: Bearer <token>
```

---

## Próximas Mejoras (Alcance Voluntario)

- [ ] Notificaciones por email al crear venta
- [ ] Dashboard con estadísticas de ventas
- [ ] Reportes en PDF
- [ ] Auditoría y logs de cambios
- [ ] Recuperación de contraseña
- [ ] Roles más granulares (supervisor, gerente)
