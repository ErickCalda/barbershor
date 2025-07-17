const { query } = require('../config/database');

/**
 * Modelo para la gestión del historial de servicios de clientes
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas del historial
 */
class HistorialServicioCliente {
  /**
   * Crear un nuevo registro en el historial
   * @param {Object} historial - Datos del historial
   * @returns {Promise<Object>} Historial creado
   */
  static async crear(historial) {
    const {
      cliente_id,
      servicio_id,
      empleado_id,
      fecha,
      detalles = null,
      resultado = null,
      productos_usados = null,
      fotos_antes = null,
      fotos_despues = null
    } = historial;

    const sql = `
      INSERT INTO historial_servicios_cliente 
      (cliente_id, servicio_id, empleado_id, fecha, detalles, resultado, productos_usados, fotos_antes, fotos_despues)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        cliente_id, servicio_id, empleado_id, fecha, detalles, resultado, 
        productos_usados, fotos_antes, fotos_despues
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear historial: ${error.message}`);
    }
  }

  /**
   * Obtener historial por ID
   * @param {number} id - ID del historial
   * @returns {Promise<Object|null>} Historial encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT hsc.*,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             cu.email as cliente_email,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio
      FROM historial_servicios_cliente hsc
      JOIN clientes c ON hsc.cliente_id = c.id
      JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON hsc.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON hsc.servicio_id = s.id
      WHERE hsc.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener historial: ${error.message}`);
    }
  }

  /**
   * Obtener todos los registros del historial con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de historiales y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      cliente_id = null,
      empleado_id = null,
      servicio_id = null,
      fecha_inicio = null,
      fecha_fin = null,
      orden = 'fecha',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (cliente_id) {
      whereConditions.push('hsc.cliente_id = ?');
      params.push(cliente_id);
    }

    if (empleado_id) {
      whereConditions.push('hsc.empleado_id = ?');
      params.push(empleado_id);
    }

    if (servicio_id) {
      whereConditions.push('hsc.servicio_id = ?');
      params.push(servicio_id);
    }

    if (fecha_inicio) {
      whereConditions.push('hsc.fecha >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('hsc.fecha <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT hsc.*,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             cu.email as cliente_email,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio
      FROM historial_servicios_cliente hsc
      JOIN clientes c ON hsc.cliente_id = c.id
      JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON hsc.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON hsc.servicio_id = s.id
      ${whereClause}
      ORDER BY hsc.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM historial_servicios_cliente hsc
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        historiales: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener historiales: ${error.message}`);
    }
  }

  /**
   * Actualizar historial
   * @param {number} id - ID del historial
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Historial actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['detalles', 'resultado', 'productos_usados', 'fotos_antes', 'fotos_despues'];
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
      UPDATE historial_servicios_cliente 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Historial no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar historial: ${error.message}`);
    }
  }

  /**
   * Eliminar historial
   * @param {number} id - ID del historial
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM historial_servicios_cliente WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar historial: ${error.message}`);
    }
  }

  /**
   * Obtener historial por cliente
   * @param {number} cliente_id - ID del cliente
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Historial del cliente
   */
  static async obtenerPorCliente(cliente_id, opciones = {}) {
    const { orden = 'fecha DESC' } = opciones;

    const sql = `
      SELECT hsc.*,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             cu.email as cliente_email,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio
      FROM historial_servicios_cliente hsc
      JOIN clientes c ON hsc.cliente_id = c.id
      JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON hsc.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON hsc.servicio_id = s.id
      WHERE hsc.cliente_id = ?
      ORDER BY hsc.${orden}
    `;

    try {
      const rows = await query(sql, [cliente_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener historial por cliente: ${error.message}`);
    }
  }

  /**
   * Obtener historial por empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Historial del empleado
   */
  static async obtenerPorEmpleado(empleado_id, opciones = {}) {
    const { orden = 'fecha DESC' } = opciones;

    const sql = `
      SELECT hsc.*,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             cu.email as cliente_email,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio
      FROM historial_servicios_cliente hsc
      JOIN clientes c ON hsc.cliente_id = c.id
      JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON hsc.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON hsc.servicio_id = s.id
      WHERE hsc.empleado_id = ?
      ORDER BY hsc.${orden}
    `;

    try {
      const rows = await query(sql, [empleado_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener historial por empleado: ${error.message}`);
    }
  }

  /**
   * Obtener historial por servicio
   * @param {number} servicio_id - ID del servicio
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Historial del servicio
   */
  static async obtenerPorServicio(servicio_id, opciones = {}) {
    const { orden = 'fecha DESC' } = opciones;

    const sql = `
      SELECT hsc.*,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             cu.email as cliente_email,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio
      FROM historial_servicios_cliente hsc
      JOIN clientes c ON hsc.cliente_id = c.id
      JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON hsc.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON hsc.servicio_id = s.id
      WHERE hsc.servicio_id = ?
      ORDER BY hsc.${orden}
    `;

    try {
      const rows = await query(sql, [servicio_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener historial por servicio: ${error.message}`);
    }
  }

  /**
   * Obtener historial por rango de fechas
   * @param {Date} fecha_inicio - Fecha de inicio
   * @param {Date} fecha_fin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Historial del rango
   */
  static async obtenerPorRangoFechas(fecha_inicio, fecha_fin, opciones = {}) {
    const { orden = 'fecha DESC' } = opciones;

    const sql = `
      SELECT hsc.*,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             cu.email as cliente_email,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio
      FROM historial_servicios_cliente hsc
      JOIN clientes c ON hsc.cliente_id = c.id
      JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON hsc.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON hsc.servicio_id = s.id
      WHERE hsc.fecha >= ? AND hsc.fecha <= ?
      ORDER BY hsc.${orden}
    `;

    try {
      const rows = await query(sql, [fecha_inicio, fecha_fin]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener historial por rango de fechas: ${error.message}`);
    }
  }

  /**
   * Buscar en historial por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Historiales encontrados
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 50 } = opciones;

    const sql = `
      SELECT hsc.*,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             cu.email as cliente_email,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio
      FROM historial_servicios_cliente hsc
      JOIN clientes c ON hsc.cliente_id = c.id
      JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON hsc.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON hsc.servicio_id = s.id
      WHERE hsc.detalles LIKE ? 
         OR hsc.resultado LIKE ? 
         OR hsc.productos_usados LIKE ?
         OR CONCAT(cu.nombre, ' ', cu.apellido) LIKE ?
         OR CONCAT(eu.nombre, ' ', eu.apellido) LIKE ?
         OR s.nombre LIKE ?
      ORDER BY hsc.fecha DESC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar en historial: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas del historial
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Estadísticas del historial
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('fecha >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total_registros,
        COUNT(DISTINCT cliente_id) as clientes_unicos,
        COUNT(DISTINCT empleado_id) as empleados_unicos,
        COUNT(DISTINCT servicio_id) as servicios_unicos,
        COUNT(CASE WHEN fotos_antes IS NOT NULL THEN 1 END) as con_fotos_antes,
        COUNT(CASE WHEN fotos_despues IS NOT NULL THEN 1 END) as con_fotos_despues,
        COUNT(CASE WHEN productos_usados IS NOT NULL THEN 1 END) as con_productos,
        AVG(s.precio) as precio_promedio_servicio
      FROM historial_servicios_cliente hsc
      JOIN servicios s ON hsc.servicio_id = s.id
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
   * Obtener estadísticas por cliente
   * @param {number} cliente_id - ID del cliente
   * @returns {Promise<Object>} Estadísticas del cliente
   */
  static async obtenerEstadisticasCliente(cliente_id) {
    const sql = `
      SELECT 
        COUNT(*) as total_servicios,
        COUNT(DISTINCT servicio_id) as servicios_diferentes,
        COUNT(DISTINCT empleado_id) as empleados_diferentes,
        COUNT(CASE WHEN fotos_antes IS NOT NULL THEN 1 END) as con_fotos_antes,
        COUNT(CASE WHEN fotos_despues IS NOT NULL THEN 1 END) as con_fotos_despues,
        AVG(s.precio) as precio_promedio,
        SUM(s.precio) as gasto_total,
        MIN(fecha) as primera_visita,
        MAX(fecha) as ultima_visita
      FROM historial_servicios_cliente hsc
      JOIN servicios s ON hsc.servicio_id = s.id
      WHERE hsc.cliente_id = ?
    `;

    try {
      const rows = await query(sql, [cliente_id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del cliente: ${error.message}`);
    }
  }

  /**
   * Obtener servicios más realizados
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Servicios más realizados
   */
  static async obtenerServiciosMasRealizados(limite = 10) {
    const sql = `
      SELECT s.id,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio,
             COUNT(hsc.id) as veces_realizado,
             AVG(s.precio) as precio_promedio
      FROM historial_servicios_cliente hsc
      JOIN servicios s ON hsc.servicio_id = s.id
      GROUP BY s.id
      ORDER BY veces_realizado DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener servicios más realizados: ${error.message}`);
    }
  }

  /**
   * Obtener empleados más activos
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Empleados más activos
   */
  static async obtenerEmpleadosMasActivos(limite = 10) {
    const sql = `
      SELECT e.id,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             COUNT(hsc.id) as servicios_realizados,
             COUNT(DISTINCT hsc.cliente_id) as clientes_atendidos
      FROM historial_servicios_cliente hsc
      JOIN empleados e ON hsc.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      GROUP BY e.id
      ORDER BY servicios_realizados DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener empleados más activos: ${error.message}`);
    }
  }

  /**
   * Exportar historial a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      fecha_inicio = null, 
      fecha_fin = null,
      cliente_id = null,
      empleado_id = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('hsc.fecha >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('hsc.fecha <= ?');
      params.push(fecha_fin);
    }

    if (cliente_id) {
      whereConditions.push('hsc.cliente_id = ?');
      params.push(cliente_id);
    }

    if (empleado_id) {
      whereConditions.push('hsc.empleado_id = ?');
      params.push(empleado_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT hsc.id, hsc.fecha, hsc.detalles, hsc.resultado, hsc.productos_usados,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             cu.email as cliente_email,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio
      FROM historial_servicios_cliente hsc
      JOIN clientes c ON hsc.cliente_id = c.id
      JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON hsc.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON hsc.servicio_id = s.id
      ${whereClause}
      ORDER BY hsc.fecha DESC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar historial: ${error.message}`);
    }
  }
}

module.exports = HistorialServicioCliente; 