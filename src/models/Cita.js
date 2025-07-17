const { query } = require('../config/database');

/**
 * Modelo para la tabla citas
 * Maneja todas las operaciones CRUD y consultas relacionadas con citas
 */
class Cita {
  /**
   * Crear una nueva cita
   * @param {Object} citaData - Datos de la cita
   * @returns {Object} - Cita creada
   */
  static async crear(citaData) {
    try {
      const {
        cliente_id,
        empleado_id,
        fecha,
        hora_inicio,
        hora_fin,
        fecha_hora_inicio,
        fecha_hora_fin,
        estado_id,
        notas,
        recordatorio_enviado = 0,
        recordatorio_correo_enviado = 0,
        recordatorio_push_enviado = 0,
        sincronizado_calendar = 0,
        event_id_calendar,
        meet_link,
        origen
      } = citaData;
  
      // Construir fechas si no vienen ya formadas
      const inicio = fecha_hora_inicio || `${fecha} ${hora_inicio}`;
      const fin = fecha_hora_fin || `${fecha} ${hora_fin}`;
  
      const sql = `
        INSERT INTO citas (
          cliente_id, empleado_id, fecha_hora_inicio, fecha_hora_fin,
          estado_id, notas, recordatorio_enviado, recordatorio_correo_enviado,
          recordatorio_push_enviado, sincronizado_calendar, event_id_calendar,
          meet_link, origen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      const params = [
        cliente_id, empleado_id, inicio, fin,
        estado_id, notas, recordatorio_enviado, recordatorio_correo_enviado,
        recordatorio_push_enviado, sincronizado_calendar, event_id_calendar,
        meet_link, origen
      ];
  
      const result = await query(sql, params);
      return { id: result.insertId, ...citaData, fecha_hora_inicio: inicio, fecha_hora_fin: fin };
    } catch (error) {
      console.error('Error creando cita:', error);
      throw error;
    }
  }
  

  /**
   * Obtener cita por ID
   * @param {number} id - ID de la cita
   * @returns {Object|null} - Cita encontrada o null
   */
  static async obtenerPorId(id) {
    try {
      const sql = `
        SELECT c.*, 
               CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
               u_cliente.email as cliente_email,
               u_cliente.telefono as cliente_telefono,
               CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
               u_empleado.email as empleado_email,
               u_empleado.telefono as empleado_telefono,
               ec.nombre as estado_nombre,
               ec.color as estado_color
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
        INNER JOIN estados_citas ec ON c.estado_id = ec.id
        WHERE c.id = ?
      `;
      
      const citas = await query(sql, [id]);
      return citas.length > 0 ? citas[0] : null;
    } catch (error) {
      console.error('Error obteniendo cita por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener citas por cliente
   * @param {number} cliente_id - ID del cliente
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} - Lista de citas del cliente
   */
  static async obtenerPorCliente(cliente_id, filtros = {}) {
    try {
      let sql = `
        SELECT c.*, 
               CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
               ec.nombre as estado_nombre,
               ec.color as estado_color,
               GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
        FROM citas c
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
        INNER JOIN estados_citas ec ON c.estado_id = ec.id
        LEFT JOIN cita_servicio cs ON c.id = cs.cita_id
        LEFT JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.cliente_id = ?
      `;
      
      const params = [cliente_id];
      const condiciones = [];

      // Aplicar filtros
      if (filtros.estado_id) {
        condiciones.push('c.estado_id = ?');
        params.push(filtros.estado_id);
      }

      if (filtros.fecha_desde) {
        condiciones.push('c.fecha_hora_inicio >= ?');
        params.push(filtros.fecha_desde);
      }

      if (filtros.fecha_hasta) {
        condiciones.push('c.fecha_hora_inicio <= ?');
        params.push(filtros.fecha_hasta);
      }

      if (condiciones.length > 0) {
        sql += ' AND ' + condiciones.join(' AND ');
      }

      sql += ' GROUP BY c.id ORDER BY c.fecha_hora_inicio DESC';

      // Paginación con validación
      if (filtros.limite) {
        const limiteNum = Math.max(1, Math.min(100, parseInt(filtros.limite) || 10));
        sql += ' LIMIT ?';
        params.push(limiteNum);
        
        if (filtros.offset) {
          const offsetNum = Math.max(0, parseInt(filtros.offset) || 0);
          sql += ' OFFSET ?';
          params.push(offsetNum);
        }
      }

      const citas = await query(sql, params);
      return citas;
    } catch (error) {
      console.error('Error obteniendo citas por cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener citas por empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} - Lista de citas del empleado
   */
  static async obtenerPorEmpleado(empleado_id, filtros = {}) {
    try {
      let sql = `
        SELECT c.*, 
               CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
               u_cliente.telefono as cliente_telefono,
               ec.nombre as estado_nombre,
               ec.color as estado_color,
               GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
        INNER JOIN estados_citas ec ON c.estado_id = ec.id
        LEFT JOIN cita_servicio cs ON c.id = cs.cita_id
        LEFT JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.empleado_id = ?
      `;
      
      const params = [empleado_id];
      const condiciones = [];

      // Aplicar filtros
      if (filtros.estado_id) {
        condiciones.push('c.estado_id = ?');
        params.push(filtros.estado_id);
      }

      if (filtros.fecha_desde) {
        condiciones.push('c.fecha_hora_inicio >= ?');
        params.push(filtros.fecha_desde);
      }

      if (filtros.fecha_hasta) {
        condiciones.push('c.fecha_hora_inicio <= ?');
        params.push(filtros.fecha_hasta);
      }

      if (filtros.fecha) {
        condiciones.push('DATE(c.fecha_hora_inicio) = ?');
        params.push(filtros.fecha);
      }

      if (condiciones.length > 0) {
        sql += ' AND ' + condiciones.join(' AND ');
      }

      sql += ' GROUP BY c.id ORDER BY c.fecha_hora_inicio';

      // Paginación con validación
      if (filtros.limite) {
        const limiteNum = Math.max(1, Math.min(100, parseInt(filtros.limite) || 10));
        sql += ' LIMIT ?';
        params.push(limiteNum);
        
        if (filtros.offset) {
          const offsetNum = Math.max(0, parseInt(filtros.offset) || 0);
          sql += ' OFFSET ?';
          params.push(offsetNum);
        }
      }

      const citas = await query(sql, params);
      return citas;
    } catch (error) {
      console.error('Error obteniendo citas por empleado:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las citas con filtros opcionales
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} - Lista de citas
   */
  static async obtenerTodas(filtros = {}) {
    try {
      let sql = `
        SELECT c.*, 
               CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
               u_cliente.telefono as cliente_telefono,
               CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
               ec.nombre as estado_nombre,
               ec.color as estado_color,
               GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
        INNER JOIN estados_citas ec ON c.estado_id = ec.id
        LEFT JOIN cita_servicio cs ON c.id = cs.cita_id
        LEFT JOIN servicios s ON cs.servicio_id = s.id
      `;
      
      const params = [];
      const condiciones = [];

      // Aplicar filtros
      if (filtros.estado_id) {
        condiciones.push('c.estado_id = ?');
        params.push(filtros.estado_id);
      }

      if (filtros.cliente_id) {
        condiciones.push('c.cliente_id = ?');
        params.push(filtros.cliente_id);
      }

      if (filtros.empleado_id) {
        condiciones.push('c.empleado_id = ?');
        params.push(filtros.empleado_id);
      }

      if (filtros.fecha_desde) {
        condiciones.push('c.fecha_hora_inicio >= ?');
        params.push(filtros.fecha_desde);
      }

      if (filtros.fecha_hasta) {
        condiciones.push('c.fecha_hora_inicio <= ?');
        params.push(filtros.fecha_hasta);
      }

      if (filtros.fecha) {
        condiciones.push('DATE(c.fecha_hora_inicio) = ?');
        params.push(filtros.fecha);
      }

      if (filtros.busqueda) {
        condiciones.push('(u_cliente.nombre LIKE ? OR u_cliente.apellido LIKE ? OR u_empleado.nombre LIKE ? OR u_empleado.apellido LIKE ?)');
        const busqueda = `%${filtros.busqueda}%`;
        params.push(busqueda, busqueda, busqueda, busqueda);
      }

      if (condiciones.length > 0) {
        sql += ' WHERE ' + condiciones.join(' AND ');
      }

      sql += ' GROUP BY c.id ORDER BY c.fecha_hora_inicio DESC';

      // Paginación con validación
      if (filtros.limite) {
        const limiteNum = Math.max(1, Math.min(100, parseInt(filtros.limite) || 10));
        sql += ' LIMIT ?';
        params.push(limiteNum);
        
        if (filtros.offset) {
          const offsetNum = Math.max(0, parseInt(filtros.offset) || 0);
          sql += ' OFFSET ?';
          params.push(offsetNum);
        }
      }

      const citas = await query(sql, params);
      return citas;
    } catch (error) {
      console.error('Error obteniendo citas:', error);
      throw error;
    }
  }

  /**
   * Actualizar cita
   * @param {number} id - ID de la cita
   * @param {Object} citaData - Datos a actualizar
   * @returns {boolean} - True si se actualizó correctamente
   */
  static async actualizar(id, citaData) {
    try {
      const camposPermitidos = [
        'cliente_id', 'empleado_id', 'fecha_hora_inicio', 'fecha_hora_fin',
        'estado_id', 'notas', 'recordatorio_enviado', 'recordatorio_correo_enviado',
        'recordatorio_push_enviado', 'sincronizado_calendar', 'event_id_calendar',
        'meet_link', 'origen', 'cancelado_por', 'motivo_cancelacion'
      ];
  
      const camposActualizar = [];
      const valores = [];
  
      // Filtrar solo campos permitidos
      for (const campo of camposPermitidos) {
        if (citaData[campo] !== undefined) {
          camposActualizar.push(`${campo} = ?`);
          valores.push(citaData[campo]);
        }
      }
  
      if (camposActualizar.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }
  
      valores.push(id);
      const sql = `UPDATE citas SET ${camposActualizar.join(', ')} WHERE id = ?`;
  
      const result = await query(sql, valores);
  
      if (result.affectedRows === 0) {
        throw new Error('Cita no encontrada o no actualizada');
      }
  
      // Retornar la cita actualizada
      return await this.obtenerPorId(id);
  
    } catch (error) {
      console.error('Error actualizando cita:', error);
      throw error;
    }
  }
  

  /**
   * Cancelar cita
   * @param {number} id - ID de la cita
   * @param {number} cancelado_por - ID del usuario que cancela
   * @param {string} motivo_cancelacion - Motivo de la cancelación
   * @returns {boolean} - True si se canceló correctamente
   */
  static async cancelar(id, cancelado_por, motivo_cancelacion) {
    try {
      // Obtener el ID del estado "Cancelada"
      const estadoCancelada = await query('SELECT id FROM estados_citas WHERE nombre = ?', ['Cancelada']);
      if (estadoCancelada.length === 0) {
        throw new Error('Estado "Cancelada" no encontrado');
      }

      const sql = `
        UPDATE citas 
        SET estado_id = ?, cancelado_por = ?, motivo_cancelacion = ? 
        WHERE id = ?
      `;
      
      const result = await query(sql, [estadoCancelada[0].id, cancelado_por, motivo_cancelacion, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error cancelando cita:', error);
      throw error;
    }
  }

  /**
   * Eliminar cita
   * @param {number} id - ID de la cita
   * @returns {boolean} - True si se eliminó correctamente
   */
  static async eliminar(id) {
    try {
      const sql = 'DELETE FROM citas WHERE id = ?';
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error eliminando cita:', error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad
   * @param {number} empleado_id - ID del empleado
   * @param {Date} fecha_hora_inicio - Fecha y hora de inicio
   * @param {Date} fecha_hora_fin - Fecha y hora de fin
   * @param {number} exclude_id - ID de cita a excluir (para actualizaciones)
   * @returns {boolean} - True si está disponible
   */
  static async verificarDisponibilidad(empleado_id, fecha_hora_inicio, fecha_hora_fin, exclude_id = null) {
    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM citas
        WHERE empleado_id = ?
        AND fecha_hora_inicio < ?
        AND fecha_hora_fin > ?
        AND estado_id NOT IN (SELECT id FROM estados_citas WHERE nombre IN ('Cancelada', 'No asistió'))
      `;

      const params = [empleado_id, fecha_hora_fin, fecha_hora_inicio];

      if (exclude_id) {
        sql += ' AND id != ?';
        params.push(exclude_id);
      }

      const result = await query(sql, params);
      return result[0].count === 0;
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      throw error;
    }
  }

  /**
   * Obtener citas de hoy
   * @returns {Array} - Lista de citas de hoy
   */
  static async obtenerDeHoy() {
    try {
      const sql = `
        SELECT c.*, 
               CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
               u_cliente.telefono as cliente_telefono,
               CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
               ec.nombre as estado_nombre,
               ec.color as estado_color,
               GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
        INNER JOIN estados_citas ec ON c.estado_id = ec.id
        LEFT JOIN cita_servicio cs ON c.id = cs.cita_id
        LEFT JOIN servicios s ON cs.servicio_id = s.id
        WHERE DATE(c.fecha_hora_inicio) = CURDATE()
        GROUP BY c.id
        ORDER BY c.fecha_hora_inicio
      `;

      const citas = await query(sql);
      return citas;
    } catch (error) {
      console.error('Error obteniendo citas de hoy:', error);
      throw error;
    }
  }

  /**
   * Obtener citas próximas
   * @param {number} dias - Número de días hacia adelante
   * @returns {Array} - Lista de citas próximas
   */
  static async obtenerProximas(dias = 7) {
    try {
      const sql = `
        SELECT c.*, 
               CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
               u_cliente.telefono as cliente_telefono,
               CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
               ec.nombre as estado_nombre,
               ec.color as estado_color,
               GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
        INNER JOIN estados_citas ec ON c.estado_id = ec.id
        LEFT JOIN cita_servicio cs ON c.id = cs.cita_id
        LEFT JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.fecha_hora_inicio BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
        AND c.estado_id NOT IN (SELECT id FROM estados_citas WHERE nombre IN ('Cancelada', 'No asistió'))
        GROUP BY c.id
        ORDER BY c.fecha_hora_inicio
      `;

      const citas = await query(sql, [dias]);
      return citas;
    } catch (error) {
      console.error('Error obteniendo citas próximas:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de citas
   * @param {string} periodo - Periodo de tiempo (dia, semana, mes, año)
   * @returns {Object} - Estadísticas
   */
  static async obtenerEstadisticas(periodo = 'mes') {
    try {
      let fechaFiltro = '';
      switch (periodo) {
        case 'dia':
          fechaFiltro = 'AND DATE(c.fecha_hora_inicio) = CURDATE()';
          break;
        case 'semana':
          fechaFiltro = 'AND c.fecha_hora_inicio >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          break;
        case 'año':
          fechaFiltro = 'AND c.fecha_hora_inicio >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
          break;
        default: // mes
          fechaFiltro = 'AND c.fecha_hora_inicio >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
      }

      const sql = `
        SELECT 
          COUNT(*) as total_citas,
          COUNT(CASE WHEN ec.nombre = 'Confirmada' THEN 1 END) as citas_confirmadas,
          COUNT(CASE WHEN ec.nombre = 'Completada' THEN 1 END) as citas_completadas,
          COUNT(CASE WHEN ec.nombre = 'Cancelada' THEN 1 END) as citas_canceladas,
          COUNT(CASE WHEN ec.nombre = 'No asistió' THEN 1 END) as citas_no_asistio,
          COUNT(CASE WHEN c.fecha_hora_inicio > NOW() THEN 1 END) as citas_futuras,
          AVG(TIMESTAMPDIFF(MINUTE, c.fecha_hora_inicio, c.fecha_hora_fin)) as duracion_promedio_minutos
        FROM citas c
        INNER JOIN estados_citas ec ON c.estado_id = ec.id
        WHERE 1=1 ${fechaFiltro}
      `;

      const result = await query(sql);
      return result[0];
    } catch (error) {
      console.error('Error obteniendo estadísticas de citas:', error);
      throw error;
    }
  }

  /**
   * Agregar servicio a cita
   * @param {number} cita_id - ID de la cita
   * @param {number} servicio_id - ID del servicio
   * @param {Object} datos - Datos adicionales (precio_aplicado, descuento, notas)
   * @returns {boolean} - True si se agregó correctamente
   */
  static async agregarServicio(cita_id, servicio_id, datos = {}) {
    try {
      const { precio_aplicado, descuento = 0.00, notas } = datos;

      // Obtener precio del servicio si no se proporciona
      let precio = precio_aplicado;
      if (!precio) {
        const servicio = await query('SELECT precio FROM servicios WHERE id = ?', [servicio_id]);
        if (servicio.length === 0) {
          throw new Error('Servicio no encontrado');
        }
        precio = servicio[0].precio;
      }

      const sql = `
        INSERT INTO cita_servicio (cita_id, servicio_id, precio_aplicado, descuento, notas)
        VALUES (?, ?, ?, ?, ?)
      `;

      const result = await query(sql, [cita_id, servicio_id, precio, descuento, notas]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error agregando servicio a cita:', error);
      throw error;
    }
  }

  /**
   * ObtenerTodas servicios de una cita
   * @param {number} cita_id - ID de la cita
   * @returns {Array} - Lista de servicios de la cita
   */
  static async obtenerServicios(cita_id) {
    try {
      const sql = `
        SELECT cs.*, s.nombre as servicio_nombre, s.descripcion as servicio_descripcion,
               cs.precio_aplicado, cs.descuento, cs.notas
        FROM cita_servicio cs
        INNER JOIN servicios s ON cs.servicio_id = s.id
        WHERE cs.cita_id = ?
        ORDER BY s.nombre
      `;

      const servicios = await query(sql, [cita_id]);
      return servicios;
    } catch (error) {
      console.error('Error obteniendo servicios de la cita:', error);
      throw error;
    }
  }

  /**
   * Calcular total de una cita
   * @param {number} cita_id - ID de la cita
   * @returns {Object} - Total de la cita
   */
  static async calcularTotal(cita_id) {
    try {
      const sql = `
        SELECT 
          SUM(cs.precio_aplicado - cs.descuento) as subtotal,
          SUM(cs.descuento) as total_descuentos,
          COUNT(cs.servicio_id) as total_servicios
        FROM cita_servicio cs
        WHERE cs.cita_id = ?
      `;

      const result = await query(sql, [cita_id]);
      return result[0];
    } catch (error) {
      console.error('Error calculando total de la cita:', error);
      throw error;
    }
  }



 /**
   * Obtener todos los estados de citas
   * @returns {Array} - Lista de estados
   */
 static async obtenerEstadosCitas() {
  try {
    const sql = 'SELECT id, nombre, descripcion, color FROM estados_citas ORDER BY id';
    const estados = await query(sql);
    return estados;
  } catch (error) {
    console.error('Error obteniendo estados de citas:', error);
    throw error;
  }
}



/**
 * Cambiar el estado de una cita
 * @param {number} id - ID de la cita
 * @param {number} estado_id - Nuevo ID del estado
 * @returns {Object} - Cita actualizada
 */
static async cambiarEstado(id, estado_id) {
  try {
    const sql = `UPDATE citas SET estado_id = ? WHERE id = ?`;
    const result = await query(sql, [estado_id, id]);

    if (result.affectedRows === 0) {
      throw new Error('Cita no encontrada o no actualizada');
    }

    return await this.obtenerPorId(id);
  } catch (error) {
    console.error('Error cambiando estado de la cita:', error);
    throw error;
  }
}




}

module.exports = Cita; 