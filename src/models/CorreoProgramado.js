const { query } = require('../config/database');

/**
 * Modelo para la gestión de correos programados
 * Maneja operaciones CRUD, búsquedas, filtros y programación de correos
 */
class CorreoProgramado {
  /**
   * Crear un nuevo correo programado
   * @param {Object} correo - Datos del correo programado
   * @returns {Promise<Object>} Correo programado creado
   */
  static async crear(correo) {
    const {
      plantilla_id,
      destinatario,
      asunto = null,
      variables_datos = null,
      fecha_programada,
      cita_id = null,
      usuario_id = null,
      maximo_intentos = 3
    } = correo;

    const query = `
      INSERT INTO correos_programados 
      (plantilla_id, destinatario, asunto, variables_datos, fecha_programada, cita_id, usuario_id, maximo_intentos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [
        plantilla_id, destinatario, asunto, variables_datos, fecha_programada, 
        cita_id, usuario_id, maximo_intentos
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear correo programado: ${error.message}`);
    }
  }

  /**
   * Obtener correo programado por ID
   * @param {number} id - ID del correo programado
   * @returns {Promise<Object|null>} Correo programado encontrado
   */
  static async obtenerPorId(id) {
    const query = `
      SELECT cp.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             pc.asunto as plantilla_asunto,
             ce.id as correo_enviado_id,
             ce.estado as estado_envio,
             ce.fecha_envio,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_programados cp
      JOIN plantillas_correo pc ON cp.plantilla_id = pc.id
      LEFT JOIN correos_enviados ce ON cp.correo_enviado_id = ce.id
      LEFT JOIN citas c ON cp.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE cp.id = ?
    `;

    try {
      const rows = await query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener correo programado: ${error.message}`);
    }
  }

  /**
   * Obtener todos los correos programados con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de correos programados y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      enviado = null,
      plantilla_id = null,
      cita_id = null,
      usuario_id = null,
      fecha_inicio = null,
      fecha_fin = null,
      orden = 'fecha_programada',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (enviado !== null) {
      whereConditions.push('cp.enviado = ?');
      params.push(enviado);
    }

    if (plantilla_id) {
      whereConditions.push('cp.plantilla_id = ?');
      params.push(plantilla_id);
    }

    if (cita_id) {
      whereConditions.push('cp.cita_id = ?');
      params.push(cita_id);
    }

    if (usuario_id) {
      whereConditions.push('cp.usuario_id = ?');
      params.push(usuario_id);
    }

    if (fecha_inicio) {
      whereConditions.push('cp.fecha_programada >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('cp.fecha_programada <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT cp.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             pc.asunto as plantilla_asunto,
             ce.id as correo_enviado_id,
             ce.estado as estado_envio,
             ce.fecha_envio,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_programados cp
      JOIN plantillas_correo pc ON cp.plantilla_id = pc.id
      LEFT JOIN correos_enviados ce ON cp.correo_enviado_id = ce.id
      LEFT JOIN citas c ON cp.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      ${whereClause}
      ORDER BY cp.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM correos_programados cp
      ${whereClause}
    `;

    try {
      const rows = await query(query, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        correosProgramados: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener correos programados: ${error.message}`);
    }
  }

  /**
   * Actualizar correo programado
   * @param {number} id - ID del correo programado
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Correo programado actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'plantilla_id', 'destinatario', 'asunto', 'variables_datos', 
      'fecha_programada', 'enviado', 'correo_enviado_id', 'intentos', 'maximo_intentos'
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
    const query = `
      UPDATE correos_programados 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Correo programado no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar correo programado: ${error.message}`);
    }
  }

  /**
   * Eliminar correo programado
   * @param {number} id - ID del correo programado
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const query = 'DELETE FROM correos_programados WHERE id = ?';

    try {
      const result = await query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar correo programado: ${error.message}`);
    }
  }

  /**
   * Buscar correos programados por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Correos programados encontrados
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 50 } = opciones;

    const query = `
      SELECT cp.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             pc.asunto as plantilla_asunto,
             ce.id as correo_enviado_id,
             ce.estado as estado_envio,
             ce.fecha_envio,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_programados cp
      JOIN plantillas_correo pc ON cp.plantilla_id = pc.id
      LEFT JOIN correos_enviados ce ON cp.correo_enviado_id = ce.id
      LEFT JOIN citas c ON cp.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE cp.destinatario LIKE ? 
         OR cp.asunto LIKE ?
         OR pc.nombre LIKE ?
         OR CONCAT(cu.nombre, ' ', cu.apellido) LIKE ?
         OR CONCAT(eu.nombre, ' ', eu.apellido) LIKE ?
      ORDER BY cp.fecha_programada DESC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(query, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar correos programados: ${error.message}`);
    }
  }

  /**
   * Obtener correos programados pendientes
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Correos programados pendientes
   */
  static async obtenerPendientes(opciones = {}) {
    const { limite = 100 } = opciones;

    const query = `
      SELECT cp.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             pc.asunto as plantilla_asunto,
             pc.contenido_html as plantilla_contenido,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_programados cp
      JOIN plantillas_correo pc ON cp.plantilla_id = pc.id
      LEFT JOIN citas c ON cp.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE cp.enviado = 0 
        AND cp.fecha_programada <= NOW()
        AND cp.intentos < cp.maximo_intentos
      ORDER BY cp.fecha_programada ASC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener correos pendientes: ${error.message}`);
    }
  }

  /**
   * Obtener correos programados por plantilla
   * @param {number} plantilla_id - ID de la plantilla
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Correos programados de la plantilla
   */
  static async obtenerPorPlantilla(plantilla_id, opciones = {}) {
    const { orden = 'fecha_programada DESC' } = opciones;

    const query = `
      SELECT cp.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             pc.asunto as plantilla_asunto,
             ce.id as correo_enviado_id,
             ce.estado as estado_envio,
             ce.fecha_envio,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_programados cp
      JOIN plantillas_correo pc ON cp.plantilla_id = pc.id
      LEFT JOIN correos_enviados ce ON cp.correo_enviado_id = ce.id
      LEFT JOIN citas c ON cp.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE cp.plantilla_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, [plantilla_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener correos por plantilla: ${error.message}`);
    }
  }

  /**
   * Obtener correos programados por cita
   * @param {number} cita_id - ID de la cita
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Correos programados de la cita
   */
  static async obtenerPorCita(cita_id, opciones = {}) {
    const { orden = 'fecha_programada ASC' } = opciones;

    const query = `
      SELECT cp.*,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             pc.asunto as plantilla_asunto,
             ce.id as correo_enviado_id,
             ce.estado as estado_envio,
             ce.fecha_envio,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_programados cp
      JOIN plantillas_correo pc ON cp.plantilla_id = pc.id
      LEFT JOIN correos_enviados ce ON cp.correo_enviado_id = ce.id
      LEFT JOIN citas c ON cp.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      WHERE cp.cita_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, [cita_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener correos por cita: ${error.message}`);
    }
  }

  /**
   * Marcar correo como enviado
   * @param {number} id - ID del correo programado
   * @param {number} correo_enviado_id - ID del correo enviado
   * @returns {Promise<Object>} Correo programado actualizado
   */
  static async marcarComoEnviado(id, correo_enviado_id) {
    return await this.actualizar(id, {
      enviado: 1,
      correo_enviado_id
    });
  }

  /**
   * Incrementar intentos de envío
   * @param {number} id - ID del correo programado
   * @returns {Promise<Object>} Correo programado actualizado
   */
  static async incrementarIntentos(id) {
    const correo = await this.obtenerPorId(id);
    if (!correo) {
      throw new Error('Correo programado no encontrado');
    }

    const nuevosIntentos = correo.intentos + 1;
    return await this.actualizar(id, { intentos: nuevosIntentos });
  }

  /**
   * Reprogramar correo
   * @param {number} id - ID del correo programado
   * @param {Date} nueva_fecha - Nueva fecha de programación
   * @returns {Promise<Object>} Correo programado actualizado
   */
  static async reprogramar(id, nueva_fecha) {
    return await this.actualizar(id, {
      fecha_programada: nueva_fecha,
      enviado: 0,
      correo_enviado_id: null,
      intentos: 0
    });
  }

  /**
   * Cancelar correo programado
   * @param {number} id - ID del correo programado
   * @returns {Promise<Object>} Correo programado actualizado
   */
  static async cancelar(id) {
    return await this.actualizar(id, {
      enviado: 1,
      intentos: 999 // Marcar como cancelado
    });
  }

  /**
   * Obtener estadísticas de correos programados
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Estadísticas de correos programados
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('fecha_programada >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha_programada <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        COUNT(*) as total_programados,
        COUNT(CASE WHEN enviado = 1 THEN 1 END) as enviados,
        COUNT(CASE WHEN enviado = 0 THEN 1 END) as pendientes,
        COUNT(CASE WHEN fecha_programada <= NOW() AND enviado = 0 THEN 1 END) as vencidos,
        COUNT(CASE WHEN intentos >= maximo_intentos THEN 1 END) as max_intentos_alcanzados,
        AVG(intentos) as intentos_promedio,
        COUNT(DISTINCT plantilla_id) as plantillas_utilizadas,
        COUNT(DISTINCT destinatario) as destinatarios_unicos
      FROM correos_programados
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
   * Obtener estadísticas por plantilla
   * @returns {Promise<Array>} Estadísticas por plantilla
   */
  static async obtenerEstadisticasPorPlantilla() {
    const query = `
      SELECT pc.id,
             pc.nombre as plantilla_nombre,
             pc.tipo as plantilla_tipo,
             COUNT(cp.id) as total_programados,
             COUNT(CASE WHEN cp.enviado = 1 THEN 1 END) as enviados,
             COUNT(CASE WHEN cp.enviado = 0 THEN 1 END) as pendientes,
             AVG(cp.intentos) as intentos_promedio
      FROM plantillas_correo pc
      LEFT JOIN correos_programados cp ON pc.id = cp.plantilla_id
      GROUP BY pc.id
      ORDER BY total_programados DESC
    `;

    try {
      const rows = await query(query);
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
    const query = `
      SELECT 
        DATE(fecha_programada) as fecha,
        COUNT(*) as total_programados,
        COUNT(CASE WHEN enviado = 1 THEN 1 END) as enviados,
        COUNT(CASE WHEN enviado = 0 THEN 1 END) as pendientes,
        COUNT(DISTINCT destinatario) as destinatarios_unicos
      FROM correos_programados
      WHERE fecha_programada >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(fecha_programada)
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
   * Programar múltiples correos
   * @param {Array} correos - Array de correos a programar
   * @returns {Promise<Array>} Correos programados creados
   */
  static async programarMultiples(correos) {
    const correosCreados = [];

    for (const correo of correos) {
      try {
        const correoCreado = await this.crear(correo);
        correosCreados.push(correoCreado);
      } catch (error) {
        console.error(`Error al programar correo para ${correo.destinatario}:`, error);
      }
    }

    return correosCreados;
  }

  /**
   * Limpiar correos programados antiguos
   * @param {number} dias - Días de antigüedad para limpiar
   * @returns {Promise<number>} Cantidad de correos eliminados
   */
  static async limpiarAntiguos(dias = 90) {
    const query = `
      DELETE FROM correos_programados 
      WHERE fecha_programada < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND (enviado = 1 OR intentos >= maximo_intentos)
    `;

    try {
      const result = await query(query, [dias]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al limpiar correos antiguos: ${error.message}`);
    }
  }

  /**
   * Exportar correos programados a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      fecha_inicio = null, 
      fecha_fin = null,
      enviado = null,
      plantilla_id = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('cp.fecha_programada >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('cp.fecha_programada <= ?');
      params.push(fecha_fin);
    }

    if (enviado !== null) {
      whereConditions.push('cp.enviado = ?');
      params.push(enviado);
    }

    if (plantilla_id) {
      whereConditions.push('cp.plantilla_id = ?');
      params.push(plantilla_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT cp.id, cp.destinatario, cp.asunto, cp.fecha_programada, cp.enviado, 
             cp.intentos, cp.maximo_intentos, cp.created_at,
             pc.nombre as plantilla_nombre, pc.tipo as plantilla_tipo,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             c.fecha_hora_inicio as cita_fecha,
             ec.nombre as estado_cita
      FROM correos_programados cp
      JOIN plantillas_correo pc ON cp.plantilla_id = pc.id
      LEFT JOIN citas c ON cp.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      ${whereClause}
      ORDER BY cp.fecha_programada DESC
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar correos programados: ${error.message}`);
    }
  }
}

module.exports = CorreoProgramado; 