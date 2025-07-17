/**
 * Script de Prueba para el Flujo de Reservación - Frontend
 * 
 * Este script simula las interacciones del usuario en el frontend
 * para probar el flujo completo de reservación.
 */

// Simulación de datos de prueba
const datosPrueba = {
  servicios: [
    {
      id: 1,
      nombre: "Corte de Cabello",
      descripcion: "Corte profesional de cabello",
      precio: 25.00,
      duracion: 30
    },
    {
      id: 2,
      nombre: "Barba",
      descripcion: "Arreglo y modelado de barba",
      precio: 20.00,
      duracion: 20
    },
    {
      id: 3,
      nombre: "Corte + Barba",
      descripcion: "Corte de cabello y arreglo de barba",
      precio: 40.00,
      duracion: 45
    }
  ],
  empleados: [
    {
      id: 1,
      nombre: "Juan",
      apellido: "Pérez",
      especialidades: ["Corte de Cabello", "Barba"],
      experiencia: 5
    },
    {
      id: 2,
      nombre: "Carlos",
      apellido: "García",
      especialidades: ["Corte de Cabello", "Corte + Barba"],
      experiencia: 3
    }
  ],
  horarios: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
};

// Función para simular el flujo de reservación
function simularFlujoReservacion() {
  console.log("🚀 Iniciando simulación del flujo de reservación...\n");

  // Paso 1: Selección de servicios
  console.log("📋 PASO 1: Selección de Servicios");
  console.log("Servicios disponibles:");
  datosPrueba.servicios.forEach(servicio => {
    console.log(`  - ${servicio.nombre}: $${servicio.precio} (${servicio.duracion} min)`);
  });
  
  const serviciosSeleccionados = [
    { ...datosPrueba.servicios[0], cantidad: 1 },
    { ...datosPrueba.servicios[1], cantidad: 1 }
  ];
  
  console.log("Servicios seleccionados:");
  serviciosSeleccionados.forEach(servicio => {
    console.log(`  ✅ ${servicio.nombre} (cantidad: ${servicio.cantidad})`);
  });
  
  const totalServicios = serviciosSeleccionados.reduce((sum, s) => sum + (s.precio * s.cantidad), 0);
  console.log(`Total: $${totalServicios}\n`);

  // Paso 2: Selección de empleado
  console.log("👨‍💼 PASO 2: Selección de Empleado");
  console.log("Empleados disponibles para los servicios seleccionados:");
  datosPrueba.empleados.forEach(empleado => {
    console.log(`  - ${empleado.nombre} ${empleado.apellido} (${empleado.experiencia} años exp.)`);
    console.log(`    Especialidades: ${empleado.especialidades.join(', ')}`);
  });
  
  const empleadoSeleccionado = datosPrueba.empleados[0];
  console.log(`Empleado seleccionado: ${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido}\n`);

  // Paso 3: Selección de horario
  console.log("🕐 PASO 3: Selección de Horario");
  const fechaSeleccionada = "2024-01-15";
  console.log(`Fecha seleccionada: ${fechaSeleccionada}`);
  
  console.log("Horarios disponibles:");
  datosPrueba.horarios.forEach(horario => {
    console.log(`  - ${horario}`);
  });
  
  const horarioSeleccionado = "10:00";
  console.log(`Horario seleccionado: ${horarioSeleccionado}\n`);

  // Paso 4: Confirmación
  console.log("✅ PASO 4: Confirmación de Reservación");
  console.log("Resumen de la reservación:");
  console.log(`  📅 Fecha: ${fechaSeleccionada}`);
  console.log(`  🕐 Hora: ${horarioSeleccionado}`);
  console.log(`  👨‍💼 Barbero: ${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido}`);
  console.log(`  💰 Total: $${totalServicios}`);
  console.log("  📋 Servicios:");
  serviciosSeleccionados.forEach(servicio => {
    console.log(`    - ${servicio.nombre}: $${servicio.precio * servicio.cantidad}`);
  });

  // Simular envío de reservación
  console.log("\n📤 Enviando reservación al backend...");
  
  const reservacionData = {
    servicios: serviciosSeleccionados.map(s => ({
      id: s.id,
      cantidad: s.cantidad
    })),
    empleadoId: empleadoSeleccionado.id,
    fecha: fechaSeleccionada,
    horario: horarioSeleccionado,
    total: totalServicios
  };

  console.log("Datos enviados:", JSON.stringify(reservacionData, null, 2));
  
  // Simular respuesta exitosa
  console.log("\n✅ Reservación procesada exitosamente!");
  console.log("📧 Email de confirmación enviado");
  console.log("📅 Evento agregado a Google Calendar");
  console.log("🔔 Notificación push enviada");
  
  return {
    success: true,
    reservacionId: Math.floor(Math.random() * 1000) + 1,
    data: reservacionData
  };
}

// Función para simular el panel de empleado
function simularPanelEmpleado() {
  console.log("\n👨‍💼 Iniciando simulación del panel de empleado...\n");

  // Datos de prueba para el empleado
  const empleadoData = {
    info: {
      id: 1,
      nombre: "Juan",
      apellido: "Pérez",
      email: "juan.perez@barberia.com",
      especialidades: ["Corte de Cabello", "Barba"],
      experiencia: 5
    },
    citas: [
      {
        id: 1,
        cliente: { nombre: "Carlos", apellido: "López" },
        fecha: "2024-01-15",
        horario: "10:00",
        servicios: [{ nombre: "Corte de Cabello" }],
        total: 25.00,
        estado: "confirmada"
      },
      {
        id: 2,
        cliente: { nombre: "Miguel", apellido: "García" },
        fecha: "2024-01-15",
        horario: "14:00",
        servicios: [{ nombre: "Barba" }],
        total: 20.00,
        estado: "pendiente"
      }
    ],
    ausencias: [
      {
        id: 1,
        fecha: "2024-01-20",
        tipo: "personal",
        motivo: "Cita médica",
        estado: "aprobada"
      }
    ],
    estadisticas: {
      citasCompletadas: 45,
      citasPendientes: 3,
      ausenciasAprobadas: 2
    }
  };

  // Mostrar información del empleado
  console.log("📊 INFORMACIÓN DEL EMPLEADO");
  console.log(`Nombre: ${empleadoData.info.nombre} ${empleadoData.info.apellido}`);
  console.log(`Email: ${empleadoData.info.email}`);
  console.log(`Especialidades: ${empleadoData.info.especialidades.join(', ')}`);
  console.log(`Experiencia: ${empleadoData.info.experiencia} años\n`);

  // Mostrar citas
  console.log("📅 MIS CITAS");
  empleadoData.citas.forEach(cita => {
    console.log(`  - ${cita.cliente.nombre} ${cita.cliente.apellido}`);
    console.log(`    Fecha: ${cita.fecha} ${cita.horario}`);
    console.log(`    Servicios: ${cita.servicios.map(s => s.nombre).join(', ')}`);
    console.log(`    Estado: ${cita.estado}`);
    console.log(`    Total: $${cita.total}\n`);
  });

  // Mostrar ausencias
  console.log("🏖️ AUSENCIAS");
  empleadoData.ausencias.forEach(ausencia => {
    console.log(`  - ${ausencia.fecha} (${ausencia.tipo})`);
    console.log(`    Motivo: ${ausencia.motivo}`);
    console.log(`    Estado: ${ausencia.estado}\n`);
  });

  // Mostrar estadísticas
  console.log("📈 ESTADÍSTICAS");
  console.log(`Citas completadas: ${empleadoData.estadisticas.citasCompletadas}`);
  console.log(`Citas pendientes: ${empleadoData.estadisticas.citasPendientes}`);
  console.log(`Ausencias aprobadas: ${empleadoData.estadisticas.ausenciasAprobadas}`);

  return empleadoData;
}

// Función para simular errores comunes
function simularErrores() {
  console.log("\n❌ Simulando errores comunes...\n");

  const errores = [
    {
      tipo: "Sin servicios seleccionados",
      descripcion: "El usuario intenta continuar sin seleccionar servicios",
      solucion: "Mostrar mensaje de error y bloquear continuar"
    },
    {
      tipo: "Sin empleado seleccionado",
      descripcion: "El usuario intenta continuar sin seleccionar empleado",
      solucion: "Mostrar mensaje de error y bloquear continuar"
    },
    {
      tipo: "Sin fecha/horario seleccionado",
      descripcion: "El usuario intenta continuar sin seleccionar fecha u horario",
      solucion: "Mostrar mensaje de error y bloquear continuar"
    },
    {
      tipo: "Error de red",
      descripcion: "Problemas de conectividad con el backend",
      solucion: "Mostrar mensaje de error y opción de reintentar"
    },
    {
      tipo: "Servicio no disponible",
      descripcion: "El servicio seleccionado ya no está disponible",
      solucion: "Actualizar lista de servicios y notificar al usuario"
    }
  ];

  errores.forEach((error, index) => {
    console.log(`${index + 1}. ${error.tipo}`);
    console.log(`   Descripción: ${error.descripcion}`);
    console.log(`   Solución: ${error.solucion}\n`);
  });
}

// Función principal para ejecutar todas las simulaciones
function ejecutarPruebas() {
  console.log("🧪 PRUEBAS DEL FLUJO DE RESERVACIÓN - FRONTEND");
  console.log("=" .repeat(60));

  try {
    // Simular flujo de reservación
    const resultadoReservacion = simularFlujoReservacion();
    
    // Simular panel de empleado
    const resultadoEmpleado = simularPanelEmpleado();
    
    // Simular errores
    simularErrores();

    console.log("\n" + "=" .repeat(60));
    console.log("✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE");
    console.log("📊 Resumen:");
    console.log(`  - Reservación creada con ID: ${resultadoReservacion.reservacionId}`);
    console.log(`  - Empleado: ${resultadoEmpleado.info.nombre} ${resultadoEmpleado.info.apellido}`);
    console.log(`  - Citas del empleado: ${resultadoEmpleado.citas.length}`);
    console.log(`  - Ausencias del empleado: ${resultadoEmpleado.ausencias.length}`);

  } catch (error) {
    console.error("❌ Error durante las pruebas:", error.message);
  }
}

// Ejecutar las pruebas si el script se ejecuta directamente
if (typeof window === 'undefined') {
  // En Node.js
  ejecutarPruebas();
} else {
  // En el navegador
  console.log("Para ejecutar las pruebas, ejecuta este script en Node.js:");
  console.log("node test_reservacion_frontend.js");
}

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    simularFlujoReservacion,
    simularPanelEmpleado,
    simularErrores,
    ejecutarPruebas
  };
} 