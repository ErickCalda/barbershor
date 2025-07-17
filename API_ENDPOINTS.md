# API Endpoints - Sistema de Barbería

## Base URL
```
http://localhost:5000/api
```

## Autenticación
Todas las rutas privadas requieren un token de autorización en el header:
```
Authorization: Bearer <token>
```

---

## 🔐 Autenticación (`/auth`)

### Rutas Públicas
- `POST /auth/login/google` - Login con Google OAuth
- `POST /auth/refresh` - Refrescar token

### Rutas Privadas
- `GET /auth/profile` - Obtener perfil del usuario
- `PUT /auth/profile` - Actualizar perfil del usuario
- `GET /auth/verify` - Verificar estado de autenticación
- `POST /auth/logout` - Cerrar sesión

### Rutas de Administrador
- `GET /auth/stats` - Obtener estadísticas de autenticación

---

## 👥 Empleados (`/empleados`)

### Rutas Privadas (Admin, Dueño)
- `POST /empleados` - Crear nuevo empleado
- `GET /empleados` - Obtener todos los empleados
- `GET /empleados/:id` - Obtener empleado por ID
- `PUT /empleados/:id` - Actualizar empleado
- `DELETE /empleados/:id` - Eliminar empleado

### Rutas Específicas
- `GET /empleados/:id/horarios` - Obtener horarios del empleado
- `POST /empleados/:id/horarios` - Crear horario para empleado
- `PUT /empleados/:id/horarios/:horario_id` - Actualizar horario
- `DELETE /empleados/:id/horarios/:horario_id` - Eliminar horario
- `GET /empleados/:id/ausencias` - Obtener ausencias del empleado
- `POST /empleados/:id/ausencias` - Registrar ausencia
- `PUT /empleados/:id/ausencias/:ausencia_id` - Actualizar ausencia
- `DELETE /empleados/:id/ausencias/:ausencia_id` - Eliminar ausencia

---

## ✂️ Servicios (`/servicios`)

### Rutas Públicas
- `GET /servicios` - Obtener todos los servicios
- `GET /servicios/:id` - Obtener servicio por ID
- `GET /servicios/categoria/:categoria_id` - Obtener servicios por categoría
- `GET /servicios/destacados` - Obtener servicios destacados
- `GET /servicios/search` - Buscar servicios

### Rutas Privadas (Admin, Dueño)
- `POST /servicios` - Crear nuevo servicio
- `PUT /servicios/:id` - Actualizar servicio
- `DELETE /servicios/:id` - Eliminar servicio

---

## 👤 Clientes (`/clientes`)

### Rutas Privadas (Admin, Dueño, Empleado)
- `POST /clientes` - Crear nuevo cliente
- `GET /clientes` - Obtener todos los clientes
- `GET /clientes/:id` - Obtener cliente por ID
- `PUT /clientes/:id` - Actualizar cliente
- `DELETE /clientes/:id` - Eliminar cliente

### Rutas Específicas
- `GET /clientes/:id/historial` - Obtener historial de servicios
- `GET /clientes/:id/citas` - Obtener citas del cliente
- `GET /clientes/:id/stats` - Obtener estadísticas del cliente
- `GET /clientes/search` - Buscar clientes

---

## 📅 Citas (`/citas`)

### Rutas Privadas (Admin, Dueño, Empleado)
- `POST /citas` - Crear nueva cita
- `GET /citas` - Obtener todas las citas
- `GET /citas/:id` - Obtener cita por ID
- `PUT /citas/:id` - Actualizar cita
- `DELETE /citas/:id` - Cancelar cita

### Rutas Específicas
- `PATCH /citas/:id/estado` - Cambiar estado de cita
- `GET /citas/fecha/:fecha` - Obtener citas por fecha
- `GET /citas/disponibilidad/:empleado_id` - Obtener disponibilidad de empleado
- `GET /citas/stats` - Obtener estadísticas de citas (Admin, Dueño)

---

## 🛍️ Productos (`/productos`)

### Rutas Públicas
- `GET /productos` - Obtener todos los productos
- `GET /productos/:id` - Obtener producto por ID
- `GET /productos/categoria/:categoria_id` - Obtener productos por categoría
- `GET /productos/search` - Buscar productos

### Rutas Privadas (Admin, Dueño)
- `POST /productos` - Crear nuevo producto
- `PUT /productos/:id` - Actualizar producto
- `DELETE /productos/:id` - Eliminar producto

### Rutas de Gestión
- `PATCH /productos/:id/stock` - Actualizar stock (Admin, Dueño, Empleado)
- `GET /productos/stock-bajo` - Obtener productos con stock bajo (Admin, Dueño)
- `GET /productos/stats` - Obtener estadísticas de productos (Admin, Dueño)

---

## 📂 Categorías (`/categorias`)

### Rutas Públicas
- `GET /categorias/productos` - Obtener categorías de productos
- `GET /categorias/productos/:id` - Obtener categoría de producto por ID
- `GET /categorias/servicios` - Obtener categorías de servicios
- `GET /categorias/servicios/:id` - Obtener categoría de servicio por ID

### Rutas Privadas (Admin, Dueño)
- `POST /categorias/productos` - Crear categoría de producto
- `PUT /categorias/productos/:id` - Actualizar categoría de producto
- `DELETE /categorias/productos/:id` - Eliminar categoría de producto
- `POST /categorias/servicios` - Crear categoría de servicio
- `PUT /categorias/servicios/:id` - Actualizar categoría de servicio
- `DELETE /categorias/servicios/:id` - Eliminar categoría de servicio
- `GET /categorias/stats` - Obtener estadísticas de categorías

---

## 💰 Ventas (`/ventas`)

### Rutas Privadas (Admin, Dueño, Empleado)
- `POST /ventas` - Crear nueva venta
- `GET /ventas` - Obtener todas las ventas
- `GET /ventas/:id` - Obtener venta por ID
- `DELETE /ventas/:id` - Cancelar venta

### Rutas Específicas
- `PATCH /ventas/:id/estado-pago` - Cambiar estado de pago
- `GET /ventas/cliente/:cliente_id` - Obtener ventas por cliente
- `GET /ventas/stats` - Obtener estadísticas de ventas (Admin, Dueño)

---

## 🎯 Especialidades (`/especialidades`)

### Rutas Públicas
- `GET /especialidades` - Obtener todas las especialidades
- `GET /especialidades/:id` - Obtener especialidad por ID
- `GET /especialidades/:id/empleados` - Obtener empleados por especialidad
- `GET /especialidades/search` - Buscar especialidades

### Rutas Privadas (Admin, Dueño)
- `POST /especialidades` - Crear nueva especialidad
- `PUT /especialidades/:id` - Actualizar especialidad
- `DELETE /especialidades/:id` - Eliminar especialidad
- `POST /especialidades/:id/empleados` - Asignar empleado a especialidad
- `DELETE /especialidades/:id/empleados/:empleado_id` - Remover empleado de especialidad
- `GET /especialidades/stats` - Obtener estadísticas de especialidades

---

## 💚 Health Check
- `GET /health` - Verificar estado de la API

---

## Parámetros de Consulta Comunes

### Paginación
- `page` - Número de página (default: 1)
- `limit` - Elementos por página (default: 20, max: 100)

### Filtros de Fecha
- `fecha_inicio` - Fecha de inicio (ISO 8601)
- `fecha_fin` - Fecha de fin (ISO 8601)

### Búsqueda
- `search` - Término de búsqueda
- `q` - Término de búsqueda (para endpoints específicos)

### Filtros de Estado
- `activo` - Filtrar por estado activo (boolean)
- `solo_activos` - Solo elementos activos (boolean)

---

## Códigos de Respuesta

- `200` - OK
- `201` - Creado
- `400` - Bad Request
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `500` - Error interno del servidor

---

## Estructura de Respuesta

### Respuesta Exitosa
```json
{
  "success": true,
  "mensaje": "Operación exitosa",
  "data": {...},
  "count": 10,
  "totalPages": 5,
  "currentPage": 1
}
```

### Respuesta de Error
```json
{
  "success": false,
  "mensaje": "Descripción del error",
  "errors": [...]
}
```

---

## Roles de Usuario

- **Cliente (1)** - Acceso limitado a su propia información
- **Empleado (2)** - Acceso a citas, clientes y productos
- **Administrador (3)** - Acceso completo excepto configuraciones críticas
- **Dueño (4)** - Acceso completo a toda la aplicación

---

## Notas Importantes

1. Todas las fechas deben enviarse en formato ISO 8601
2. Los IDs deben ser números enteros positivos
3. Las imágenes deben enviarse como URLs válidas
4. Los precios deben ser números positivos
5. Las cantidades deben ser números enteros positivos
6. Los tokens de autenticación tienen un tiempo de expiración
7. Se aplica rate limiting para prevenir abuso
8. Todas las operaciones están registradas en logs 