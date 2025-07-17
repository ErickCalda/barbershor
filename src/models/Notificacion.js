const { query } = require('../config/database');

/**
 * Modelo para la gestión de notificaciones
 * Maneja operaciones CRUD y consultas relacionadas con notificaciones
 */
class Notificacion {
  /**
   * Crear una nueva notificación
   * @param {Object} notificacionData - Datos de la notificación
   * @returns {Promise<Object>} Notificación creada
   */
  static async crear(notificacionData) {
    const {
      usuario_id,
      titulo,
      mensaje,
      tipo,
      leida = false,
      datos_adicionales = null,
      fecha_vencimiento = null
    } = notificacionData;

    const sql = `
      INSERT INTO notificaciones (
        usuario_id, titulo, mensaje, tipo, leida, datos_adicionales, fecha_vencimiento
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        usuario_id, titulo, mensaje, tipo, leida,
        datos_adicionales ? JSON.stringify(datos_adicionales) : null,
        fecha_vencimiento
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear notificación: ${error.message}`);
    }
  }

  /**
   * Obtener notificación por ID
   * @param {number} id - ID de la notificación
   * @returns {Promise<Object|null>} Notificación encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT n.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM notificaciones n
      INNER JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      if (rows[0]) {
        rows[0].datos_adicionales = JSON.parse(rows[0].datos_adicionales || '{}');
      }
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener notificación: ${error.message}`);
    }
  }

  /**
   * Obtener todas las notificaciones
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Object>} Lista de notificaciones y total
   */
  static async obtenerTodas(filtros = {}) {
    const {
      limite = 10,
      offset = 0,
      usuario_id = null,
      tipo = null,
      leida = null,
      fecha_inicio = null,
      fecha_fin = null
    } = filtros;

    let whereConditions = [];
    let params = [];

    if (usuario_id) {
      whereConditions.push('n.usuario_id = ?');
      params.push(usuario_id);
    }

    if (tipo) {
      whereConditions.push('n.tipo = ?');
      params.push(tipo);
    }

    if (leida !== null) {
      whereConditions.push('n.leida = ?');
      params.push(leida);
    }

    if (fecha_inicio) {
      whereConditions.push('n.fecha_creacion >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('n.fecha_creacion <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT n.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM notificaciones n
      INNER JOIN usuarios u ON n.usuario_id = u.id
      ${whereClause}
      ORDER BY n.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM notificaciones n
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);
      
      // Parsear datos adicionales para cada notificación
      rows.forEach(notificacion => {
        notificacion.datos_adicionales = JSON.parse(notificacion.datos_adicionales || '{}');
      });

      return {
        notificaciones: rows,
        total: countResult[0].total,
        pagina: Math.floor(offset / limite) + 1,
        totalPaginas: Math.ceil(countResult[0].total / limite)
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
    const camposPermitidos = [
      'titulo', 'mensaje', 'tipo', 'leida', 'datos_adicionales', 'fecha_vencimiento'
    ];

    const camposActualizar = [];
    const valores = [];

    camposPermitidos.forEach(campo => {
      if (datos[campo] !== undefined) {
        if (campo === 'datos_adicionales') {
          camposActualizar.push(`${campo} = ?`);
          valores.push(JSON.stringify(datos[campo]));
        } else {
          camposActualizar.push(`${campo} = ?`);
          valores.push(datos[campo]);
        }
      }
    });

    if (camposActualizar.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    valores.push(id);
    const sql = `
      UPDATE notificaciones 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
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
    const sql = 'DELETE FROM notificaciones WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar notificación: ${error.message}`);
    }
  }

  /**
   * Marcar notificación como leída
   * @param {number} id - ID de la notificación
   * @returns {Promise<Object>} Notificación actualizada
   */
  static async marcarComoLeida(id) {
    const sql = `
      UPDATE notificaciones 
      SET leida = true, fecha_lectura = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Notificación no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al marcar como leída: ${error.message}`);
    }
  }

  /**
   * Marcar múltiples notificaciones como leídas
   * @param {Array} ids - IDs de las notificaciones
   * @returns {Promise<number>} Número de notificaciones actualizadas
   */
  static async marcarMultiplesComoLeidas(ids) {
    if (!ids || ids.length === 0) {
      return 0;
    }

    const placeholders = ids.map(() => '?').join(',');
    const sql = `
      UPDATE notificaciones 
      SET leida = true, fecha_lectura = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    try {
      const result = await query(sql, ids);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al marcar múltiples como leídas: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones por usuario
   * @param {number} usuario_id - ID del usuario
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones del usuario
   */
  static async obtenerPorUsuario(usuario_id, opciones = {}) {
    const { leida = null, tipo = null, limite = 50 } = opciones;

    let whereConditions = ['n.usuario_id = ?'];
    let params = [usuario_id];

    if (leida !== null) {
      whereConditions.push('n.leida = ?');
      params.push(leida);
    }

    if (tipo) {
      whereConditions.push('n.tipo = ?');
      params.push(tipo);
    }

    const sql = `
      SELECT n.*
      FROM notificaciones n
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY n.fecha_creacion DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      
      // Parsear datos adicionales para cada notificación
      rows.forEach(notificacion => {
        notificacion.datos_adicionales = JSON.parse(notificacion.datos_adicionales || '{}');
      });

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener notificaciones por usuario: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones no leídas
   * @param {number} usuario_id - ID del usuario
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Notificaciones no leídas
   */
  static async obtenerNoLeidas(usuario_id, limite = 20) {
    const sql = `
      SELECT n.*
      FROM notificaciones n
      WHERE n.usuario_id = ? AND n.leida = false
      ORDER BY n.fecha_creacion DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [usuario_id, limite]);
      
      // Parsear datos adicionales para cada notificación
      rows.forEach(notificacion => {
        notificacion.datos_adicionales = JSON.parse(notificacion.datos_adicionales || '{}');
      });

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener notificaciones no leídas: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones por tipo
   * @param {string} tipo - Tipo de notificación
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones del tipo
   */
  static async obtenerPorTipo(tipo, opciones = {}) {
    const { usuario_id = null, leida = null, limite = 100 } = opciones;

    let whereConditions = ['n.tipo = ?'];
    let params = [tipo];

    if (usuario_id) {
      whereConditions.push('n.usuario_id = ?');
      params.push(usuario_id);
    }

    if (leida !== null) {
      whereConditions.push('n.leida = ?');
      params.push(leida);
    }

    const sql = `
      SELECT n.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
      FROM notificaciones n
      INNER JOIN usuarios u ON n.usuario_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY n.fecha_creacion DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      
      // Parsear datos adicionales para cada notificación
      rows.forEach(notificacion => {
        notificacion.datos_adicionales = JSON.parse(notificacion.datos_adicionales || '{}');
      });

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener notificaciones por tipo: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Object>} Estadísticas de notificaciones
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { usuario_id = null, fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (usuario_id) {
      whereConditions.push('n.usuario_id = ?');
      params.push(usuario_id);
    }

    if (fecha_inicio) {
      whereConditions.push('n.fecha_creacion >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('n.fecha_creacion <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total_notificaciones,
        COUNT(CASE WHEN leida = true THEN 1 END) as notificaciones_leidas,
        COUNT(CASE WHEN leida = false THEN 1 END) as notificaciones_no_leidas,
        COUNT(DISTINCT tipo) as tipos_diferentes,
        COUNT(DISTINCT usuario_id) as usuarios_con_notificaciones
      FROM notificaciones n
      ${whereClause}
    `;

    try {
      const rows = await query(sql, params);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Buscar notificaciones
   * @param {string} termino - Término de búsqueda
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones encontradas
   */
  static async buscar(termino, opciones = {}) {
    const { usuario_id = null, limite = 50 } = opciones;

    let whereConditions = ['(n.titulo LIKE ? OR n.mensaje LIKE ?)'];
    let params = [`%${termino}%`, `%${termino}%`];

    if (usuario_id) {
      whereConditions.push('n.usuario_id = ?');
      params.push(usuario_id);
    }

    const sql = `
      SELECT n.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
      FROM notificaciones n
      INNER JOIN usuarios u ON n.usuario_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY n.fecha_creacion DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      
      // Parsear datos adicionales para cada notificación
      rows.forEach(notificacion => {
        notificacion.datos_adicionales = JSON.parse(notificacion.datos_adicionales || '{}');
      });

      return rows;
    } catch (error) {
      throw new Error(`Error al buscar notificaciones: ${error.message}`);
    }
  }

  /**
   * Limpiar notificaciones vencidas
   * @param {number} dias_vencimiento - Días de vencimiento
   * @returns {Promise<number>} Número de notificaciones eliminadas
   */
  static async limpiarVencidas(dias_vencimiento = 30) {
    const sql = `
      DELETE FROM notificaciones 
      WHERE fecha_vencimiento IS NOT NULL 
        AND fecha_vencimiento < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    try {
      const result = await query(sql, [dias_vencimiento]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al limpiar notificaciones vencidas: ${error.message}`);
    }
  }

  /**
   * Obtener tipos de notificación disponibles
   * @returns {Promise<Array>} Tipos de notificación
   */
  static async obtenerTipos() {
    const sql = `
      SELECT DISTINCT tipo, COUNT(*) as total
      FROM notificaciones
      GROUP BY tipo
      ORDER BY total DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener tipos: ${error.message}`);
    }
  }
}

module.exports = Notificacion; 