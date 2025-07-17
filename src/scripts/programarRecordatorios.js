const cron = require('node-cron');
const notificacionService = require('../services/notificacionService');
const { query } = require('../config/database');

console.log('⏰ [programarRecordatorios] Iniciando programador de recordatorios...');

// Programar recordatorios para citas del día siguiente
// Se ejecuta todos los días a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
  try {
    console.log('🔔 [programarRecordatorios] Ejecutando recordatorios automáticos...');
    await notificacionService.programarRecordatorios();
    console.log('✅ [programarRecordatorios] Recordatorios programados completados');
  } catch (error) {
    console.error('❌ [programarRecordatorios] Error ejecutando recordatorios:', error);
  }
});

// Programar recordatorios para citas en 2 horas
// Se ejecuta cada hora
cron.schedule('0 * * * *', async () => {
  try {
    console.log('🔔 [programarRecordatorios] Ejecutando recordatorios de 2 horas...');
    
    // Obtener citas en las próximas 2 horas
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    const citasSql = `
      SELECT c.id
      FROM citas c
      INNER JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE c.fecha = DATE(NOW())
        AND c.hora_inicio BETWEEN TIME(NOW()) AND TIME(?)
        AND ec.nombre IN ('Confirmada', 'Pendiente')
        AND c.recordatorio_2h_enviado = 0
    `;
    
    const citas = await query(citasSql, [twoHoursLater.toTimeString().slice(0, 5)]);
    
    console.log(`📅 [programarRecordatorios] Encontradas ${citas.length} citas para recordatorio de 2 horas`);
    
    for (const cita of citas) {
      try {
        await notificacionService.enviarNotificacionesRecordatorio(cita.id);
        
        // Marcar recordatorio como enviado
        await query('UPDATE citas SET recordatorio_2h_enviado = 1 WHERE id = ?', [cita.id]);
        
      } catch (error) {
        console.error(`❌ Error enviando recordatorio de 2h para cita ${cita.id}:`, error);
      }
    }
    
    console.log('✅ [programarRecordatorios] Recordatorios de 2 horas completados');
    
  } catch (error) {
    console.error('❌ [programarRecordatorios] Error ejecutando recordatorios de 2 horas:', error);
  }
});

// Limpiar recordatorios enviados (resetear flags diariamente)
// Se ejecuta todos los días a las 12:00 AM
cron.schedule('0 0 * * *', async () => {
  try {
    console.log('🧹 [programarRecordatorios] Limpiando flags de recordatorios...');
    
    await query('UPDATE citas SET recordatorio_enviado = 0, recordatorio_2h_enviado = 0');
    
    console.log('✅ [programarRecordatorios] Flags de recordatorios limpiados');
    
  } catch (error) {
    console.error('❌ [programarRecordatorios] Error limpiando flags:', error);
  }
});

console.log('✅ [programarRecordatorios] Programador de recordatorios iniciado correctamente');

// Mantener el proceso activo
process.on('SIGINT', () => {
  console.log('🛑 [programarRecordatorios] Deteniendo programador de recordatorios...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 [programarRecordatorios] Deteniendo programador de recordatorios...');
  process.exit(0);
}); 