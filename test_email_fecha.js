/**
 * Prueba para verificar el formateo de fechas en emails
 */

// Simular las funciones de dateUtils
const formatearFechaParaEmail = (fechaString) => {
  try {
    console.log('📅 [dateUtils] formatearFechaParaEmail - entrada:', fechaString, 'tipo:', typeof fechaString);
    
    if (!fechaString) {
      console.log('📅 [dateUtils] Fecha vacía, retornando N/A');
      return {
        fecha: "N/A",
        hora: "N/A",
        fechaHora: "N/A"
      };
    }
    
    // Si es un objeto Date, convertirlo a string
    if (fechaString instanceof Date) {
      fechaString = fechaString.toISOString();
    }
    
    // Si es un string de MySQL datetime, convertirlo a formato ISO
    let fechaIso = fechaString;
    if (typeof fechaString === 'string') {
      // MySQL datetime format: "2024-01-15 14:30:00"
      if (fechaString.includes(" ") && fechaString.includes("-")) {
        fechaIso = fechaString.replace(" ", "T");
      }
    }
    
    console.log('📅 [dateUtils] Fecha ISO procesada:', fechaIso);
    
    let fecha = new Date(fechaIso);
    
    if (isNaN(fecha.getTime())) {
      console.log('📅 [dateUtils] Fecha inválida después de parseo');
      return {
        fecha: "N/A",
        hora: "N/A",
        fechaHora: "N/A"
      };
    }
    
    console.log('📅 [dateUtils] Fecha parseada correctamente:', fecha);
    
    // Convertir a hora local de Ecuador (UTC-5)
    fecha = new Date(fecha.getTime() - 5 * 60 * 60 * 1000);
    
    const fechaFormateada = fecha.toLocaleDateString("es-EC", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    
    const horaFormateada = fecha.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit"
    });
    
    const fechaHoraCompleta = `${fechaFormateada}, ${horaFormateada}`;
    
    const resultado = {
      fecha: fechaFormateada,
      hora: horaFormateada,
      fechaHora: fechaHoraCompleta
    };
    
    console.log('📅 [dateUtils] Resultado final:', resultado);
    return resultado;
  } catch (error) {
    console.error('Error formateando fecha para email:', error);
    return {
      fecha: "N/A",
      hora: "N/A",
      fechaHora: "N/A"
    };
  }
};

const formatearRangoFechas = (fechaInicio, fechaFin) => {
  try {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return {
        fecha: "N/A",
        horaInicio: "N/A",
        horaFin: "N/A",
        rangoCompleto: "N/A"
      };
    }
    
    // Convertir a hora local de Ecuador
    const inicioLocal = new Date(inicio.getTime() - 5 * 60 * 60 * 1000);
    const finLocal = new Date(fin.getTime() - 5 * 60 * 60 * 1000);
    
    const fecha = inicioLocal.toLocaleDateString("es-EC", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    
    const horaInicio = inicioLocal.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit"
    });
    
    const horaFin = finLocal.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit"
    });
    
    const rangoCompleto = `${horaInicio} - ${horaFin}`;
    
    return {
      fecha,
      horaInicio,
      horaFin,
      rangoCompleto
    };
  } catch (error) {
    console.error('Error formateando rango de fechas:', error);
    return {
      fecha: "N/A",
      horaInicio: "N/A",
      horaFin: "N/A",
      rangoCompleto: "N/A"
    };
  }
};

// Simular datos de cita como vendrían de MySQL
const citaEjemplo = {
  id: 1,
  fecha_hora_inicio: "2024-01-15 14:30:00", // Formato MySQL datetime
  fecha_hora_fin: "2024-01-15 15:00:00",
  cliente_nombre: "Juan Pérez",
  empleado_nombre: "David García",
  servicios: "Perfilado de cejas"
};

// Pruebas
console.log('🧪 ===== PRUEBAS DE FORMATEO DE FECHAS PARA EMAIL =====');

console.log('\n📧 Prueba 1: Datos de cita simulados');
console.log('Datos de cita:', citaEjemplo);

const fechaFormateada = formatearFechaParaEmail(citaEjemplo.fecha_hora_inicio);
const rangoHoras = formatearRangoFechas(citaEjemplo.fecha_hora_inicio, citaEjemplo.fecha_hora_fin);

console.log('\n📧 Resultados:');
console.log('Fecha formateada:', fechaFormateada);
console.log('Rango horas:', rangoHoras);

// Simular el template de email
const template = `
📅 Detalles de la Cita
Fecha: ${fechaFormateada.fecha}
Hora: ${rangoHoras.rangoCompleto}
Barbero: ${citaEjemplo.empleado_nombre}
Servicios: ${citaEjemplo.servicios}
`;

console.log('\n📧 Template generado:');
console.log(template);

console.log('\n🧪 ===== FIN DE PRUEBAS ====='); 