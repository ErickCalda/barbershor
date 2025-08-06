/**
 * Utilidades para el manejo de fechas y horas
 */

/**
 * Formatea una fecha y hora para mostrar en notificaciones
 * @param {string|Date} fechaString - Fecha en formato string o Date
 * @param {string} formato - Formato deseado ('corta', 'larga', 'solo_hora')
 * @returns {string} Fecha formateada
 */
const formatearFechaHora = (fechaString, formato = 'corta') => {
  if (!fechaString) return "N/A";

  try {
    // Convertir a objeto Date si es string
    let fecha = typeof fechaString === 'string' ? new Date(fechaString) : fechaString;
    
    if (isNaN(fecha.getTime())) return "N/A";

    // Ajustar zona horaria (UTC-5 para Ecuador)
    const zonaHoraria = 'America/Guayaquil';
    
    switch (formato) {
      case 'corta':
        return fecha.toLocaleString('es-EC', {
          timeZone: zonaHoraria,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      
      case 'larga':
        return fecha.toLocaleDateString('es-EC', {
          timeZone: zonaHoraria,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'solo_hora':
        return fecha.toLocaleTimeString('es-EC', {
          timeZone: zonaHoraria,
          hour: '2-digit',
          minute: '2-digit'
        });
      
      case 'fecha_hora_completa':
        return fecha.toLocaleString('es-EC', {
          timeZone: zonaHoraria,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      
      default:
        return fecha.toLocaleString('es-EC', {
          timeZone: zonaHoraria,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
    }
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return "N/A";
  }
};

/**
 * Formatea un rango de fechas para mostrar inicio y fin
 * @param {string|Date} fechaInicio - Fecha de inicio
 * @param {string|Date} fechaFin - Fecha de fin
 * @returns {Object} Objeto con fecha y hora formateadas
 */
const formatearRangoFechas = (fechaInicio, fechaFin) => {
  return {
    fecha: formatearFechaHora(fechaInicio, 'larga'),
    horaInicio: formatearFechaHora(fechaInicio, 'solo_hora'),
    horaFin: formatearFechaHora(fechaFin, 'solo_hora'),
    rangoCompleto: `${formatearFechaHora(fechaInicio, 'solo_hora')} - ${formatearFechaHora(fechaFin, 'solo_hora')}`
  };
};

/**
 * Obtiene la fecha actual en la zona horaria local
 * @returns {Date} Fecha actual
 */
const obtenerFechaActual = () => {
  return new Date();
};

/**
 * Convierte una fecha UTC a la zona horaria local
 * @param {string|Date} fechaUTC - Fecha en UTC
 * @returns {Date} Fecha en zona horaria local
 */
const convertirUTCALocal = (fechaUTC) => {
  if (!fechaUTC) return null;
  
  const fecha = new Date(fechaUTC);
  if (isNaN(fecha.getTime())) return null;
  
  // La conversión se hace automáticamente al usar toLocaleString con timeZone
  return fecha;
};

/**
 * Formatea una fecha para usar en templates de email
 * @param {string|Date} fechaString - Fecha a formatear
 * @returns {Object} Objeto con diferentes formatos de fecha
 */
const formatearFechaParaEmail = (fechaString) => {
  if (!fechaString) return {
    fecha: "N/A",
    hora: "N/A",
    fechaHora: "N/A"
  };

  try {
    const fecha = typeof fechaString === 'string' ? new Date(fechaString) : fechaString;
    
    if (isNaN(fecha.getTime())) {
      return {
        fecha: "N/A",
        hora: "N/A",
        fechaHora: "N/A"
      };
    }

    return {
      fecha: formatearFechaHora(fecha, 'larga'),
      hora: formatearFechaHora(fecha, 'solo_hora'),
      fechaHora: formatearFechaHora(fecha, 'fecha_hora_completa')
    };
  } catch (error) {
    console.error('Error formateando fecha para email:', error);
    return {
      fecha: "N/A",
      hora: "N/A",
      fechaHora: "N/A"
    };
  }
};

module.exports = {
  formatearFechaHora,
  formatearRangoFechas,
  obtenerFechaActual,
  convertirUTCALocal,
  formatearFechaParaEmail
}; 