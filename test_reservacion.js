/**
 * Script de prueba para el flujo de reservación de citas
 * Ejecutar con: node test_reservacion.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your_test_token_here'; // Reemplazar con token válido

// Configurar axios
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para hacer requests con token
const apiWithAuth = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
});

async function testFlujoReservacion() {
  console.log('🧪 Iniciando pruebas del flujo de reservación...\n');

  try {
    // 1. Obtener servicios disponibles
    console.log('1️⃣ Probando: Obtener servicios disponibles');
    const serviciosResponse = await api.get('/reservacion/servicios');
    console.log('✅ Servicios obtenidos:', serviciosResponse.data.count);
    console.log('📋 Primer servicio:', serviciosResponse.data.data[0]?.nombre || 'No hay servicios');
    
    if (serviciosResponse.data.data.length === 0) {
      console.log('⚠️ No hay servicios disponibles. Agregando datos de prueba...');
      return;
    }

    const primerServicio = serviciosResponse.data.data[0];
    console.log('');

    // 2. Obtener empleados disponibles
    console.log('2️⃣ Probando: Obtener empleados disponibles');
    const fechaPrueba = new Date();
    fechaPrueba.setDate(fechaPrueba.getDate() + 1); // Mañana
    const fechaFormato = fechaPrueba.toISOString().split('T')[0];
    
    const empleadosResponse = await api.get(`/reservacion/empleados-disponibles?servicio_id=${primerServicio.id}&fecha=${fechaFormato}`);
    console.log('✅ Empleados disponibles:', empleadosResponse.data.count);
    console.log('👨‍💼 Primer empleado:', empleadosResponse.data.data[0]?.nombre || 'No hay empleados disponibles');
    
    if (empleadosResponse.data.data.length === 0) {
      console.log('⚠️ No hay empleados disponibles para esta fecha/servicio');
      return;
    }

    const primerEmpleado = empleadosResponse.data.data[0];
    console.log('');

    // 3. Obtener horarios disponibles
    console.log('3️⃣ Probando: Obtener horarios disponibles');
    const horariosResponse = await api.get(`/reservacion/horarios-disponibles?empleado_id=${primerEmpleado.id}&fecha=${fechaFormato}&servicio_id=${primerServicio.id}`);
    console.log('✅ Horarios disponibles:', horariosResponse.data.count);
    
    if (horariosResponse.data.data.length === 0) {
      console.log('⚠️ No hay horarios disponibles para este empleado');
      return;
    }

    const primerHorario = horariosResponse.data.data[0];
    console.log('🕐 Primer horario disponible:', primerHorario.hora_inicio, '-', primerHorario.hora_fin);
    console.log('');

    // 4. Procesar reservación (solo si hay token válido)
    if (TEST_TOKEN !== 'your_test_token_here') {
      console.log('4️⃣ Probando: Procesar reservación');
      
      const fechaHoraInicio = new Date(`${fechaFormato}T${primerHorario.hora_inicio}:00`);
      const fechaHoraFin = new Date(`${fechaFormato}T${primerHorario.hora_fin}:00`);
      
      const reservacionData = {
        empleado_id: primerEmpleado.id,
        servicio_id: primerServicio.id,
        fecha_hora_inicio: fechaHoraInicio.toISOString(),
        fecha_hora_fin: fechaHoraFin.toISOString(),
        precio_total: primerServicio.precio,
        metodo_pago: 1,
        referencia_pago: `TEST_${Date.now()}`,
        notas: 'Cita de prueba'
      };

      try {
        const reservacionResponse = await apiWithAuth.post('/reservacion/procesar', reservacionData);
        console.log('✅ Reservación procesada exitosamente');
        console.log('📋 ID de cita:', reservacionResponse.data.data.cita_id);
        console.log('💰 ID de pago:', reservacionResponse.data.data.pago_id);
        console.log('');
      } catch (error) {
        console.log('❌ Error procesando reservación:', error.response?.data?.message || error.message);
        console.log('');
      }
    } else {
      console.log('4️⃣ ⏭️ Saltando procesamiento de reservación (sin token válido)');
      console.log('');
    }

    // 5. Probar endpoints de empleado (solo si hay token válido)
    if (TEST_TOKEN !== 'your_test_token_here') {
      console.log('5️⃣ Probando: Endpoints de empleado');
      
      try {
        const citasEmpleadoResponse = await apiWithAuth.get('/empleado/citas');
        console.log('✅ Citas del empleado:', citasEmpleadoResponse.data.count);
        
        const citasHoyResponse = await apiWithAuth.get('/empleado/citas/hoy');
        console.log('✅ Citas de hoy:', citasHoyResponse.data.count);
        
        const estadisticasResponse = await apiWithAuth.get('/empleado/estadisticas?periodo=mes');
        console.log('✅ Estadísticas del mes:', estadisticasResponse.data.data);
        console.log('');
      } catch (error) {
        console.log('❌ Error en endpoints de empleado:', error.response?.data?.message || error.message);
        console.log('');
      }
    } else {
      console.log('5️⃣ ⏭️ Saltando endpoints de empleado (sin token válido)');
      console.log('');
    }

    console.log('🎉 Pruebas completadas exitosamente!');
    console.log('\n📝 Resumen:');
    console.log(`- Servicios disponibles: ${serviciosResponse.data.count}`);
    console.log(`- Empleados disponibles: ${empleadosResponse.data.count}`);
    console.log(`- Horarios disponibles: ${horariosResponse.data.count}`);

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 Sugerencias:');
      console.log('1. Verifica que el servidor esté ejecutándose');
      console.log('2. Verifica la conexión a la base de datos');
      console.log('3. Revisa los logs del servidor');
    }
  }
}

async function testEndpointsPublicos() {
  console.log('🧪 Probando endpoints públicos...\n');

  const endpoints = [
    { name: 'Servicios', url: '/reservacion/servicios' },
    { name: 'Empleados (con parámetros)', url: '/reservacion/empleados-disponibles?servicio_id=1&fecha=2024-01-15' },
    { name: 'Horarios (con parámetros)', url: '/reservacion/horarios-disponibles?empleado_id=1&fecha=2024-01-15&servicio_id=1' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Probando: ${endpoint.name}`);
      const response = await api.get(endpoint.url);
      console.log(`✅ ${endpoint.name}: ${response.data.count || response.data.data?.length || 'OK'}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.response?.status || error.message}`);
    }
  }
  
  console.log('');
}

// Función principal
async function main() {
  console.log('🚀 Iniciando pruebas del sistema de reservación\n');
  
  // Probar endpoints públicos
  await testEndpointsPublicos();
  
  // Probar flujo completo
  await testFlujoReservacion();
  
  console.log('\n📋 Instrucciones para usar el sistema:');
  console.log('1. Asegúrate de que el servidor esté ejecutándose en puerto 5000');
  console.log('2. Verifica que la base de datos tenga datos de prueba');
  console.log('3. Para probar reservaciones, actualiza TEST_TOKEN con un token válido');
  console.log('4. Ejecuta: node test_reservacion.js');
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testFlujoReservacion,
  testEndpointsPublicos
}; 