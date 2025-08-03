const cron = require('node-cron');
const { query } = require('../config/database');

cron.schedule('0 5 * * *', async () => {
  console.log('⏰ Ejecutando cron para actualizar ausencias expiradas...');

  try {
    const resultado = await query(`
      UPDATE peluqueria_db.ausencias_empleados
      SET aprobada = 1
      WHERE fecha_fin < CURDATE() AND aprobada = 0
    `);

    console.log(`✅ Ausencias actualizadas: ${resultado.affectedRows}`);
  } catch (error) {
    console.error('❌ Error al actualizar ausencias:', error);
  }
});
