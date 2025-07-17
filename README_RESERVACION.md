# 🪒 Sistema de Reservación de Citas - Barbería

## 🚀 Inicio Rápido

### 1. Instalación de Dependencias
```bash
npm install googleapis axios
```

### 2. Configuración de Variables de Entorno
Copia `env.example` a `.env` y configura:
```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=peluqueria_db

# Google Calendar (opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro
```

### 3. Iniciar el Servidor
```bash
npm start
```

### 4. Probar el Sistema
```bash
node test_reservacion.js
```

## 📋 Flujo de Uso

### Para Clientes

#### 1. Ver Servicios Disponibles
```javascript
// GET /api/reservacion/servicios
const servicios = await fetch('/api/reservacion/servicios');
const data = await servicios.json();
console.log('Servicios:', data.data);
```

#### 2. Seleccionar Empleado
```javascript
// GET /api/reservacion/empleados-disponibles?servicio_id=1&fecha=2024-01-15
const empleados = await fetch('/api/reservacion/empleados-disponibles?servicio_id=1&fecha=2024-01-15');
const data = await empleados.json();
console.log('Empleados disponibles:', data.data);
```

#### 3. Ver Horarios Disponibles
```javascript
// GET /api/reservacion/horarios-disponibles?empleado_id=1&fecha=2024-01-15&servicio_id=1
const horarios = await fetch('/api/reservacion/horarios-disponibles?empleado_id=1&fecha=2024-01-15&servicio_id=1');
const data = await horarios.json();
console.log('Horarios disponibles:', data.data);
```

#### 4. Reservar Cita
```javascript
// POST /api/reservacion/procesar
const reservacion = await fetch('/api/reservacion/procesar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    empleado_id: 1,
    servicio_id: 1,
    fecha_hora_inicio: '2024-01-15T09:00:00Z',
    fecha_hora_fin: '2024-01-15T09:30:00Z',
    precio_total: 25.00,
    metodo_pago: 1,
    referencia_pago: 'ref_123456',
    notas: 'Corte estilo moderno'
  })
});
const data = await reservacion.json();
console.log('Cita reservada:', data.data);
```

#### 5. Ver Mis Citas
```javascript
// GET /api/reservacion/mis-citas
const citas = await fetch('/api/reservacion/mis-citas', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const data = await citas.json();
console.log('Mis citas:', data.data);
```

#### 6. Cancelar Cita
```javascript
// PUT /api/reservacion/cancelar/123
const cancelacion = await fetch('/api/reservacion/cancelar/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    motivo_cancelacion: 'Cambio de planes'
  })
});
const data = await cancelacion.json();
console.log('Cita cancelada:', data.message);
```

### Para Empleados

#### 1. Ver Mis Citas
```javascript
// GET /api/empleado/citas
const citas = await fetch('/api/empleado/citas', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const data = await citas.json();
console.log('Mis citas:', data.data);
```

#### 2. Ver Citas de Hoy
```javascript
// GET /api/empleado/citas/hoy
const citasHoy = await fetch('/api/empleado/citas/hoy', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const data = await citasHoy.json();
console.log('Citas de hoy:', data.data);
```

#### 3. Solicitar Ausencia
```javascript
// POST /api/empleado/ausencias
const ausencia = await fetch('/api/empleado/ausencias', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    fecha_inicio: '2024-01-20',
    fecha_fin: '2024-01-22',
    motivo: 'Vacaciones familiares',
    tipo_ausencia: 'vacaciones'
  })
});
const data = await ausencia.json();
console.log('Ausencia solicitada:', data.data);
```

#### 4. Ver Estadísticas
```javascript
// GET /api/empleado/estadisticas?periodo=mes
const estadisticas = await fetch('/api/empleado/estadisticas?periodo=mes', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
const data = await estadisticas.json();
console.log('Estadísticas:', data.data);
```

## 🔧 Configuración Avanzada

### Integración con Google Calendar

1. **Crear proyecto en Google Cloud Console**
2. **Habilitar Google Calendar API**
3. **Crear credenciales OAuth 2.0**
4. **Configurar variables de entorno**

```env
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Sistema de Notificaciones

El sistema envía automáticamente:
- ✅ Notificación in-app al crear cita
- 📧 Email de confirmación
- 🗓️ Evento en Google Calendar
- ⏰ Recordatorio 24h antes
- ❌ Notificación de cancelación

### Base de Datos

Asegúrate de tener estas tablas con datos:
- `servicios` (con servicios activos)
- `empleados` (con empleados activos)
- `empleado_servicio` (relación empleado-servicio)
- `horarios_empleados` (horarios de trabajo)
- `usuarios` (usuarios del sistema)
- `clientes` (clientes registrados)

## 🧪 Testing

### Ejecutar Pruebas Automáticas
```bash
node test_reservacion.js
```

### Pruebas Manuales con cURL

#### Obtener Servicios
```bash
curl http://localhost:5000/api/reservacion/servicios
```

#### Obtener Empleados Disponibles
```bash
curl "http://localhost:5000/api/reservacion/empleados-disponibles?servicio_id=1&fecha=2024-01-15"
```

#### Obtener Horarios Disponibles
```bash
curl "http://localhost:5000/api/reservacion/horarios-disponibles?empleado_id=1&fecha=2024-01-15&servicio_id=1"
```

#### Procesar Reservación (con token)
```bash
curl -X POST http://localhost:5000/api/reservacion/procesar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "empleado_id": 1,
    "servicio_id": 1,
    "fecha_hora_inicio": "2024-01-15T09:00:00Z",
    "fecha_hora_fin": "2024-01-15T09:30:00Z",
    "precio_total": 25.00,
    "metodo_pago": 1,
    "referencia_pago": "ref_123456"
  }'
```

## 📊 Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "count": 5,
  "data": [...],
  "message": "Operación exitosa"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles técnicos"
}
```

## 🔒 Seguridad

### Validaciones Implementadas
- ✅ Fechas no pueden ser en el pasado
- ✅ Empleado debe estar disponible
- ✅ Servicio debe estar activo
- ✅ Cliente debe estar autenticado
- ✅ No se pueden agendar citas en horarios ocupados
- ✅ No se pueden cancelar citas muy próximas (24h)

### Autenticación
- JWT tokens para autenticación
- Tokens expiran en 30 días
- Refresh tokens disponibles

## 📝 Logs

El sistema genera logs detallados:
```
🔍 [reservacionController.procesarReservacion] Datos recibidos: {...}
✅ Notificación de confirmación de cita enviada
✅ Correo de confirmación programado
✅ Evento creado en Google Calendar: event_123
```

## 🚨 Solución de Problemas

### Error: "No hay servicios disponibles"
- Verifica que la tabla `servicios` tenga registros con `activo = 1`
- Verifica que los servicios tengan `requiere_cita = 1`

### Error: "No hay empleados disponibles"
- Verifica que la tabla `empleados` tenga registros con `activo = 1`
- Verifica que exista relación en `empleado_servicio`
- Verifica que el empleado tenga horarios configurados

### Error: "No hay horarios disponibles"
- Verifica que el empleado trabaje en esa fecha
- Verifica que no haya citas conflictivas
- Verifica que no haya ausencias programadas

### Error: "Usuario no es un cliente válido"
- Verifica que el usuario tenga rol de cliente
- Verifica que exista registro en tabla `clientes`

## 📞 Soporte

Para problemas técnicos:
1. Revisa los logs del servidor
2. Verifica la configuración de la base de datos
3. Ejecuta las pruebas automáticas
4. Consulta la documentación completa en `FLUJO_RESERVACION.md` 