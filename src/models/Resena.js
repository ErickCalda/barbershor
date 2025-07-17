const { query } = require('../config/database');

/**
 * Modelo para la gestión de reseñas
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de reseñas
 */
class Resena {
  /**
   * Crear una nueva reseña
   * @param {Object} resena - Datos de la reseña
   * @returns {Promise<Object>} Reseña creada
   */
  static async crear(resena) {
    const {
      cliente_id,
      empleado_id,
      cita_id,
      calificacion,
      comentario,
      publico = 1
    } = resena;

    // Validar calificación
    if (calificacion < 1 || calificacion > 5) {
      throw new Error('La calificación debe estar entre 1 y 5');
    }

    const sql = `
      INSERT INTO resenas (
        cliente_id, empleado_id, cita_id, calificacion, comentario, publico
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        cliente_id, empleado_id, cita_id, calificacion, comentario, publico
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear reseña: ${error.message}`);
    }
  }

  /**
   * Obtener reseña por ID
   * @param {number} id - ID de la reseña
   * @returns {Promise<Object|null>} Reseña encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT r.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.foto_perfil as cliente_foto,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             u_empleado.foto_perfil as empleado_foto,
             c.fecha_hora_inicio,
             c.fecha_hora_fin
      FROM resenas r
      JOIN clientes cl ON r.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      JOIN empleados e ON r.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN citas c ON r.cita_id = c.id
      WHERE r.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener reseña: ${error.message}`);
    }
  }

  /**
   * Obtener todas las reseñas con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de reseñas y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      cliente_id = null,
      empleado_id = null,
      calificacion = null,
      publico = null,
      fecha_inicio = null,
      fecha_fin = null,
      orden = 'fecha_resena',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (cliente_id) {
      whereConditions.push('r.cliente_id = ?');
      params.push(cliente_id);
    }

    if (empleado_id) {
      whereConditions.push('r.empleado_id = ?');
      params.push(empleado_id);
    }

    if (calificacion) {
      whereConditions.push('r.calificacion = ?');
      params.push(calificacion);
    }

    if (publico !== null) {
      whereConditions.push('r.publico = ?');
      params.push(publico);
    }

    if (fecha_inicio) {
      whereConditions.push('r.fecha_resena >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('r.fecha_resena <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT r.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.foto_perfil as cliente_foto,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             u_empleado.foto_perfil as empleado_foto,
             c.fecha_hora_inicio
      FROM resenas r
      JOIN clientes cl ON r.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      JOIN empleados e ON r.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN citas c ON r.cita_id = c.id
      ${whereClause}
      ORDER BY r.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM resenas r
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        resenas: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener reseñas: ${error.message}`);
    }
  }

  /**
   * Actualizar reseña
   * @param {number} id - ID de la reseña
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Reseña actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'calificacion', 'comentario', 'publico', 'respuesta', 'fecha_respuesta'
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

    // Validar calificación si se está actualizando
    if (datos.calificacion !== undefined && (datos.calificacion < 1 || datos.calificacion > 5)) {
      throw new Error('La calificación debe estar entre 1 y 5');
    }

    valores.push(id);
    const sql = `
      UPDATE resenas 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Reseña no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar reseña: ${error.message}`);
    }
  }

  /**
   * Eliminar reseña
   * @param {number} id - ID de la reseña
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM resenas WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar reseña: ${error.message}`);
    }
  }

  /**
   * Obtener reseñas por cliente
   * @param {number} cliente_id - ID del cliente
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Reseñas del cliente
   */
  static async obtenerPorCliente(cliente_id, opciones = {}) {
    const {
      publico = null,
      limite = 20,
      orden = 'fecha_resena DESC'
    } = opciones;

    let whereConditions = ['r.cliente_id = ?'];
    let params = [cliente_id];

    if (publico !== null) {
      whereConditions.push('r.publico = ?');
      params.push(publico);
    }

    const sql = `
      SELECT r.*,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             u_empleado.foto_perfil as empleado_foto,
             c.fecha_hora_inicio
      FROM resenas r
      JOIN empleados e ON r.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN citas c ON r.cita_id = c.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY r.${orden}
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener reseñas por cliente: ${error.message}`);
    }
  }

  /**
   * Obtener reseñas por empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Reseñas del empleado
   */
  static async obtenerPorEmpleado(empleado_id, opciones = {}) {
    const {
      publico = null,
      calificacion = null,
      limite = 20,
      orden = 'fecha_resena DESC'
    } = opciones;

    let whereConditions = ['r.empleado_id = ?'];
    let params = [empleado_id];

    if (publico !== null) {
      whereConditions.push('r.publico = ?');
      params.push(publico);
    }

    if (calificacion) {
      whereConditions.push('r.calificacion = ?');
      params.push(calificacion);
    }

    const sql = `
      SELECT r.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.foto_perfil as cliente_foto,
             c.fecha_hora_inicio
      FROM resenas r
      JOIN clientes cl ON r.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      LEFT JOIN citas c ON r.cita_id = c.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY r.${orden}
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener reseñas por empleado: ${error.message}`);
    }
  }

  /**
   * Obtener reseñas públicas
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Reseñas públicas
   */
  static async obtenerPublicas(opciones = {}) {
    const {
      empleado_id = null,
      calificacion = null,
      limite = 10,
      orden = 'fecha_resena DESC'
    } = opciones;

    let whereConditions = ['r.publico = 1'];
    let params = [];

    if (empleado_id) {
      whereConditions.push('r.empleado_id = ?');
      params.push(empleado_id);
    }

    if (calificacion) {
      whereConditions.push('r.calificacion = ?');
      params.push(calificacion);
    }

    const sql = `
      SELECT r.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.foto_perfil as cliente_foto,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             u_empleado.foto_perfil as empleado_foto
      FROM resenas r
      JOIN clientes cl ON r.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      JOIN empleados e ON r.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY r.${orden}
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener reseñas públicas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de reseñas
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Object>} Estadísticas de reseñas
   */
  static async obtenerEstadisticas(opciones = {}) {
    const {
      empleado_id = null,
      cliente_id = null,
      fecha_inicio = null,
      fecha_fin = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (empleado_id) {
      whereConditions.push('empleado_id = ?');
      params.push(empleado_id);
    }

    if (cliente_id) {
      whereConditions.push('cliente_id = ?');
      params.push(cliente_id);
    }

    if (fecha_inicio) {
      whereConditions.push('fecha_resena >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha_resena <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total_resenas,
        AVG(calificacion) as calificacion_promedio,
        COUNT(CASE WHEN calificacion = 5 THEN 1 END) as calificacion_5,
        COUNT(CASE WHEN calificacion = 4 THEN 1 END) as calificacion_4,
        COUNT(CASE WHEN calificacion = 3 THEN 1 END) as calificacion_3,
        COUNT(CASE WHEN calificacion = 2 THEN 1 END) as calificacion_2,
        COUNT(CASE WHEN calificacion = 1 THEN 1 END) as calificacion_1,
        COUNT(CASE WHEN publico = 1 THEN 1 END) as publicas,
        COUNT(CASE WHEN publico = 0 THEN 1 END) as privadas,
        COUNT(CASE WHEN respuesta IS NOT NULL THEN 1 END) as con_respuesta
      FROM resenas
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
   * Obtener estadísticas por empleado
   * @param {number} empleado_id - ID del empleado
   * @returns {Promise<Object>} Estadísticas del empleado
   */
  static async obtenerEstadisticasEmpleado(empleado_id) {
    const sql = `
      SELECT 
        COUNT(*) as total_resenas,
        AVG(calificacion) as calificacion_promedio,
        COUNT(CASE WHEN calificacion = 5 THEN 1 END) as calificacion_5,
        COUNT(CASE WHEN calificacion = 4 THEN 1 END) as calificacion_4,
        COUNT(CASE WHEN calificacion = 3 THEN 1 END) as calificacion_3,
        COUNT(CASE WHEN calificacion = 2 THEN 1 END) as calificacion_2,
        COUNT(CASE WHEN calificacion = 1 THEN 1 END) as calificacion_1,
        COUNT(CASE WHEN publico = 1 THEN 1 END) as publicas,
        COUNT(CASE WHEN respuesta IS NOT NULL THEN 1 END) as con_respuesta
      FROM resenas
      WHERE empleado_id = ?
    `;

    try {
      const rows = await query(sql, [empleado_id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del empleado: ${error.message}`);
    }
  }

  /**
   * Obtener reseñas recientes
   * @param {number} limite - Límite de resultados
   * @param {boolean} soloPublicas - Solo reseñas públicas
   * @returns {Promise<Array>} Reseñas recientes
   */
  static async obtenerRecientes(limite = 10, soloPublicas = true) {
    const whereClause = soloPublicas ? 'WHERE r.publico = 1' : '';

    const sql = `
      SELECT r.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.foto_perfil as cliente_foto,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             u_empleado.foto_perfil as empleado_foto
      FROM resenas r
      JOIN clientes cl ON r.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      JOIN empleados e ON r.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      ${whereClause}
      ORDER BY r.fecha_resena DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener reseñas recientes: ${error.message}`);
    }
  }

  /**
   * Obtener reseñas por calificación
   * @param {number} calificacion - Calificación específica (1-5)
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Reseñas por calificación
   */
  static async obtenerPorCalificacion(calificacion, opciones = {}) {
    const { empleado_id = null, publico = null, limite = 20 } = opciones;

    let whereConditions = ['r.calificacion = ?'];
    let params = [calificacion];

    if (empleado_id) {
      whereConditions.push('r.empleado_id = ?');
      params.push(empleado_id);
    }

    if (publico !== null) {
      whereConditions.push('r.publico = ?');
      params.push(publico);
    }

    const sql = `
      SELECT r.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.foto_perfil as cliente_foto,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             u_empleado.foto_perfil as empleado_foto
      FROM resenas r
      JOIN clientes cl ON r.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      JOIN empleados e ON r.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY r.fecha_resena DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener reseñas por calificación: ${error.message}`);
    }
  }

  /**
   * Responder a una reseña
   * @param {number} id - ID de la reseña
   * @param {string} respuesta - Respuesta a la reseña
   * @returns {Promise<Object>} Reseña actualizada
   */
  static async responder(id, respuesta) {
    const sql = `
      UPDATE resenas 
      SET respuesta = ?, fecha_respuesta = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [respuesta, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Reseña no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al responder reseña: ${error.message}`);
    }
  }

  /**
   * Verificar si un cliente ya reseñó una cita
   * @param {number} cliente_id - ID del cliente
   * @param {number} cita_id - ID de la cita
   * @returns {Promise<boolean>} Ya reseñó la cita
   */
  static async clienteYaReseno(cliente_id, cita_id) {
    const sql = 'SELECT COUNT(*) as total FROM resenas WHERE cliente_id = ? AND cita_id = ?';

    try {
      const rows = await query(sql, [cliente_id, cita_id]);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al verificar reseña: ${error.message}`);
    }
  }

  /**
   * Obtener reseñas pendientes de respuesta
   * @param {number} empleado_id - ID del empleado (opcional)
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Reseñas pendientes de respuesta
   */
  static async obtenerPendientesRespuesta(empleado_id = null, limite = 20) {
    let whereConditions = ['r.respuesta IS NULL'];
    let params = [];

    if (empleado_id) {
      whereConditions.push('r.empleado_id = ?');
      params.push(empleado_id);
    }

    const sql = `
      SELECT r.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.foto_perfil as cliente_foto,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             u_empleado.foto_perfil as empleado_foto
      FROM resenas r
      JOIN clientes cl ON r.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      JOIN empleados e ON r.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY r.fecha_resena ASC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener reseñas pendientes: ${error.message}`);
    }
  }
}

module.exports = Resena; 