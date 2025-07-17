const { query } = require('../config/database');

/**
 * Modelo para la gestión de notificaciones push enviadas
 * Maneja operaciones CRUD, búsquedas, filtros y historial de notificaciones push
 */
class NotificacionPushEnviada {
  /**
   * Crear un nuevo registro de notificación push enviada
   * @param {Object} notificacion - Datos de la notificación
   * @returns {Promise<Object>} Notificación creada
   */
  static async crear(notificacion) {
    const {
      notificacion_push_id,
      titulo,
      mensaje,
      datos = null,
      estado = 'enviado',
      mensaje_error = null,
      cita_id = null
    } = notificacion;

    const query = `
      INSERT INTO notificaciones_push_enviadas 
      (notificacion_push_id, titulo, mensaje, datos, estado, mensaje_error, cita_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [
        notificacion_push_id, titulo, mensaje, datos, estado, mensaje_error, cita_id
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear registro de notificación push: ${error.message}`);
    }
  }

  /**
   * Obtener notificación por ID
   * @param {number} id - ID de la notificación
   * @returns {Promise<Object|null>} Notificación encontrada
   */
  static async obtenerPorId(id) {
    const query = `
      SELECT npe.*,
             np.token_dispositivo,
             np.plataforma,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             c.fecha_hora_inicio as cita_fecha,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN citas c ON npe.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE npe.id = ?
    `;

    try {
      const rows = await query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener notificación: ${error.message}`);
    }
  }

  /**
   * Obtener todas las notificaciones con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de notificaciones y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      notificacion_push_id = null,
      estado = null,
      plataforma = null,
      cita_id = null,
      fecha_inicio = null,
      fecha_fin = null,
      orden = 'created_at',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (notificacion_push_id) {
      whereConditions.push('npe.notificacion_push_id = ?');
      params.push(notificacion_push_id);
    }

    if (estado) {
      whereConditions.push('npe.estado = ?');
      params.push(estado);
    }

    if (plataforma) {
      whereConditions.push('np.plataforma = ?');
      params.push(plataforma);
    }

    if (cita_id) {
      whereConditions.push('npe.cita_id = ?');
      params.push(cita_id);
    }

    if (fecha_inicio) {
      whereConditions.push('npe.created_at >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('npe.created_at <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT npe.*,
             np.token_dispositivo,
             np.plataforma,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             c.fecha_hora_inicio as cita_fecha,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN citas c ON npe.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      ${whereClause}
      ORDER BY npe.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      ${whereClause}
    `;

    try {
      const rows = await query(query, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        notificaciones: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener notificaciones: ${error.message}`);
    }
  }

  /**
   * Actualizar notificación
   * @param {number} id - ID de la notificación
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Notificación actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['estado', 'mensaje_error'];
    const camposActualizar = [];
    const valores = [];

    camposPermitidos.forEach(campo => {
      if (datos[campo] !== undefined) {
        camposActualizar.push(`${campo} = ?`);
        valores.push(datos[campo]);
      }
    });

    if (camposActualizar.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    valores.push(id);
    const query = `
      UPDATE notificaciones_push_enviadas 
      SET ${camposActualizar.join(', ')}
      WHERE id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Notificación no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar notificación: ${error.message}`);
    }
  }

  /**
   * Eliminar notificación
   * @param {number} id - ID de la notificación
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const query = 'DELETE FROM notificaciones_push_enviadas WHERE id = ?';

    try {
      const result = await query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar notificación: ${error.message}`);
    }
  }

  /**
   * Buscar notificaciones por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones encontradas
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 50 } = opciones;

    const query = `
      SELECT npe.*,
             np.token_dispositivo,
             np.plataforma,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             c.fecha_hora_inicio as cita_fecha,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN citas c ON npe.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE npe.titulo LIKE ? 
         OR npe.mensaje LIKE ?
         OR CONCAT(u.nombre, ' ', u.apellido) LIKE ?
         OR u.email LIKE ?
         OR CONCAT(cu.nombre, ' ', cu.apellido) LIKE ?
         OR CONCAT(eu.nombre, ' ', eu.apellido) LIKE ?
      ORDER BY npe.created_at DESC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(query, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar notificaciones: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones por usuario
   * @param {number} usuario_id - ID del usuario
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones del usuario
   */
  static async obtenerPorUsuario(usuario_id, opciones = {}) {
    const { orden = 'created_at DESC' } = opciones;

    const query = `
      SELECT npe.*,
             np.token_dispositivo,
             np.plataforma,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             c.fecha_hora_inicio as cita_fecha,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN citas c ON npe.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE np.usuario_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, [usuario_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener notificaciones por usuario: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones por cita
   * @param {number} cita_id - ID de la cita
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones de la cita
   */
  static async obtenerPorCita(cita_id, opciones = {}) {
    const { orden = 'created_at DESC' } = opciones;

    const query = `
      SELECT npe.*,
             np.token_dispositivo,
             np.plataforma,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             c.fecha_hora_inicio as cita_fecha,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN citas c ON npe.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE npe.cita_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, [cita_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener notificaciones por cita: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones por estado
   * @param {string} estado - Estado de la notificación
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones del estado
   */
  static async obtenerPorEstado(estado, opciones = {}) {
    const { orden = 'created_at DESC' } = opciones;

    const query = `
      SELECT npe.*,
             np.token_dispositivo,
             np.plataforma,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             c.fecha_hora_inicio as cita_fecha,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN citas c ON npe.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE npe.estado = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, [estado]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener notificaciones por estado: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones por plataforma
   * @param {string} plataforma - Plataforma (android, ios, web)
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones de la plataforma
   */
  static async obtenerPorPlataforma(plataforma, opciones = {}) {
    const { orden = 'created_at DESC' } = opciones;

    const query = `
      SELECT npe.*,
             np.token_dispositivo,
             np.plataforma,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             c.fecha_hora_inicio as cita_fecha,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN citas c ON npe.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE np.plataforma = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, [plataforma]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener notificaciones por plataforma: ${error.message}`);
    }
  }

  /**
   * Marcar notificación como enviada
   * @param {number} id - ID de la notificación
   * @returns {Promise<Object>} Notificación actualizada
   */
  static async marcarComoEnviada(id) {
    return await this.actualizar(id, {
      estado: 'enviado',
      mensaje_error: null
    });
  }

  /**
   * Marcar notificación como fallida
   * @param {number} id - ID de la notificación
   * @param {string} mensaje_error - Mensaje de error
   * @returns {Promise<Object>} Notificación actualizada
   */
  static async marcarComoFallida(id, mensaje_error) {
    return await this.actualizar(id, {
      estado: 'fallido',
      mensaje_error
    });
  }

  /**
   * Obtener estadísticas de notificaciones
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Estadísticas de notificaciones
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('npe.created_at >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('npe.created_at <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total_notificaciones,
        COUNT(CASE WHEN npe.estado = 'enviado' THEN 1 END) as enviadas_exitosas,
        COUNT(CASE WHEN npe.estado = 'fallido' THEN 1 END) as enviadas_fallidas,
        COUNT(DISTINCT np.usuario_id) as usuarios_notificados,
        COUNT(DISTINCT npe.cita_id) as citas_notificadas,
        COUNT(CASE WHEN np.plataforma = 'android' THEN 1 END) as android,
        COUNT(CASE WHEN np.plataforma = 'ios' THEN 1 END) as ios,
        COUNT(CASE WHEN np.plataforma = 'web' THEN 1 END) as web,
        AVG(LENGTH(npe.mensaje)) as longitud_promedio_mensaje
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      ${whereClause}
    `;

    try {
      const rows = await query(query, params);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por plataforma
   * @returns {Promise<Array>} Estadísticas por plataforma
   */
  static async obtenerEstadisticasPorPlataforma() {
    const query = `
      SELECT np.plataforma,
             COUNT(npe.id) as total_notificaciones,
             COUNT(CASE WHEN npe.estado = 'enviado' THEN 1 END) as enviadas_exitosas,
             COUNT(CASE WHEN npe.estado = 'fallido' THEN 1 END) as enviadas_fallidas,
             COUNT(DISTINCT np.usuario_id) as usuarios_unicos,
             AVG(LENGTH(npe.mensaje)) as longitud_promedio_mensaje
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      GROUP BY np.plataforma
      ORDER BY total_notificaciones DESC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por plataforma: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por usuario
   * @returns {Promise<Array>} Estadísticas por usuario
   */
  static async obtenerEstadisticasPorUsuario() {
    const query = `
      SELECT u.id,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             COUNT(npe.id) as total_notificaciones,
             COUNT(CASE WHEN npe.estado = 'enviado' THEN 1 END) as enviadas_exitosas,
             COUNT(CASE WHEN npe.estado = 'fallido' THEN 1 END) as enviadas_fallidas,
             COUNT(DISTINCT npe.cita_id) as citas_notificadas,
             MAX(npe.created_at) as ultima_notificacion
      FROM usuarios u
      LEFT JOIN notificaciones_push np ON u.id = np.usuario_id
      LEFT JOIN notificaciones_push_enviadas npe ON np.id = npe.notificacion_push_id
      GROUP BY u.id
      HAVING total_notificaciones > 0
      ORDER BY total_notificaciones DESC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por usuario: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por día
   * @param {number} dias - Número de días hacia atrás
   * @returns {Promise<Array>} Estadísticas por día
   */
  static async obtenerEstadisticasPorDia(dias = 30) {
    const query = `
      SELECT 
        DATE(npe.created_at) as fecha,
        COUNT(*) as total_notificaciones,
        COUNT(CASE WHEN npe.estado = 'enviado' THEN 1 END) as enviadas_exitosas,
        COUNT(CASE WHEN npe.estado = 'fallido' THEN 1 END) as enviadas_fallidas,
        COUNT(DISTINCT np.usuario_id) as usuarios_unicos
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      WHERE npe.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(npe.created_at)
      ORDER BY fecha DESC
    `;

    try {
      const rows = await query(query, [dias]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por día: ${error.message}`);
    }
  }

  /**
   * Obtener estados disponibles
   * @returns {Array} Estados disponibles
   */
  static obtenerEstados() {
    return ['enviado', 'fallido', 'pendiente', 'cancelado'];
  }

  /**
   * Obtener plataformas disponibles
   * @returns {Array} Plataformas disponibles
   */
  static obtenerPlataformas() {
    return ['android', 'ios', 'web'];
  }

  /**
   * Limpiar notificaciones antiguas
   * @param {number} dias - Días de antigüedad para limpiar
   * @returns {Promise<number>} Cantidad de notificaciones eliminadas
   */
  static async limpiarAntiguas(dias = 90) {
    const query = `
      DELETE FROM notificaciones_push_enviadas 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    try {
      const result = await query(query, [dias]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al limpiar notificaciones antiguas: ${error.message}`);
    }
  }

  /**
   * Exportar notificaciones a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      fecha_inicio = null, 
      fecha_fin = null,
      estado = null,
      plataforma = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('npe.created_at >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('npe.created_at <= ?');
      params.push(fecha_fin);
    }

    if (estado) {
      whereConditions.push('npe.estado = ?');
      params.push(estado);
    }

    if (plataforma) {
      whereConditions.push('np.plataforma = ?');
      params.push(plataforma);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT npe.id, npe.titulo, npe.mensaje, npe.estado, npe.created_at,
             np.plataforma,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             c.fecha_hora_inicio as cita_fecha,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita
      FROM notificaciones_push_enviadas npe
      JOIN notificaciones_push np ON npe.notificacion_push_id = np.id
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN citas c ON npe.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      ${whereClause}
      ORDER BY npe.created_at DESC
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar notificaciones: ${error.message}`);
    }
  }
}

module.exports = NotificacionPushEnviada; 