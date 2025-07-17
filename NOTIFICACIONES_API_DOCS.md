# 📧 API de Notificaciones - BarberShot

## 🔔 Descripción General

El sistema de notificaciones de BarberShot incluye:
- **Notificaciones por Email**: Confirmaciones y recordatorios automáticos
- **Notificaciones Push**: Usando Firebase Cloud Messaging
- **Integración con Google Calendar**: Creación automática de eventos
- **Recordatorios Programados**: Sistema automático de recordatorios

## 🚀 Características

### ✅ Notificaciones Automáticas
- Confirmación de cita al momento de la reservación
- Recordatorios 24 horas antes de la cita
- Recordatorios 2 horas antes de la cita
- Notificaciones al empleado sobre nuevas citas

### 📧 Email Templates
- Templates HTML profesionales
- Información completa de la cita
- Datos del cliente y empleado
- Servicios seleccionados

### 📅 Google Calendar
- Creación automática de eventos
- Invitaciones a cliente y empleado
- Recordatorios automáticos de Google
- Sincronización bidireccional

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Email (Gmail)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password_gmail

# Google Calendar
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GOOGLE_CALENDAR_ID=primary

# Firebase (para notificaciones push)
FIREBASE_PROJECT_ID=tu_proyecto_firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_private_key_aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu_proyecto.iam.gserviceaccount.com
```

### Configuración de Gmail
1. Habilitar autenticación de 2 factores
2. Generar contraseña de aplicación
3. Usar la contraseña de aplicación en `EMAIL_PASSWORD`

### Configuración de Google Calendar
1. Crear proyecto en Google Cloud Console
2. Habilitar Google Calendar API
3. Crear credenciales de servicio
4. Descargar archivo JSON de credenciales
5. Colocar en `google-credentials.json`

## 📋 Endpoints de la API

### 🔔 Notificaciones de Citas

#### Enviar Recordatorio Manual
```http
POST /api/notificaciones/recordatorio/:citaId
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Recordatorio enviado exitosamente"
}
```

#### Reenviar Confirmación
```http
POST /api/notificaciones/confirmacion/:citaId
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Confirmación reenviada exitosamente"
}
```

#### Programar Recordatorios Automáticos
```http
POST /api/notificaciones/programar-recordatorios
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Recordatorios programados exitosamente"
}
```

### 📊 Historial de Notificaciones

#### Obtener Historial
```http
GET /api/notificaciones/historial?page=1&limit=10&tipo=confirmacion
Authorization: Bearer <token>
```

**Parámetros:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `tipo`: Filtrar por tipo (confirmacion, recordatorio, etc.)

**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "total": 25,
  "pagination": {
    "page": 1,
    "limit": 10,
    "pages": 3
  },
  "data": [
    {
      "id": 1,
      "tipo": "confirmacion",
      "usuario_nombre": "Juan Pérez",
      "cliente_nombre": "María García",
      "cita_id": 123,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### ⚙️ Configuración de Usuario

#### Obtener Configuración
```http
GET /api/notificaciones/configuracion
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "notificacion_correo": 1,
    "notificacion_push": 1,
    "notificacion_sms": 0,
    "recordatorio_horas_antes": 24
  }
}
```

#### Actualizar Configuración
```http
PUT /api/notificaciones/configuracion
Authorization: Bearer <token>
Content-Type: application/json

{
  "notificacion_correo": 1,
  "notificacion_push": 1,
  "notificacion_sms": 0,
  "recordatorio_horas_antes": 24
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Configuración de notificaciones actualizada exitosamente"
}
```

## 🔄 Flujo de Notificaciones

### 1. Confirmación de Cita
```mermaid
graph TD
    A[Reserva Cita] --> B[Crear Cita en BD]
    B --> C[Enviar Email Confirmación]
    B --> D[Crear Evento Google Calendar]
    B --> E[Notificación Push Cliente]
    B --> F[Notificación Push Empleado]
```

### 2. Recordatorios Automáticos
```mermaid
graph TD
    A[Cron Job Diario] --> B[Buscar Citas Mañana]
    B --> C[Enviar Recordatorios]
    C --> D[Email Recordatorio]
    C --> E[Push Recordatorio]
    C --> F[Marcar Como Enviado]
```

## 🛠️ Servicios Implementados

### EmailService
- **Métodos:**
  - `enviarConfirmacionCita(citaId)`
  - `enviarRecordatorioCita(citaId)`
- **Templates:** HTML profesionales con estilos CSS
- **Configuración:** Nodemailer con Gmail

### GoogleCalendarService
- **Métodos:**
  - `crearEventoCita(citaId)`
  - `actualizarEventoCita(citaId)`
  - `cancelarEventoCita(citaId)`
- **Características:** Invitaciones automáticas, recordatorios

### NotificacionPushService
- **Métodos:**
  - `enviarNotificacionConfirmacion(citaId)`
  - `enviarNotificacionRecordatorio(citaId)`
  - `enviarNotificacionEmpleado(citaId)`
- **Plataforma:** Firebase Cloud Messaging

### NotificacionService
- **Coordinador principal** de todos los servicios
- **Manejo de errores** sin fallar la operación principal
- **Programación automática** de recordatorios

## 📅 Programación Automática

### Cron Jobs
```javascript
// Recordatorios diarios (8:00 AM)
'0 8 * * *'

// Recordatorios cada hora
'0 * * * *'

// Limpieza diaria (12:00 AM)
'0 0 * * *'
```

### Script de Programación
```bash
# Ejecutar programador de recordatorios
node src/scripts/programarRecordatorios.js
```

## 🧪 Pruebas

### Script de Prueba
```bash
# Probar notificaciones
node test_notificaciones.js
```

### Pruebas Manuales
```bash
# Probar recordatorio manual
curl -X POST http://localhost:5000/api/notificaciones/recordatorio/1 \
  -H "Authorization: Bearer <token>"

# Probar confirmación
curl -X POST http://localhost:5000/api/notificaciones/confirmacion/1 \
  -H "Authorization: Bearer <token>"
```

## 🔍 Logs y Monitoreo

### Logs de Notificaciones
```
🔔 [notificacionService.enviarNotificacionesConfirmacion] Enviando todas las notificaciones para cita: 123
📧 [emailService.enviarConfirmacionCita] Email enviado exitosamente
📅 [googleCalendarService.crearEventoCita] Evento creado exitosamente
📱 [notificacionPushService.enviarNotificacionConfirmacion] Notificación enviada exitosamente
✅ [notificacionService.enviarNotificacionesConfirmacion] Todas las notificaciones procesadas
```

### Monitoreo de Errores
- Errores de email no fallan la reservación
- Errores de Google Calendar se registran pero no bloquean
- Tokens FCM inválidos se limpian automáticamente

## 🚨 Troubleshooting

### Problemas Comunes

#### Error de Email
```
❌ Error enviando email: Invalid login
```
**Solución:** Verificar credenciales de Gmail y contraseña de aplicación

#### Error de Google Calendar
```
❌ Error creando evento en Google Calendar: Invalid credentials
```
**Solución:** Verificar archivo de credenciales y permisos de API

#### Error de Firebase
```
❌ Error enviando notificación push: Invalid registration token
```
**Solución:** Los tokens inválidos se limpian automáticamente

### Verificación de Configuración
```bash
# Verificar variables de entorno
echo $EMAIL_USER
echo $GOOGLE_APPLICATION_CREDENTIALS

# Verificar archivos de credenciales
ls -la google-credentials.json
```

## 📈 Métricas y Estadísticas

### Datos Recopilados
- Número de notificaciones enviadas
- Tasa de éxito por tipo de notificación
- Tiempo de entrega promedio
- Tokens FCM inválidos

### Dashboard de Notificaciones
- Historial de envíos
- Configuración por usuario
- Estadísticas de entrega
- Estado de servicios

## 🔐 Seguridad

### Autenticación
- Todas las rutas requieren token JWT
- Verificación de permisos por usuario
- Validación de datos de entrada

### Privacidad
- Datos de usuario encriptados
- Tokens FCM seguros
- Credenciales de API protegidas

## 📞 Soporte

Para problemas con notificaciones:
1. Verificar logs del servidor
2. Comprobar configuración de variables de entorno
3. Probar con script de prueba
4. Revisar credenciales de servicios externos

---

**BarberShot - Sistema de Notificaciones Inteligentes** ✂️📧📅 