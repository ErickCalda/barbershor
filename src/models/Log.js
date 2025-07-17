const { query } = require('../config/database');

/**
 * Modelo para la gestión de logs del sistema
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de logs
 */
class Log {
  /**
   * Crear un nuevo log
   * @param {Object} log - Datos del log
   * @returns {Promise<Object>} Log creado
   */
  static async crear(log) {
    const {
      accion,
      tabla_afectada = null,
      registro_id = null,
      detalles = null,
      usuario_id = null,
      ip = null,
      user_agent = null,
      created_at = new Date()
    } = log;

    const sql = `
      INSERT INTO logs (
        accion, tabla_afectada, registro_id, detalles, usuario_id, ip, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        accion, tabla_afectada, registro_id, detalles, usuario_id, ip, user_agent, created_at
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear log: ${error.message}`);
    }
  }

  /**
   * Crear log de información
   * @param {string} mensaje - Mensaje del log
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Log creado
   */
  static async info(mensaje, opciones = {}) {
    return await this.crear({
      nivel: 'INFO',
      mensaje,
      ...opciones
    });
  }

  /**
   * Crear log de advertencia
   * @param {string} mensaje - Mensaje del log
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Log creado
   */
  static async warning(mensaje, opciones = {}) {
    return await this.crear({
      nivel: 'WARNING',
      mensaje,
      ...opciones
    });
  }

  /**
   * Crear log de error
   * @param {string} mensaje - Mensaje del log
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Log creado
   */
  static async error(mensaje, opciones = {}) {
    return await this.crear({
      nivel: 'ERROR',
      mensaje,
      ...opciones
    });
  }

  /**
   * Crear log de debug
   * @param {string} mensaje - Mensaje del log
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Log creado
   */
  static async debug(mensaje, opciones = {}) {
    return await this.crear({
      nivel: 'DEBUG',
      mensaje,
      ...opciones
    });
  }

  /**
   * Obtener log por ID
   * @param {number} id - ID del log
   * @returns {Promise<Object|null>} Log encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT l.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM logs l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE l.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener log: ${error.message}`);
    }
  }

  /**
   * Obtener todos los logs con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de logs y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 50,
      nivel = null,
      contexto = null,
      usuario_id = null,
      fecha_inicio = null,
      fecha_fin = null,
      orden = 'fecha_creacion',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (nivel) {
      whereConditions.push('l.nivel = ?');
      params.push(nivel);
    }

    if (contexto) {
      whereConditions.push('l.contexto = ?');
      params.push(contexto);
    }

    if (usuario_id) {
      whereConditions.push('l.usuario_id = ?');
      params.push(usuario_id);
    }

    if (fecha_inicio) {
      whereConditions.push('l.fecha_creacion >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('l.fecha_creacion <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT l.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM logs l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ${whereClause}
      ORDER BY l.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM logs l
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countSql, params);

      return {
        logs: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener logs: ${error.message}`);
    }
  }

  /**
   * Actualizar log
   * @param {number} id - ID del log
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Log actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['mensaje', 'contexto', 'datos_adicionales'];
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
      UPDATE logs 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      if (result.affectedRows === 0) {
        throw new Error('Log no encontrado');
      }
      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar log: ${error.message}`);
    }
  }

  /**
   * Eliminar log
   * @param {number} id - ID del log
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM logs WHERE id = ?';
    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar log: ${error.message}`);
    }
  }

  /**
   * Buscar logs por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Logs encontrados
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 100 } = opciones;

    const query = `
      SELECT l.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM logs l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE l.mensaje LIKE ? 
         OR l.contexto LIKE ? 
         OR l.datos_adicionales LIKE ?
         OR CONCAT(u.nombre, ' ', u.apellido) LIKE ?
      ORDER BY l.fecha_creacion DESC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(query, [
        searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar logs: ${error.message}`);
    }
  }

  /**
   * Obtener logs por nivel
   * @param {string} nivel - Nivel del log
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Logs del nivel
   */
  static async obtenerPorNivel(nivel, opciones = {}) {
    const { limite = 100, orden = 'fecha_creacion DESC' } = opciones;

    const query = `
      SELECT l.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM logs l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE l.nivel = ?
      ORDER BY l.${orden}
      LIMIT ?
    `;

    try {
      const rows = await query(query, [nivel, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener logs por nivel: ${error.message}`);
    }
  }

  /**
   * Obtener logs por contexto
   * @param {string} contexto - Contexto del log
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Logs del contexto
   */
  static async obtenerPorContexto(contexto, opciones = {}) {
    const { limite = 100, orden = 'fecha_creacion DESC' } = opciones;

    const query = `
      SELECT l.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM logs l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE l.contexto = ?
      ORDER BY l.${orden}
      LIMIT ?
    `;

    try {
      const rows = await query(query, [contexto, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener logs por contexto: ${error.message}`);
    }
  }

  /**
   * Obtener logs por usuario
   * @param {number} usuario_id - ID del usuario
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Logs del usuario
   */
  static async obtenerPorUsuario(usuario_id, opciones = {}) {
    const { limite = 100, orden = 'fecha_creacion DESC' } = opciones;

    const query = `
      SELECT l.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM logs l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE l.usuario_id = ?
      ORDER BY l.${orden}
      LIMIT ?
    `;

    try {
      const rows = await query(query, [usuario_id, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener logs por usuario: ${error.message}`);
    }
  }

  /**
   * Obtener logs por rango de fechas
   * @param {Date} fecha_inicio - Fecha de inicio
   * @param {Date} fecha_fin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Logs del rango
   */
  static async obtenerPorRangoFechas(fecha_inicio, fecha_fin, opciones = {}) {
    const { nivel = null, limite = 100, orden = 'fecha_creacion DESC' } = opciones;

    let whereConditions = ['l.fecha_creacion >= ?', 'l.fecha_creacion <= ?'];
    let params = [fecha_inicio, fecha_fin];

    if (nivel) {
      whereConditions.push('l.nivel = ?');
      params.push(nivel);
    }

    const query = `
      SELECT l.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM logs l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY l.${orden}
      LIMIT ?
    `;

    try {
      const rows = await query(query, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener logs por rango de fechas: ${error.message}`);
    }
  }

  /**
   * Obtener logs de errores recientes
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Logs de errores
   */
  static async obtenerErroresRecientes(opciones = {}) {
    const { limite = 50, dias = 7 } = opciones;

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const query = `
      SELECT l.*,
             CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
             u.email as usuario_email
      FROM logs l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE l.nivel = 'ERROR'
        AND l.fecha_creacion >= ?
      ORDER BY l.fecha_creacion DESC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [fechaLimite, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener errores recientes: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de logs
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Estadísticas de logs
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('fecha_creacion >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha_creacion <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN nivel = 'INFO' THEN 1 END) as info,
        COUNT(CASE WHEN nivel = 'WARNING' THEN 1 END) as warning,
        COUNT(CASE WHEN nivel = 'ERROR' THEN 1 END) as error,
        COUNT(CASE WHEN nivel = 'DEBUG' THEN 1 END) as debug,
        COUNT(DISTINCT usuario_id) as usuarios_activos,
        COUNT(DISTINCT contexto) as contextos,
        COUNT(DISTINCT DATE(fecha_creacion)) as dias_con_logs
      FROM logs
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
   * Obtener estadísticas por nivel
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Estadísticas por nivel
   */
  static async obtenerEstadisticasPorNivel(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('fecha_creacion >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha_creacion <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        nivel,
        COUNT(*) as cantidad
      FROM logs
      ${whereClause}
      GROUP BY nivel
      ORDER BY cantidad DESC
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por nivel: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por contexto
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Estadísticas por contexto
   */
  static async obtenerEstadisticasPorContexto(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null, limite = 10 } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('fecha_creacion >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha_creacion <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        contexto,
        COUNT(*) as cantidad,
        COUNT(CASE WHEN nivel = 'ERROR' THEN 1 END) as errores
      FROM logs
      ${whereClause}
      GROUP BY contexto
      ORDER BY cantidad DESC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por contexto: ${error.message}`);
    }
  }

  /**
   * Limpiar logs antiguos
   * @param {Object} opciones - Opciones de limpieza
   * @returns {Promise<number>} Cantidad de logs eliminados
   */
  static async limpiarLogsAntiguos(opciones = {}) {
    const { dias = 30, nivel = null } = opciones;

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    let whereConditions = ['fecha_creacion < ?'];
    let params = [fechaLimite];

    if (nivel) {
      whereConditions.push('nivel = ?');
      params.push(nivel);
    }

    const query = `DELETE FROM logs WHERE ${whereConditions.join(' AND ')}`;

    try {
      const rows = await query(query, params);
      return rows.affectedRows;
    } catch (error) {
      throw new Error(`Error al limpiar logs antiguos: ${error.message}`);
    }
  }

  /**
   * Exportar logs a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      fecha_inicio = null, 
      fecha_fin = null, 
      nivel = null,
      contexto = null,
      incluir_usuario = true 
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('l.fecha_creacion >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('l.fecha_creacion <= ?');
      params.push(fecha_fin);
    }

    if (nivel) {
      whereConditions.push('l.nivel = ?');
      params.push(nivel);
    }

    if (contexto) {
      whereConditions.push('l.contexto = ?');
      params.push(contexto);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let query = `
      SELECT l.id, l.nivel, l.mensaje, l.contexto, l.ip, l.user_agent, l.fecha_creacion
    `;

    if (incluir_usuario) {
      query = `
        SELECT l.id, l.nivel, l.mensaje, l.contexto, l.ip, l.user_agent, l.fecha_creacion,
               CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
               u.email as usuario_email
      `;
    }

    query += `
      FROM logs l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      ${whereClause}
      ORDER BY l.fecha_creacion DESC
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar logs: ${error.message}`);
    }
  }

  /**
   * Obtener niveles disponibles
   * @returns {Array} Niveles disponibles
   */
  static obtenerNiveles() {
    return ['DEBUG', 'INFO', 'WARNING', 'ERROR'];
  }

  /**
   * Obtener contextos comunes
   * @returns {Array} Contextos comunes
   */
  static obtenerContextosComunes() {
    return [
      'auth',
      'api',
      'database',
      'upload',
      'email',
      'payment',
      'appointment',
      'user',
      'admin',
      'system'
    ];
  }
}

module.exports = Log; 