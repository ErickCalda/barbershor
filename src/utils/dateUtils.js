/**
 * Utilidades para formateo de fechas y horas
 * Maneja conversiones de UTC a zona horaria de Ecuador (UTC-5)
 */

/**
 * Formatear fecha y hora para diferentes contextos
 * @param {string} fechaString - Fecha en formato ISO o string
 * @param {string} formato - Tipo de formato ('corta', 'larga', 'solo_hora', 'fecha_hora_completa')
 * @returns {string} Fecha formateada
 */
const formatearFechaHora = (fechaString, formato = 'corta') => {
  if (!fechaString) return "N/A";
  
  try {
    // Cambiar espacio a T para ISO si es necesario
    const fechaIso = fechaString.includes(" ") ? fechaString.replace(" ", "T") : fechaString;
    let fecha = new Date(fechaIso);
    
    if (isNaN(fecha.getTime())) return "N/A";
    
    // Convertir de UTC a hora local de Ecuador (UTC-5)
    fecha = new Date(fecha.getTime() - 5 * 60 * 60 * 1000);
    
    switch (formato) {
      case 'corta':
        return fecha.toLocaleDateString("es-EC", {
          day: "2-digit",
          month: "2-digit", 
          year: "numeric"
        }) + ', ' + fecha.toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit"
        });
        
      case 'larga':
        return fecha.toLocaleDateString("es-EC", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        });
        
      case 'solo_hora':
        return fecha.toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit"
        });
        
      case 'fecha_hora_completa':
        return fecha.toLocaleDateString("es-EC", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric"
        }) + ', ' + fecha.toLocaleTimeString("es-EC", {
          hour: "2-digit",
          minute: "2-digit"
        });
        
      default:
        return fecha.toLocaleString("es-EC", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
    }
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return "N/A";
  }
};

/**
 * Formatear rango de fechas para mostrar inicio y fin
 * @param {string} fechaInicio - Fecha de inicio
 * @param {string} fechaFin - Fecha de fin
 * @returns {Object} Objeto con fecha, horaInicio, horaFin y rangoCompleto
 */
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

/**
 * Formatear fecha para emails
 * @param {string} fechaString - Fecha en formato ISO
 * @returns {Object} Objeto con fecha, hora y fechaHora para emails
 */
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

/**
 * Obtener fecha actual en formato ISO
 * @returns {string} Fecha actual en formato ISO
 */
const obtenerFechaActual = () => {
  return new Date().toISOString();
};

/**
 * Convertir UTC a hora local de Ecuador
 * @param {string} fechaUTC - Fecha en UTC
 * @returns {Date} Fecha en hora local de Ecuador
 */
const convertirUTCALocal = (fechaUTC) => {
  try {
    const fecha = new Date(fechaUTC);
    return new Date(fecha.getTime() - 5 * 60 * 60 * 1000);
  } catch (error) {
    console.error('Error convirtiendo UTC a local:', error);
    return new Date();
  }
};

module.exports = {
  formatearFechaHora,
  formatearRangoFechas,
  formatearFechaParaEmail,
  obtenerFechaActual,
  convertirUTCALocal
}; 
