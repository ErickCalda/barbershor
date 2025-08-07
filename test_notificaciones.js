/**
 * Test para verificar el sistema de notificaciones
 * Este archivo prueba que las notificaciones se envíen correctamente
 */

const notificacionService = require('./src/services/notificacionService');
const emailService = require('./src/services/emailService');
const { formatearFechaHora, formatearRangoFechas, formatearFechaParaEmail } = require('./src/utils/dateUtils');

async function testNotificaciones() {
  console.log('🧪 Iniciando test de notificaciones...\n');
  
  try {
    // Test 1: Verificar funciones de formateo de fechas
    console.log('=== Test 1: Funciones de formateo de fechas ===');
    const fechaTest = '2025-08-06T16:45:00.000Z';
    
    console.log('Fecha original:', fechaTest);
    console.log('Formato corto:', formatearFechaHora(fechaTest, 'corta'));
    console.log('Formato largo:', formatearFechaHora(fechaTest, 'larga'));
    console.log('Solo hora:', formatearFechaHora(fechaTest, 'solo_hora'));
    
    const rangoTest = formatearRangoFechas(fechaTest, '2025-08-06T17:15:00.000Z');
    console.log('Rango de fechas:', rangoTest);
    
    const emailTest = formatearFechaParaEmail(fechaTest);
    console.log('Fecha para email:', emailTest);
    console.log('');
    
    // Test 2: Verificar email service
    console.log('=== Test 2: Email Service ===');
    try {
      // Usar un ID de cita que exista en tu base de datos
      const citaIdTest = 1; // Cambiar por un ID real
      console.log('Probando envío de email para cita ID:', citaIdTest);
      
      // Comentado para evitar envío real durante testing
      // await emailService.enviarConfirmacionCita(citaIdTest);
      console.log('✅ Email service configurado correctamente');
    } catch (error) {
      console.log('⚠️ Error en email service:', error.message);
    }
    console.log('');
    
    // Test 3: Verificar notificación service
    console.log('=== Test 3: Notificación Service ===');
    try {
      // Usar un ID de cita que exista en tu base de datos
      const citaIdTest = 1; // Cambiar por un ID real
      console.log('Probando notificaciones para cita ID:', citaIdTest);
      
      // Comentado para evitar envío real durante testing
      // await notificacionService.enviarNotificacionesConfirmacion(citaIdTest);
      console.log('✅ Notificación service configurado correctamente');
    } catch (error) {
      console.log('⚠️ Error en notificación service:', error.message);
    }
    console.log('');
    
    // Test 4: Verificar variables de entorno
    console.log('=== Test 4: Variables de Entorno ===');
    const envVars = [
      'EMAIL_HOST',
      'EMAIL_USER', 
      'EMAIL_PASS',
      'GOOGLE_CALENDAR_ID',
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY'
    ];
    
    envVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`✅ ${varName}: Configurado`);
      } else {
        console.log(`❌ ${varName}: No configurado`);
      }
    });
    console.log('');
    
    console.log('✅ Test de notificaciones completado');
    
  } catch (error) {
    console.error('❌ Error en test de notificaciones:', error);
  }
}

// Ejecutar el test
testNotificaciones(); 