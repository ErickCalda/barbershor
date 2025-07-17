const { query } = require('../config/database');

/**
 * Modelo para la gestión de correos enviados
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de correos
 */
class CorreoEnviado {
  /**
   * Crear un nuevo registro de correo enviado
   * @param {Object} correo - Datos del correo
   * @returns {Promise<Object>} Correo creado
   */
  static async crear(correo) {
    const {
      destinatario,
      asunto,
      contenido,
      plantilla_id = null,
      estado = 'enviado',
      mensaje_error = null,
      fecha_envio = null,
      cita_id = null,
      usuario_id = null
    } = correo;

    const sql = `
      INSERT INTO correos_enviados 
      (destinatario, asunto, contenido, plantilla_id, estado, mensaje_error, fecha_envio, cita_id, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        destinatario, asunto, contenido, plantilla_id, estado, mensaje_error, 
        fecha_envio || new Date(), cita_id, usuario_id
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear registro de correo: ${error.message}`);
    }
  }

  /**
   * Obtener correo por ID
   * @param {number} id - ID del correo
   * @returns {Promise<Object|null>} Correo encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT ce.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_enviados ce
      LEFT JOIN plantillas_correo pc ON ce.plantilla_id = pc.id
      LEFT JOIN citas c ON ce.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE ce.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener correo: ${error.message}`);
    }
  }

  /**
   * Obtener todos los correos con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de correos y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      estado = null,
      plantilla_id = null,
      cita_id = null,
      usuario_id = null,
      fecha_inicio = null,
      fecha_fin = null,
      orden = 'fecha_envio',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (estado) {
      whereConditions.push('ce.estado = ?');
      params.push(estado);
    }

    if (plantilla_id) {
      whereConditions.push('ce.plantilla_id = ?');
      params.push(plantilla_id);
    }

    if (cita_id) {
      whereConditions.push('ce.cita_id = ?');
      params.push(cita_id);
    }

    if (usuario_id) {
      whereConditions.push('ce.usuario_id = ?');
      params.push(usuario_id);
    }

    if (fecha_inicio) {
      whereConditions.push('ce.fecha_envio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('ce.fecha_envio <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT ce.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_enviados ce
      LEFT JOIN plantillas_correo pc ON ce.plantilla_id = pc.id
      LEFT JOIN citas c ON ce.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      ${whereClause}
      ORDER BY ce.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM correos_enviados ce
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        correos: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener correos: ${error.message}`);
    }
  }

  /**
   * Actualizar correo
   * @param {number} id - ID del correo
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Correo actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['estado', 'mensaje_error', 'fecha_envio'];
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
      UPDATE correos_enviados 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Correo no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar correo: ${error.message}`);
    }
  }

  /**
   * Eliminar correo
   * @param {number} id - ID del correo
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM correos_enviados WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar correo: ${error.message}`);
    }
  }

  /**
   * Buscar correos por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Correos encontrados
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 50 } = opciones;

    const sql = `
      SELECT ce.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_enviados ce
      LEFT JOIN plantillas_correo pc ON ce.plantilla_id = pc.id
      LEFT JOIN citas c ON ce.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE ce.destinatario LIKE ? 
         OR ce.asunto LIKE ?
         OR ce.contenido LIKE ?
         OR pc.nombre LIKE ?
         OR CONCAT(cu.nombre, ' ', cu.apellido) LIKE ?
         OR CONCAT(eu.nombre, ' ', eu.apellido) LIKE ?
      ORDER BY ce.fecha_envio DESC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar correos: ${error.message}`);
    }
  }

  /**
   * Obtener correos por estado
   * @param {string} estado - Estado del correo
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Correos del estado
   */
  static async obtenerPorEstado(estado, opciones = {}) {
    const { orden = 'fecha_envio DESC' } = opciones;

    const sql = `
      SELECT ce.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_enviados ce
      LEFT JOIN plantillas_correo pc ON ce.plantilla_id = pc.id
      LEFT JOIN citas c ON ce.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE ce.estado = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, [estado]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener correos por estado: ${error.message}`);
    }
  }

  /**
   * Obtener correos por plantilla
   * @param {number} plantilla_id - ID de la plantilla
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Correos de la plantilla
   */
  static async obtenerPorPlantilla(plantilla_id, opciones = {}) {
    const { orden = 'fecha_envio DESC' } = opciones;

    const sql = `
      SELECT ce.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_enviados ce
      LEFT JOIN plantillas_correo pc ON ce.plantilla_id = pc.id
      LEFT JOIN citas c ON ce.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE ce.plantilla_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, [plantilla_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener correos por plantilla: ${error.message}`);
    }
  }

  /**
   * Obtener correos por cita
   * @param {number} cita_id - ID de la cita
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Correos de la cita
   */
  static async obtenerPorCita(cita_id, opciones = {}) {
    const { orden = 'fecha_envio DESC' } = opciones;

    const sql = `
      SELECT ce.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_enviados ce
      LEFT JOIN plantillas_correo pc ON ce.plantilla_id = pc.id
      LEFT JOIN citas c ON ce.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE ce.cita_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, [cita_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener correos por cita: ${error.message}`);
    }
  }

  /**
   * Obtener correos por rango de fechas
   * @param {Date} fecha_inicio - Fecha de inicio
   * @param {Date} fecha_fin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Correos del rango
   */
  static async obtenerPorRangoFechas(fecha_inicio, fecha_fin, opciones = {}) {
    const { orden = 'fecha_envio DESC' } = opciones;

    const sql = `
      SELECT ce.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_enviados ce
      LEFT JOIN plantillas_correo pc ON ce.plantilla_id = pc.id
      LEFT JOIN citas c ON ce.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE ce.fecha_envio >= ? AND ce.fecha_envio <= ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, [fecha_inicio, fecha_fin]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener correos por rango de fechas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de correos
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Estadísticas de correos
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('fecha_envio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha_envio <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total_correos,
        COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as enviados_exitosos,
        COUNT(CASE WHEN estado = 'fallido' THEN 1 END) as enviados_fallidos,
        COUNT(CASE WHEN estado = 'programado' THEN 1 END) as programados,
        COUNT(DISTINCT destinatario) as destinatarios_unicos,
        COUNT(DISTINCT plantilla_id) as plantillas_utilizadas,
        COUNT(DISTINCT cita_id) as citas_con_correos,
        AVG(LENGTH(contenido)) as longitud_promedio_contenido
      FROM correos_enviados
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
   * Obtener estadísticas por plantilla
   * @returns {Promise<Array>} Estadísticas por plantilla
   */
  static async obtenerEstadisticasPorPlantilla() {
    const sql = `
      SELECT pc.id,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             COUNT(ce.id) as total_enviados,
             COUNT(CASE WHEN ce.estado = 'enviado' THEN 1 END) as enviados_exitosos,
             COUNT(CASE WHEN ce.estado = 'fallido' THEN 1 END) as enviados_fallidos,
             AVG(LENGTH(ce.contenido)) as longitud_promedio_contenido
      FROM plantillas_correo pc
      LEFT JOIN correos_enviados ce ON pc.id = ce.plantilla_id
      GROUP BY pc.id
      ORDER BY total_enviados DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por plantilla: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por día
   * @param {number} dias - Número de días hacia atrás
   * @returns {Promise<Array>} Estadísticas por día
   */
  static async obtenerEstadisticasPorDia(dias = 30) {
    const sql = `
      SELECT 
        DATE(fecha_envio) as fecha,
        COUNT(*) as total_correos,
        COUNT(CASE WHEN estado = 'enviado' THEN 1 END) as enviados_exitosos,
        COUNT(CASE WHEN estado = 'fallido' THEN 1 END) as enviados_fallidos,
        COUNT(DISTINCT destinatario) as destinatarios_unicos
      FROM correos_enviados
      WHERE fecha_envio >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(fecha_envio)
      ORDER BY fecha DESC
    `;

    try {
      const rows = await query(sql, [dias]);
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
    return ['enviado', 'fallido', 'programado', 'cancelado'];
  }

  /**
   * Marcar correo como enviado
   * @param {number} id - ID del correo
   * @param {Date} fecha_envio - Fecha de envío
   * @returns {Promise<Object>} Correo actualizado
   */
  static async marcarComoEnviado(id, fecha_envio = null) {
    return await this.actualizar(id, {
      estado: 'enviado',
      fecha_envio: fecha_envio || new Date(),
      mensaje_error: null
    });
  }

  /**
   * Marcar correo como fallido
   * @param {number} id - ID del correo
   * @param {string} mensaje_error - Mensaje de error
   * @returns {Promise<Object>} Correo actualizado
   */
  static async marcarComoFallido(id, mensaje_error) {
    return await this.actualizar(id, {
      estado: 'fallido',
      mensaje_error
    });
  }

  /**
   * Exportar correos a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      fecha_inicio = null, 
      fecha_fin = null,
      estado = null,
      plantilla_id = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('ce.fecha_envio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('ce.fecha_envio <= ?');
      params.push(fecha_fin);
    }

    if (estado) {
      whereConditions.push('ce.estado = ?');
      params.push(estado);
    }

    if (plantilla_id) {
      whereConditions.push('ce.plantilla_id = ?');
      params.push(plantilla_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT ce.id, ce.destinatario, ce.asunto, ce.estado, ce.fecha_envio, ce.created_at,
             pc.nombre as plantilla_nombre, pc.tipo as plantilla_tipo,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_enviados ce
      LEFT JOIN plantillas_correo pc ON ce.plantilla_id = pc.id
      LEFT JOIN citas c ON ce.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      ${whereClause}
      ORDER BY ce.fecha_envio DESC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar correos: ${error.message}`);
    }
  }
}

module.exports = CorreoEnviado; 