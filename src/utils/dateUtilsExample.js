/**
 * Ejemplo de uso de las utilidades de fechas
 * Este archivo muestra cómo usar las funciones de formateo de fechas
 */

const { 
  formatearFechaHora, 
  formatearRangoFechas, 
  formatearFechaParaEmail 
} = require('./dateUtils');

// Ejemplo de uso
const fechaEjemplo = '2025-08-06T16:45:00.000Z';

console.log('=== Ejemplos de formateo de fechas ===\n');

// Formato corto (fecha y hora)
console.log('Formato corto:', formatearFechaHora(fechaEjemplo, 'corta'));
// Salida: 06/08/2025, 11:45

// Formato largo (solo fecha)
console.log('Formato largo:', formatearFechaHora(fechaEjemplo, 'larga'));
// Salida: miércoles, 6 de agosto de 2025

// Solo hora
console.log('Solo hora:', formatearFechaHora(fechaEjemplo, 'solo_hora'));
// Salida: 11:45

// Fecha y hora completa
console.log('Fecha y hora completa:', formatearFechaHora(fechaEjemplo, 'fecha_hora_completa'));
// Salida: miércoles, 6 de agosto de 2025, 11:45

console.log('\n=== Ejemplo de rango de fechas ===\n');

const fechaInicio = '2025-08-06T16:45:00.000Z';
const fechaFin = '2025-08-06T17:15:00.000Z';

const rango = formatearRangoFechas(fechaInicio, fechaFin);
console.log('Fecha:', rango.fecha);
console.log('Hora inicio:', rango.horaInicio);
console.log('Hora fin:', rango.horaFin);
console.log('Rango completo:', rango.rangoCompleto);

console.log('\n=== Ejemplo para emails ===\n');

const fechaEmail = formatearFechaParaEmail(fechaEjemplo);
console.log('Fecha para email:', fechaEmail.fecha);
console.log('Hora para email:', fechaEmail.hora);
console.log('Fecha y hora para email:', fechaEmail.fechaHora);

console.log('\n=== Notas importantes ===');
console.log('- Todas las fechas se muestran en zona horaria de Ecuador (UTC-5)');
console.log('- Los formatos están optimizados para notificaciones y emails');
console.log('- Manejo automático de errores con fallback a "N/A"'); 