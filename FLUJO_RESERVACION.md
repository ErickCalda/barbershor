# Flujo de Reservación de Citas - Backend

## 📋 Resumen del Sistema

Este sistema implementa un flujo completo de reservación de citas para una barbería, incluyendo:

1. **Selección de servicios disponibles**
2. **Selección de barbero disponible**
3. **Selección de horario disponible**
4. **Procesamiento de pago**
5. **Confirmación y creación de cita**
6. **Integración con Google Calendar**
7. **Envío de notificaciones automáticas**

## 🔧 Endpoints Implementados

### Rutas Públicas (No requieren autenticación)

#### 1. Obtener Servicios Disponibles
```
GET /api/reservacion/servicios
```
**Descripción:** Lista todos los servicios activos que requieren cita.

**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "nombre": "Corte de Cabello",
      "descripcion": "Corte profesional de cabello",
      "precio": 25.00,
      "duracion_minutos": 30,
      "categoria_nombre": "Cortes"
    }
  ]
}
```

#### 2. Obtener Empleados Disponibles
```
GET /api/reservacion/empleados-disponibles?servicio_id=1&fecha=2024-01-15
```
**Descripción:** Lista empleados disponibles para un servicio y fecha específica.

**Parámetros:**
- `servicio_id` (requerido): ID del servicio
- `fecha` (requerido): Fecha en formato YYYY-MM-DD

**Respuesta:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "titulo": "Barbero Senior",
      "foto_perfil": "url_foto.jpg"
    }
  ]
}
```

#### 3. Obtener Horarios Disponibles
```
GET /api/reservacion/horarios-disponibles?empleado_id=1&fecha=2024-01-15&servicio_id=1
```
**Descripción:** Lista horarios disponibles para un empleado en una fecha específica.

**Parámetros:**
- `empleado_id` (requerido): ID del empleado
- `fecha` (requerido): Fecha en formato YYYY-MM-DD
- `servicio_id` (requerido): ID del servicio

**Respuesta:**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "hora_inicio": "09:00",
      "hora_fin": "09:30",
      "duracion_minutos": 30
    }
  ]
}
```

### Rutas Privadas (Requieren autenticación de cliente)

#### 4. Procesar Reservación
```
POST /api/reservacion/procesar
```
**Descripción:** Procesa el pago y crea la cita.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "empleado_id": 1,
  "servicio_id": 1,
  "fecha_hora_inicio": "2024-01-15T09:00:00Z",
  "fecha_hora_fin": "2024-01-15T09:30:00Z",
  "precio_total": 25.00,
  "metodo_pago": 1,
  "referencia_pago": "ref_123456",
  "notas": "Corte estilo moderno"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Cita reservada exitosamente",
  "data": {
    "cita_id": 123,
    "pago_id": 456,
    "fecha_hora_inicio": "2024-01-15T09:00:00Z",
    "fecha_hora_fin": "2024-01-15T09:30:00Z",
    "precio_total": 25.00
  }
}
```

#### 5. Obtener Mis Citas
```
GET /api/reservacion/mis-citas
```
**Descripción:** Obtiene las citas del cliente autenticado.

**Parámetros opcionales:**
- `estado_id`: Filtrar por estado
- `fecha_desde`: Fecha desde
- `fecha_hasta`: Fecha hasta
- `limite`: Número de resultados (1-100)
- `offset`: Desplazamiento para paginación

#### 6. Cancelar Cita
```
PUT /api/reservacion/cancelar/:id
```
**Descripción:** Cancela una cita del cliente.

**Body:**
```json
{
  "motivo_cancelacion": "Cambio de planes"
}
```

### Rutas para Empleados

#### 7. Obtener Mis Citas (Empleado)
```
GET /api/empleado/citas
```
**Descripción:** Obtiene las citas del empleado autenticado.

#### 8. Obtener Citas de Hoy
```
GET /api/empleado/citas/hoy
```
**Descripción:** Obtiene las citas de hoy del empleado.

#### 9. Obtener Citas Próximas
```
GET /api/empleado/citas/proximas?dias=7
```
**Descripción:** Obtiene las citas próximas del empleado.

#### 10. Solicitar Ausencia
```
POST /api/empleado/ausencias
```
**Descripción:** Solicita una ausencia.

**Body:**
```json
{
  "fecha_inicio": "2024-01-20",
  "fecha_fin": "2024-01-22",
  "motivo": "Vacaciones familiares",
  "tipo_ausencia": "vacaciones"
}
```

#### 11. Obtener Mis Ausencias
```
GET /api/empleado/ausencias
```
**Descripción:** Obtiene las ausencias del empleado.

#### 12. Cancelar Ausencia
```
PUT /api/empleado/ausencias/:id/cancelar
```
**Descripción:** Cancela una solicitud de ausencia.

#### 13. Obtener Estadísticas
```
GET /api/empleado/estadisticas?periodo=mes
```
**Descripción:** Obtiene estadísticas del empleado.

## 🔄 Flujo de Proceso

### 1. Selección de Servicios
1. Cliente accede a `/api/reservacion/servicios`
2. Sistema retorna servicios activos con precios y duraciones
3. Cliente selecciona un servicio

### 2. Selección de Empleado
1. Cliente envía `servicio_id` y `fecha` a `/api/reservacion/empleados-disponibles`
2. Sistema verifica:
   - Empleados que pueden realizar el servicio
   - Horarios de trabajo del empleado
   - Ausencias programadas
   - Citas existentes
3. Retorna lista de empleados disponibles

### 3. Selección de Horario
1. Cliente envía `empleado_id`, `fecha` y `servicio_id` a `/api/reservacion/horarios-disponibles`
2. Sistema calcula:
   - Horarios de trabajo del empleado
   - Duración del servicio seleccionado
   - Slots disponibles de 30 minutos
   - Conflictos con citas existentes
3. Retorna horarios disponibles

### 4. Procesamiento de Reservación
1. Cliente envía datos completos a `/api/reservacion/procesar`
2. Sistema ejecuta transacción:
   - Crea registro de pago
   - Crea la cita
   - Asocia servicio a la cita
   - Envía notificación inmediata
   - Programa correo de confirmación
   - Crea evento en Google Calendar (si está configurado)
3. Retorna confirmación con IDs

## 📧 Sistema de Notificaciones

### Notificaciones Automáticas
- **Confirmación de cita:** Enviada inmediatamente al crear la cita
- **Recordatorio:** Programado para 24 horas antes
- **Cancelación:** Enviada al cancelar una cita

### Tipos de Notificación
- **In-app:** Almacenadas en tabla `notificaciones`
- **Email:** Programadas en tabla `correos_programados`
- **Google Calendar:** Eventos creados automáticamente

## 🗓️ Integración con Google Calendar

### Configuración Requerida
- Variables de entorno:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`

### Proceso de Integración
1. Usuario autoriza acceso a Google Calendar
2. Tokens se almacenan en `calendarios_google`
3. Al crear cita, se crea evento automáticamente
4. Eventos incluyen recordatorios automáticos

## 🔒 Seguridad y Validaciones

### Validaciones de Entrada
- Fechas no pueden ser en el pasado
- Empleado debe estar disponible
- Servicio debe estar activo
- Cliente debe estar autenticado

### Validaciones de Negocio
- No se pueden agendar citas en horarios ocupados
- No se pueden cancelar citas muy próximas (24h)
- Empleados solo pueden ver sus propias citas
- Clientes solo pueden ver sus propias citas

### Transacciones
- Todas las operaciones críticas usan transacciones SQL
- Rollback automático en caso de error
- Logs detallados para debugging

## 📊 Tablas de Base de Datos Utilizadas

### Tablas Principales
- `servicios`: Información de servicios
- `empleados`: Información de empleados
- `empleado_servicio`: Relación empleado-servicio
- `horarios_empleados`: Horarios de trabajo
- `ausencias_empleados`: Ausencias programadas
- `citas`: Citas agendadas
- `cita_servicio`: Servicios de cada cita
- `pagos`: Información de pagos
- `usuarios`: Información de usuarios

### Tablas de Notificaciones
- `notificaciones`: Notificaciones in-app
- `correos_programados`: Emails programados
- `calendarios_google`: Configuración de Google Calendar
- `eventos_google_calendar`: Eventos de Google Calendar

## 🚀 Instalación y Configuración

### 1. Dependencias
```bash
npm install googleapis
```

### 2. Variables de Entorno
```env
# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=peluqueria_db
```

### 3. Estructura de Base de Datos
Asegúrate de que todas las tablas mencionadas existan con la estructura correcta.

## 🧪 Testing

### Endpoints de Prueba
```bash
# Obtener servicios
curl http://localhost:5000/api/reservacion/servicios

# Obtener empleados disponibles
curl "http://localhost:5000/api/reservacion/empleados-disponibles?servicio_id=1&fecha=2024-01-15"

# Obtener horarios disponibles
curl "http://localhost:5000/api/reservacion/horarios-disponibles?empleado_id=1&fecha=2024-01-15&servicio_id=1"
```

## 📝 Logs y Debugging

El sistema incluye logs detallados para debugging:
- Logs de consultas SQL
- Logs de transacciones
- Logs de notificaciones
- Logs de errores

### Ejemplo de Log
```
🔍 [reservacionController.procesarReservacion] Datos recibidos: {...}
🔍 [reservacionController.procesarReservacion] Reservación procesada exitosamente
✅ Notificación de confirmación de cita enviada
✅ Correo de confirmación programado
✅ Evento creado en Google Calendar: event_123
```

## 🔄 Próximas Mejoras

1. **Sistema de recordatorios automáticos**
2. **Integración con WhatsApp Business**
3. **Sistema de fidelización**
4. **Reportes avanzados**
5. **Dashboard en tiempo real**
6. **Sistema de reseñas automáticas** 