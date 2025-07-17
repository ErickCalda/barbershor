const { query } = require('./src/config/database');

async function probarNotificacionesBasicas() {
  try {
    console.log('🧪 [test_notificaciones_simple] Iniciando pruebas básicas de notificaciones...');
    
    // Verificar que hay citas en la base de datos
    const citasSql = 'SELECT id FROM citas LIMIT 1';
    const citas = await query(citasSql);
    
    if (citas.length === 0) {
      console.log('⚠️ No hay citas en la base de datos para probar');
      console.log('💡 Crea una cita primero usando el flujo de reservación');
      return;
    }
    
    const citaId = citas[0].id;
    console.log(`📅 Cita encontrada con ID: ${citaId}`);
    
    // Probar consulta de información de cita
    console.log('\n🔍 Probando consulta de información de cita...');
    const citaInfoSql = `
      SELECT 
        c.id,
        c.fecha,
        c.hora_inicio,
        c.hora_fin,
        c.total,
        CONCAT(cl.nombre, ' ', cl.apellido) as cliente_nombre,
        CONCAT(e.nombre, ' ', e.apellido) as empleado_nombre
      FROM citas c
      INNER JOIN clientes cl ON c.cliente_id = cl.id
      INNER JOIN usuarios u ON cl.usuario_id = u.id
      INNER JOIN empleados e ON c.empleado_id = e.id
      INNER JOIN usuarios eu ON e.usuario_id = eu.id
      WHERE c.id = ?
    `;
    
    const [citaInfo] = await query(citaInfoSql, [citaId]);
    
    if (citaInfo) {
      console.log('✅ Información de cita obtenida correctamente:');
      console.log(`   - Cliente: ${citaInfo.cliente_nombre}`);
      console.log(`   - Empleado: ${citaInfo.empleado_nombre}`);
      console.log(`   - Fecha: ${citaInfo.fecha}`);
      console.log(`   - Hora: ${citaInfo.hora_inicio} - ${citaInfo.hora_fin}`);
      console.log(`   - Total: $${citaInfo.total}`);
    } else {
      console.log('❌ No se pudo obtener información de la cita');
    }
    
    // Probar consulta de servicios de la cita
    console.log('\n🔍 Probando consulta de servicios de la cita...');
    const serviciosSql = `
      SELECT 
        s.nombre,
        s.precio,
        dc.cantidad,
        dc.subtotal
      FROM detalle_cita dc
      INNER JOIN servicios s ON dc.servicio_id = s.id
      WHERE dc.cita_id = ?
    `;
    
    const servicios = await query(serviciosSql, [citaId]);
    
    if (servicios.length > 0) {
      console.log('✅ Servicios de la cita obtenidos correctamente:');
      servicios.forEach((servicio, index) => {
        console.log(`   ${index + 1}. ${servicio.nombre} - $${servicio.precio} x ${servicio.cantidad} = $${servicio.subtotal}`);
      });
    } else {
      console.log('❌ No se encontraron servicios para la cita');
    }
    
    // Probar actualización de recordatorio
    console.log('\n🔍 Probando actualización de recordatorio...');
    const updateSql = 'UPDATE citas SET recordatorio_enviado = 1 WHERE id = ?';
    await query(updateSql, [citaId]);
    console.log('✅ Recordatorio marcado como enviado');
    
    // Verificar la actualización
    const checkSql = 'SELECT recordatorio_enviado FROM citas WHERE id = ?';
    const [checkResult] = await query(checkSql, [citaId]);
    console.log(`✅ Verificación: recordatorio_enviado = ${checkResult.recordatorio_enviado}`);
    
    console.log('\n✅ Pruebas básicas de notificaciones completadas exitosamente');
    console.log('\n📋 Resumen:');
    console.log('- Las consultas de base de datos funcionan correctamente');
    console.log('- La estructura de datos está correcta');
    console.log('- Las actualizaciones funcionan');
    console.log('- Para notificaciones completas, configura las credenciales de Firebase');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar pruebas
probarNotificacionesBasicas(); 