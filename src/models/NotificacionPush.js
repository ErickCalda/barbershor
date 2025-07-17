const { query } = require('../config/database');

/**
 * Modelo para la gestión de notificaciones push
 * Maneja operaciones CRUD, búsquedas, filtros y gestión de tokens de dispositivos
 */
class NotificacionPush {
  /**
   * Crear un nuevo registro de notificación push
   * @param {Object} notificacion - Datos de la notificación
   * @returns {Promise<Object>} Notificación creada
   */
  static async crear(notificacion) {
    const {
      usuario_id,
      token_dispositivo,
      plataforma = 'web',
      activo = 1
    } = notificacion;

    const sql = `
      INSERT INTO notificaciones_push (usuario_id, token_dispositivo, plataforma, activo)
      VALUES (?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        usuario_id, token_dispositivo, plataforma, activo
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear notificación push: ${error.message}`);
    }
  }

  /**
   * Obtener notificación por ID
   * @param {number} id - ID de la notificación
   * @returns {Promise<Object|null>} Notificación encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT np.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             COUNT(npe.id) as total_notificaciones_enviadas
      FROM notificaciones_push np
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN notificaciones_push_enviadas npe ON np.id = npe.notificacion_push_id
      WHERE np.id = ?
      GROUP BY np.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener notificación push: ${error.message}`);
    }
  }

  /**
   * Obtener notificación por token
   * @param {string} token_dispositivo - Token del dispositivo
   * @returns {Promise<Object|null>} Notificación encontrada
   */
  static async obtenerPorToken(token_dispositivo) {
    const sql = `
      SELECT np.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM notificaciones_push np
      JOIN usuarios u ON np.usuario_id = u.id
      WHERE np.token_dispositivo = ?
    `;

    try {
      const rows = await query(sql, [token_dispositivo]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener notificación por token: ${error.message}`);
    }
  }

  /**
   * Obtener todas las notificaciones push con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de notificaciones y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      usuario_id = null,
      plataforma = null,
      activo = null,
      orden = 'created_at',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (usuario_id) {
      whereConditions.push('np.usuario_id = ?');
      params.push(usuario_id);
    }

    if (plataforma) {
      whereConditions.push('np.plataforma = ?');
      params.push(plataforma);
    }

    if (activo !== null) {
      whereConditions.push('np.activo = ?');
      params.push(activo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT np.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             COUNT(npe.id) as total_notificaciones_enviadas
      FROM notificaciones_push np
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN notificaciones_push_enviadas npe ON np.id = npe.notificacion_push_id
      ${whereClause}
      GROUP BY np.id
      ORDER BY np.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM notificaciones_push np
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
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
      throw new Error(`Error al obtener notificaciones push: ${error.message}`);
    }
  }

  /**
   * Actualizar notificación push
   * @param {number} id - ID de la notificación
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Notificación actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['token_dispositivo', 'plataforma', 'activo'];
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
    const sql = `
      UPDATE notificaciones_push 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Notificación push no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar notificación push: ${error.message}`);
    }
  }

  /**
   * Eliminar notificación push
   * @param {number} id - ID de la notificación
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM notificaciones_push WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar notificación push: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones por usuario
   * @param {number} usuario_id - ID del usuario
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones del usuario
   */
  static async obtenerPorUsuario(usuario_id, opciones = {}) {
    const { activo = null, plataforma = null, limite = 50 } = opciones;

    let whereConditions = ['np.usuario_id = ?'];
    let params = [usuario_id];

    if (activo !== null) {
      whereConditions.push('np.activo = ?');
      params.push(activo);
    }

    if (plataforma) {
      whereConditions.push('np.plataforma = ?');
      params.push(plataforma);
    }

    const sql = `
      SELECT np.*,
             COUNT(npe.id) as total_notificaciones_enviadas
      FROM notificaciones_push np
      LEFT JOIN notificaciones_push_enviadas npe ON np.id = npe.notificacion_push_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY np.id
      ORDER BY np.created_at DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener notificaciones por usuario: ${error.message}`);
    }
  }

  /**
   * Obtener notificaciones por plataforma
   * @param {string} plataforma - Plataforma (web, android, ios)
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Notificaciones de la plataforma
   */
  static async obtenerPorPlataforma(plataforma, opciones = {}) {
    const { activo = null, limite = 100 } = opciones;

    let whereConditions = ['np.plataforma = ?'];
    let params = [plataforma];

    if (activo !== null) {
      whereConditions.push('np.activo = ?');
      params.push(activo);
    }

    const sql = `
      SELECT np.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             COUNT(npe.id) as total_notificaciones_enviadas
      FROM notificaciones_push np
      JOIN usuarios u ON np.usuario_id = u.id
      LEFT JOIN notificaciones_push_enviadas npe ON np.id = npe.notificacion_push_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY np.id
      ORDER BY np.created_at DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener notificaciones por plataforma: ${error.message}`);
    }
  }

  /**
   * Obtener tokens activos
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Array>} Tokens activos
   */
  static async obtenerTokensActivos(opciones = {}) {
    const { plataforma = null, usuario_id = null } = opciones;

    let whereConditions = ['np.activo = 1'];
    let params = [];

    if (plataforma) {
      whereConditions.push('np.plataforma = ?');
      params.push(plataforma);
    }

    if (usuario_id) {
      whereConditions.push('np.usuario_id = ?');
      params.push(usuario_id);
    }

    const sql = `
      SELECT np.token_dispositivo,
             np.plataforma,
             np.usuario_id,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre
      FROM notificaciones_push np
      JOIN usuarios u ON np.usuario_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY np.created_at DESC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener tokens activos: ${error.message}`);
    }
  }

  /**
   * Cambiar estado de notificación
   * @param {number} id - ID de la notificación
   * @param {boolean} activo - Estado activo
   * @returns {Promise<Object>} Notificación actualizada
   */
  static async cambiarEstado(id, activo) {
    const sql = `
      UPDATE notificaciones_push 
      SET activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [activo ? 1 : 0, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Notificación push no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al cambiar estado: ${error.message}`);
    }
  }

  /**
   * Crear o actualizar token de dispositivo
   * @param {number} usuario_id - ID del usuario
   * @param {string} token_dispositivo - Token del dispositivo
   * @param {Object} datos - Datos adicionales
   * @returns {Promise<Object>} Token creado o actualizado
   */
  static async crearOActualizarToken(usuario_id, token_dispositivo, datos = {}) {
    const { plataforma = 'web', activo = 1 } = datos;

    // Verificar si ya existe el token
    const existente = await this.obtenerPorToken(token_dispositivo);
    
    if (existente) {
      // Actualizar si es diferente usuario
      if (existente.usuario_id !== usuario_id) {
        return await this.actualizar(existente.id, { usuario_id, activo });
      }
      return existente;
    }

    // Crear nuevo token
    return await this.crear({
      usuario_id,
      token_dispositivo,
      plataforma,
      activo
    });
  }

  /**
   * Eliminar todos los tokens de un usuario
   * @param {number} usuario_id - ID del usuario
   * @returns {Promise<number>} Número de tokens eliminados
   */
  static async eliminarTokensUsuario(usuario_id) {
    const sql = 'DELETE FROM notificaciones_push WHERE usuario_id = ?';

    try {
      const result = await query(sql, [usuario_id]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al eliminar tokens de usuario: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de notificaciones push
   * @returns {Promise<Object>} Estadísticas
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_tokens,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as tokens_activos,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as tokens_inactivos,
        COUNT(DISTINCT usuario_id) as usuarios_con_tokens,
        COUNT(DISTINCT plataforma) as plataformas_diferentes
      FROM notificaciones_push
    `;

    try {
      const rows = await query(sql);
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
    const sql = `
      SELECT 
        plataforma,
        COUNT(*) as total_tokens,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as tokens_activos,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as tokens_inactivos
      FROM notificaciones_push
      GROUP BY plataforma
      ORDER BY total_tokens DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por plataforma: ${error.message}`);
    }
  }

  /**
   * Obtener plataformas disponibles
   * @returns {Array} Lista de plataformas
   */
  static obtenerPlataformas() {
    return ['web', 'android', 'ios'];
  }

  /**
   * Validar token de dispositivo
   * @param {string} token_dispositivo - Token a validar
   * @returns {Promise<boolean>} Token válido
   */
  static async validarToken(token_dispositivo) {
    const sql = `
      SELECT COUNT(*) as total
      FROM notificaciones_push
      WHERE token_dispositivo = ? AND activo = 1
    `;

    try {
      const rows = await query(sql, [token_dispositivo]);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al validar token: ${error.message}`);
    }
  }

  /**
   * Limpiar tokens inactivos
   * @param {number} dias_inactivo - Días de inactividad
   * @returns {Promise<number>} Número de tokens eliminados
   */
  static async limpiarTokensInactivos(dias_inactivo = 30) {
    const sql = `
      DELETE FROM notificaciones_push 
      WHERE activo = 0 
        AND updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    try {
      const result = await query(sql, [dias_inactivo]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al limpiar tokens inactivos: ${error.message}`);
    }
  }
}

module.exports = NotificacionPush; 