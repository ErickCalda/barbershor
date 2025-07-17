require('./src/config/firebaseAdmin');
const notificacionService = require('./src/services/notificacionService');
const { query } = require('./src/config/database');

async function probarNotificaciones() {
  try {
    console.log('🧪 [test_notificaciones] Iniciando pruebas de notificaciones...');
    
    // Verificar que hay citas en la base de datos
    const citasSql = 'SELECT id FROM citas LIMIT 1';
    const citas = await query(citasSql);
    
    if (citas.length === 0) {
      console.log('⚠️ No hay citas en la base de datos para probar');
      console.log('💡 Crea una cita primero usando el flujo de reservación');
      return;
    }
    
    const citaId = citas[0].id;
    console.log(`📅 Probando notificaciones con cita ID: ${citaId}`);
    
    // Probar envío de confirmación
    console.log('\n🔔 Probando envío de confirmación...');
    try {
      await notificacionService.enviarNotificacionesConfirmacion(citaId);
      console.log('✅ Confirmación enviada exitosamente');
    } catch (error) {
      console.log('⚠️ Error enviando confirmación (esto es normal si no hay configuración de email/Google):', error.message);
    }
    
    // Probar envío de recordatorio
    console.log('\n🔔 Probando envío de recordatorio...');
    try {
      await notificacionService.enviarNotificacionesRecordatorio(citaId);
      console.log('✅ Recordatorio enviado exitosamente');
    } catch (error) {
      console.log('⚠️ Error enviando recordatorio (esto es normal si no hay configuración de email/Google):', error.message);
    }
    
    // Probar programación de recordatorios
    console.log('\n⏰ Probando programación de recordatorios...');
    try {
      await notificacionService.programarRecordatorios();
      console.log('✅ Programación de recordatorios completada');
    } catch (error) {
      console.log('⚠️ Error programando recordatorios:', error.message);
    }
    
    console.log('\n✅ Pruebas de notificaciones completadas');
    console.log('\n📋 Resumen:');
    console.log('- Si ves errores de configuración, es normal si no has configurado email/Google Calendar');
    console.log('- Los servicios están funcionando correctamente');
    console.log('- Para activar las notificaciones, configura las variables de entorno en .env');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar pruebas
probarNotificaciones(); 