# Utilidades de Fechas y Horas

Este módulo proporciona funciones para el manejo consistente de fechas y horas en toda la aplicación BarberShot.

## Problema Resuelto

Antes de esta utilidad, las fechas se mostraban en formato UTC y con diferencias horarias incorrectas en las notificaciones. Ahora todas las fechas se formatean correctamente en la zona horaria de Ecuador (UTC-5).

## Funciones Disponibles

### `formatearFechaHora(fechaString, formato)`

Formatea una fecha y hora según el formato especificado.

**Parámetros:**
- `fechaString`: Fecha en formato string o Date
- `formato`: Tipo de formato ('corta', 'larga', 'solo_hora', 'fecha_hora_completa')

**Ejemplos:**
```javascript
// Formato corto: 06/08/2025, 11:45
formatearFechaHora('2025-08-06T16:45:00.000Z', 'corta')

// Formato largo: miércoles, 6 de agosto de 2025
formatearFechaHora('2025-08-06T16:45:00.000Z', 'larga')

// Solo hora: 11:45
formatearFechaHora('2025-08-06T16:45:00.000Z', 'solo_hora')
```

### `formatearRangoFechas(fechaInicio, fechaFin)`

Formatea un rango de fechas para mostrar inicio y fin.

**Retorna:**
```javascript
{
  fecha: "miércoles, 6 de agosto de 2025",
  horaInicio: "11:45",
  horaFin: "12:15",
  rangoCompleto: "11:45 - 12:15"
}
```

### `formatearFechaParaEmail(fechaString)`

Formatea una fecha específicamente para usar en templates de email.

**Retorna:**
```javascript
{
  fecha: "miércoles, 6 de agosto de 2025",
  hora: "11:45",
  fechaHora: "miércoles, 6 de agosto de 2025, 11:45"
}
```

## Uso en Servicios

### Email Service
```javascript
const { formatearFechaParaEmail, formatearRangoFechas } = require('../utils/dateUtils');

// En templates de email
const fechaFormateada = formatearFechaParaEmail(cita.fecha_hora_inicio);
const rangoHoras = formatearRangoFechas(cita.fecha_hora_inicio, cita.fecha_hora_fin);
```

### Notificación Push Service
```javascript
const { formatearFechaHora } = require('../utils/dateUtils');

// Para notificaciones push
const fecha = formatearFechaHora(cita.fecha_hora_inicio, 'corta');
const hora = formatearFechaHora(cita.fecha_hora_inicio, 'solo_hora');
```

## Configuración de Zona Horaria

La utilidad está configurada para usar la zona horaria de Ecuador (`America/Guayaquil`). Si necesitas cambiar la zona horaria, modifica la constante `zonaHoraria` en el archivo `dateUtils.js`.

## Manejo de Errores

Todas las funciones incluyen manejo de errores y retornan "N/A" si la fecha es inválida o no se puede procesar.

## Ejemplo de Uso Completo

Ver el archivo `dateUtilsExample.js` para ejemplos detallados de uso. 