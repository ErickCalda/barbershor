const { query } = require('../config/database');

/**
 * Modelo para la gestión de calendarios de Google
 * Maneja operaciones CRUD, búsquedas, filtros y sincronización con Google Calendar
 */
class CalendarioGoogle {
  /**
   * Crear un nuevo calendario de Google
   * @param {Object} calendario - Datos del calendario
   * @returns {Promise<Object>} Calendario creado
   */
  static async crear(calendario) {
    const {
      usuario_id,
      calendar_id,
      nombre_calendario = null,
      token_acceso = null,
      token_refresco = null,
      expiracion_token = null,
      sincronizacion_activa = 1
    } = calendario;

    const sql = `
      INSERT INTO calendarios_google 
      (usuario_id, calendar_id, nombre_calendario, token_acceso, token_refresco, expiracion_token, sincronizacion_activa)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        usuario_id, calendar_id, nombre_calendario, token_acceso, token_refresco, 
        expiracion_token, sincronizacion_activa
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear calendario de Google: ${error.message}`);
    }
  }

  /**
   * Obtener calendario por ID
   * @param {number} id - ID del calendario
   * @returns {Promise<Object|null>} Calendario encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT cg.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             r.nombre as rol_usuario,
             COUNT(egc.id) as total_eventos_sincronizados
      FROM calendarios_google cg
      JOIN usuarios u ON cg.usuario_id = u.id
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN eventos_google_calendar egc ON cg.id = egc.calendario_id
      WHERE cg.id = ?
      GROUP BY cg.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener calendario: ${error.message}`);
    }
  }

  /**
   * Obtener todos los calendarios con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de calendarios y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      usuario_id = null,
      sincronizacion_activa = null,
      orden = 'created_at',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (usuario_id) {
      whereConditions.push('cg.usuario_id = ?');
      params.push(usuario_id);
    }

    if (sincronizacion_activa !== null) {
      whereConditions.push('cg.sincronizacion_activa = ?');
      params.push(sincronizacion_activa);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT cg.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             r.nombre as rol_usuario,
             COUNT(egc.id) as total_eventos_sincronizados
      FROM calendarios_google cg
      JOIN usuarios u ON cg.usuario_id = u.id
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN eventos_google_calendar egc ON cg.id = egc.calendario_id
      ${whereClause}
      GROUP BY cg.id
      ORDER BY cg.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM calendarios_google cg
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        calendarios: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener calendarios: ${error.message}`);
    }
  }

  /**
   * Actualizar calendario
   * @param {number} id - ID del calendario
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Calendario actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'calendar_id', 'nombre_calendario', 'token_acceso', 'token_refresco', 
      'expiracion_token', 'sincronizacion_activa', 'ultima_sincronizacion'
    ];
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
      UPDATE calendarios_google 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Calendario no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar calendario: ${error.message}`);
    }
  }

  /**
   * Eliminar calendario
   * @param {number} id - ID del calendario
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM calendarios_google WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar calendario: ${error.message}`);
    }
  }

  /**
   * Obtener calendario por usuario
   * @param {number} usuario_id - ID del usuario
   * @returns {Promise<Array>} Calendarios del usuario
   */
  static async obtenerPorUsuario(usuario_id) {
    const sql = `
      SELECT cg.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             r.nombre as rol_usuario,
             COUNT(egc.id) as total_eventos_sincronizados
      FROM calendarios_google cg
      JOIN usuarios u ON cg.usuario_id = u.id
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN eventos_google_calendar egc ON cg.id = egc.calendario_id
      WHERE cg.usuario_id = ?
      GROUP BY cg.id
      ORDER BY cg.created_at DESC
    `;

    try {
      const rows = await query(sql, [usuario_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener calendarios por usuario: ${error.message}`);
    }
  }

  /**
   * Obtener calendario por calendar_id
   * @param {string} calendar_id - ID del calendario en Google
   * @returns {Promise<Object|null>} Calendario encontrado
   */
  static async obtenerPorCalendarId(calendar_id) {
    const sql = `
      SELECT cg.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             r.nombre as rol_usuario,
             COUNT(egc.id) as total_eventos_sincronizados
      FROM calendarios_google cg
      JOIN usuarios u ON cg.usuario_id = u.id
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN eventos_google_calendar egc ON cg.id = egc.calendario_id
      WHERE cg.calendar_id = ?
      GROUP BY cg.id
    `;

    try {
      const rows = await query(sql, [calendar_id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener calendario por calendar_id: ${error.message}`);
    }
  }

  /**
   * Buscar calendarios por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Calendarios encontrados
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 20 } = opciones;

    const query = `
      SELECT cg.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             r.nombre as rol_usuario,
             COUNT(egc.id) as total_eventos_sincronizados
      FROM calendarios_google cg
      JOIN usuarios u ON cg.usuario_id = u.id
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN eventos_google_calendar egc ON cg.id = egc.calendario_id
      WHERE cg.nombre_calendario LIKE ? 
         OR u.nombre LIKE ?
         OR u.apellido LIKE ?
         OR u.email LIKE ?
         OR cg.calendar_id LIKE ?
      GROUP BY cg.id
      ORDER BY cg.nombre_calendario ASC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(query, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar calendarios: ${error.message}`);
    }
  }

  /**
   * Obtener calendarios activos
   * @returns {Promise<Array>} Calendarios con sincronización activa
   */
  static async obtenerActivos() {
    const query = `
      SELECT cg.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             r.nombre as rol_usuario,
             COUNT(egc.id) as total_eventos_sincronizados
      FROM calendarios_google cg
      JOIN usuarios u ON cg.usuario_id = u.id
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN eventos_google_calendar egc ON cg.id = egc.calendario_id
      WHERE cg.sincronizacion_activa = 1
      GROUP BY cg.id
      ORDER BY cg.ultima_sincronizacion ASC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener calendarios activos: ${error.message}`);
    }
  }

  /**
   * Activar/desactivar sincronización
   * @param {number} id - ID del calendario
   * @param {boolean} sincronizacion_activa - Estado de sincronización
   * @returns {Promise<Object>} Calendario actualizado
   */
  static async cambiarEstadoSincronizacion(id, sincronizacion_activa) {
    const query = `
      UPDATE calendarios_google 
      SET sincronizacion_activa = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, [sincronizacion_activa ? 1 : 0, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Calendario no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al cambiar estado de sincronización: ${error.message}`);
    }
  }

  /**
   * Actualizar tokens de acceso
   * @param {number} id - ID del calendario
   * @param {Object} tokens - Nuevos tokens
   * @returns {Promise<Object>} Calendario actualizado
   */
  static async actualizarTokens(id, tokens) {
    const { token_acceso, token_refresco, expiracion_token } = tokens;

    const query = `
      UPDATE calendarios_google 
      SET token_acceso = ?, token_refresco = ?, expiracion_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, [
        token_acceso, token_refresco, expiracion_token, id
      ]);
      
      if (result.affectedRows === 0) {
        throw new Error('Calendario no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar tokens: ${error.message}`);
    }
  }

  /**
   * Actualizar última sincronización
   * @param {number} id - ID del calendario
   * @param {Date} fecha - Fecha de sincronización
   * @returns {Promise<Object>} Calendario actualizado
   */
  static async actualizarUltimaSincronizacion(id, fecha = null) {
    const query = `
      UPDATE calendarios_google 
      SET ultima_sincronizacion = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, [fecha || new Date(), id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Calendario no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar última sincronización: ${error.message}`);
    }
  }

  /**
   * Obtener calendarios que necesitan sincronización
   * @param {number} minutos - Minutos desde la última sincronización
   * @returns {Promise<Array>} Calendarios que necesitan sincronización
   */
  static async obtenerNecesitanSincronizacion(minutos = 30) {
    const query = `
      SELECT cg.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM calendarios_google cg
      JOIN usuarios u ON cg.usuario_id = u.id
      WHERE cg.sincronizacion_activa = 1
        AND (cg.ultima_sincronizacion IS NULL 
             OR cg.ultima_sincronizacion < DATE_SUB(NOW(), INTERVAL ? MINUTE))
      ORDER BY cg.ultima_sincronizacion ASC
    `;

    try {
      const rows = await query(query, [minutos]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener calendarios que necesitan sincronización: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de calendarios
   * @returns {Promise<Object>} Estadísticas de calendarios
   */
  static async obtenerEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total_calendarios,
        COUNT(CASE WHEN sincronizacion_activa = 1 THEN 1 END) as sincronizacion_activa,
        COUNT(CASE WHEN sincronizacion_activa = 0 THEN 1 END) as sincronizacion_inactiva,
        COUNT(CASE WHEN ultima_sincronizacion IS NOT NULL THEN 1 END) as con_sincronizacion,
        COUNT(DISTINCT usuario_id) as usuarios_con_calendario,
        AVG(TIMESTAMPDIFF(MINUTE, ultima_sincronizacion, NOW())) as minutos_desde_ultima_sinc
      FROM calendarios_google
    `;

    try {
      const rows = await query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
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
             COUNT(cg.id) as total_calendarios,
             COUNT(CASE WHEN cg.sincronizacion_activa = 1 THEN 1 END) as calendarios_activos,
             COUNT(egc.id) as total_eventos_sincronizados,
             MAX(cg.ultima_sincronizacion) as ultima_sincronizacion
      FROM usuarios u
      LEFT JOIN calendarios_google cg ON u.id = cg.usuario_id
      LEFT JOIN eventos_google_calendar egc ON cg.id = egc.calendario_id
      GROUP BY u.id
      HAVING total_calendarios > 0
      ORDER BY total_calendarios DESC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por usuario: ${error.message}`);
    }
  }

  /**
   * Verificar si el token ha expirado
   * @param {number} id - ID del calendario
   * @returns {Promise<boolean>} Token expirado
   */
  static async tokenExpirado(id) {
    const query = `
      SELECT expiracion_token
      FROM calendarios_google
      WHERE id = ?
    `;

    try {
      const rows = await query(query, [id]);
      
      if (!rows[0] || !rows[0].expiracion_token) {
        return true; // Sin token o token nulo se considera expirado
      }

      const expiracion = new Date(rows[0].expiracion_token);
      const ahora = new Date();
      
      return expiracion < ahora;
    } catch (error) {
      throw new Error(`Error al verificar expiración de token: ${error.message}`);
    }
  }

  /**
   * Obtener calendarios con tokens expirados
   * @returns {Promise<Array>} Calendarios con tokens expirados
   */
  static async obtenerConTokensExpirados() {
    const query = `
      SELECT cg.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM calendarios_google cg
      JOIN usuarios u ON cg.usuario_id = u.id
      WHERE cg.expiracion_token IS NOT NULL
        AND cg.expiracion_token < NOW()
      ORDER BY cg.expiracion_token ASC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener calendarios con tokens expirados: ${error.message}`);
    }
  }

  /**
   * Exportar calendarios a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      sincronizacion_activa = null,
      usuario_id = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (sincronizacion_activa !== null) {
      whereConditions.push('cg.sincronizacion_activa = ?');
      params.push(sincronizacion_activa);
    }

    if (usuario_id) {
      whereConditions.push('cg.usuario_id = ?');
      params.push(usuario_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT cg.id, cg.calendar_id, cg.nombre_calendario, cg.sincronizacion_activa,
             cg.ultima_sincronizacion, cg.expiracion_token, cg.created_at,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email,
             r.nombre as rol_usuario,
             COUNT(egc.id) as total_eventos_sincronizados
      FROM calendarios_google cg
      JOIN usuarios u ON cg.usuario_id = u.id
      JOIN roles r ON u.rol_id = r.id
      LEFT JOIN eventos_google_calendar egc ON cg.id = egc.calendario_id
      ${whereClause}
      GROUP BY cg.id
      ORDER BY cg.created_at DESC
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar calendarios: ${error.message}`);
    }
  }
}

module.exports = CalendarioGoogle; 