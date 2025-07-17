# Flujo de Reservación - Frontend React

## Descripción
Este documento describe la implementación del flujo de reservación en el frontend de React para la aplicación de barbería.

## Componentes Implementados

### 1. Página de Reservación (`/reservacion`)
**Archivo:** `src/pages/Reservacion.jsx`

#### Funcionalidades:
- **Stepper de 4 pasos:**
  1. Selección de servicios
  2. Elección de barbero
  3. Selección de horario
  4. Confirmación de reservación

#### Características:
- Selección múltiple de servicios con cantidades
- Filtrado de empleados por servicios seleccionados
- Carga dinámica de horarios disponibles
- Cálculo automático del total
- Validaciones en cada paso
- Integración con API del backend

#### Endpoints utilizados:
- `GET /reservacion/servicios` - Listar servicios disponibles
- `GET /reservacion/empleados` - Listar empleados por servicios
- `GET /reservacion/horarios` - Obtener horarios disponibles
- `POST /reservacion/procesar` - Procesar la reservación

### 2. Página de Citas de Empleado (`/empleado-citas`)
**Archivo:** `src/pages/EmpleadoCitas.jsx`

#### Funcionalidades:
- **3 pestañas principales:**
  1. Mis Citas - Ver citas programadas
  2. Ausencias - Solicitar y gestionar ausencias
  3. Estadísticas - Ver información personal y estadísticas

#### Características:
- Vista de citas con estados (confirmada, pendiente, cancelada, completada)
- Solicitud de ausencias con tipos (personal, médica, vacaciones, otro)
- Estadísticas personales (citas completadas, pendientes, ausencias)
- Información del empleado
- Gestión de ausencias (solicitar, cancelar)

#### Endpoints utilizados:
- `GET /empleado-citas/citas` - Obtener citas del empleado
- `GET /empleado-citas/ausencias` - Obtener ausencias del empleado
- `GET /empleado-citas/estadisticas` - Obtener estadísticas
- `GET /empleado-citas/info` - Obtener información del empleado
- `POST /empleado-citas/ausencias` - Solicitar ausencia
- `DELETE /empleado-citas/ausencias/:id` - Cancelar ausencia

## Configuración

### Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration (si es necesario)
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain_aqui
VITE_FIREBASE_PROJECT_ID=tu_project_id_aqui
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id_aqui
VITE_FIREBASE_APP_ID=tu_app_id_aqui
```

### Rutas Agregadas
En `src/App.jsx` se agregaron las siguientes rutas:
- `/reservacion` - Página de reservación
- `/empleado-citas` - Página de citas de empleado

### Menú del Dashboard
En `src/pages/Dashboard.jsx` se agregaron las opciones:
- "Reservación" - Para acceder al flujo de reservación
- "Mis Citas" - Para que los empleados vean sus citas

## Uso

### Para Clientes (Reservación):
1. Acceder a `/reservacion`
2. Seleccionar servicios deseados
3. Elegir barbero disponible
4. Seleccionar fecha y horario
5. Confirmar reservación

### Para Empleados (Mis Citas):
1. Acceder a `/empleado-citas`
2. Ver citas programadas en la pestaña "Mis Citas"
3. Solicitar ausencias en la pestaña "Ausencias"
4. Revisar estadísticas en la pestaña "Estadísticas"

## Dependencias Utilizadas

### Material-UI Components:
- `Stepper`, `Step`, `StepLabel` - Para el flujo paso a paso
- `Card`, `CardContent`, `CardActions` - Para mostrar información
- `Grid`, `Container`, `Paper` - Para el layout
- `Button`, `TextField`, `FormControl` - Para formularios
- `Chip`, `Alert`, `CircularProgress` - Para feedback visual
- `Tabs`, `Tab`, `Dialog` - Para navegación y modales
- `List`, `ListItem`, `Avatar` - Para listas y información

### Iconos:
- `CheckCircle`, `Schedule`, `Person` - Para indicadores visuales
- `Add`, `Remove`, `Delete` - Para acciones
- `CalendarToday`, `TrendingUp`, `WorkOff` - Para estadísticas

## Manejo de Estados

### Estados Principales:
- `loading` - Para mostrar spinners durante cargas
- `error` - Para mostrar mensajes de error
- `success` - Para mostrar mensajes de éxito
- `activeStep` - Para controlar el stepper de reservación
- `tabValue` - Para controlar las pestañas de empleado

### Estados de Datos:
- `servicios`, `serviciosSeleccionados` - Para gestión de servicios
- `empleados`, `empleadoSeleccionado` - Para gestión de empleados
- `horarios`, `horarioSeleccionado` - Para gestión de horarios
- `citas`, `ausencias`, `estadisticas` - Para datos del empleado

## Validaciones

### Reservación:
- Al menos un servicio seleccionado
- Empleado seleccionado
- Fecha y horario seleccionados
- Cantidades válidas (mínimo 1)

### Ausencias:
- Fecha requerida
- Motivo requerido
- Tipo de ausencia seleccionado

## Integración con Backend

### Autenticación:
- Uso de `localStorage` para el token de autenticación
- Interceptor en `api.js` para agregar headers de autorización

### Manejo de Errores:
- Captura de errores de red
- Mensajes de error descriptivos
- Fallbacks para datos faltantes

### Optimizaciones:
- Carga condicional de datos
- Validaciones en el frontend
- Feedback visual inmediato

## Próximas Mejoras

1. **Notificaciones en tiempo real** usando WebSockets
2. **Calendario visual** para selección de fechas
3. **Filtros avanzados** para servicios y empleados
4. **Historial de reservaciones** para clientes
5. **Sistema de calificaciones** post-servicio
6. **Integración con Google Calendar** en el frontend
7. **Modo offline** para reservaciones básicas
8. **Progreso de carga** más detallado
9. **Animaciones** para transiciones
10. **Responsive design** mejorado para móviles 