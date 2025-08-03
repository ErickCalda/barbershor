const { query } = require('../config/database');

/**
 * Modelo para la gestión de ausencias de empleados
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de ausencias
 */
class AusenciaEmpleado {
  /**
   * Crear una nueva ausencia de empleado
   * @param {Object} ausencia - Datos de la ausencia
   * @returns {Promise<Object>} Ausencia creada
   */
  static async crear(ausencia) {
    const {
      empleado_id,
      fecha_inicio,
      fecha_fin,
      motivo,
      descripcion = null
    } = ausencia;

    // Validar que la fecha de inicio sea menor que la fecha de fin
    if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
      throw new Error('La fecha de inicio debe ser menor que la fecha de fin');
    }

    // Validar que el motivo sea válido
    const motivosValidos = ['Vacaciones', 'Enfermedad', 'Permiso', 'Otro'];
    if (!motivosValidos.includes(motivo)) {
      throw new Error('Motivo no válido');
    }

    const sql = `
      INSERT INTO ausencias_empleados (empleado_id, fecha_inicio, fecha_fin, motivo, descripcion)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        empleado_id, fecha_inicio, fecha_fin, motivo, descripcion
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear ausencia: ${error.message}`);
    }
  }

  /**
   * Obtener ausencia por ID
   * @param {number} id - ID de la ausencia
   * @returns {Promise<Object|null>} Ausencia encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT ae.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             DATEDIFF(ae.fecha_fin, ae.fecha_inicio) + 1 as dias_ausencia
      FROM ausencias_empleados ae
      JOIN empleados e ON ae.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE ae.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener ausencia: ${error.message}`);
    }
  }

  /**
   * Obtener todas las ausencias con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de ausencias y metadatos
   */
static async obtenerTodas(opciones = {}) {
  let {
    pagina = 1,
    limite = 10,
    empleado_id = null,
    motivo = null,
    fecha_inicio = null,
    fecha_fin = null,
    aprobada = null,       // Nuevo filtro para aprobada
    orden = 'fecha_inicio',
    direccion = 'DESC'
  } = opciones;

  pagina = parseInt(pagina, 10) || 1;
  limite = parseInt(limite, 10) || 10;
  const offset = (pagina - 1) * limite;

  const camposPermitidosOrden = ['fecha_inicio', 'fecha_fin', 'motivo'];
  const direccionesPermitidas = ['ASC', 'DESC'];

  if (!camposPermitidosOrden.includes(orden)) orden = 'fecha_inicio';
  if (!direccionesPermitidas.includes(direccion.toUpperCase())) direccion = 'DESC';

  let whereConditions = [];
  let params = [];

  if (empleado_id) {
    whereConditions.push('ae.empleado_id = ?');
    params.push(empleado_id);
  }

  if (motivo) {
    whereConditions.push('ae.motivo = ?');
    params.push(motivo);
  }

  if (fecha_inicio) {
    whereConditions.push('ae.fecha_inicio >= ?');
    params.push(fecha_inicio);
  }

  if (fecha_fin) {
    whereConditions.push('ae.fecha_fin <= ?');
    params.push(fecha_fin);
  }

  if (aprobada !== null) {
    whereConditions.push('ae.aprobada = ?');
    params.push(aprobada);
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const sql = `
    SELECT 
      ae.id,
      ae.empleado_id,
      ae.fecha_inicio,
      ae.fecha_fin,
      ae.motivo,
      ae.descripcion,
      ae.aprobada,
      CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
      e.titulo as empleado_titulo,
      DATEDIFF(ae.fecha_fin, ae.fecha_inicio) + 1 as dias_ausencia
    FROM ausencias_empleados ae
    JOIN empleados e ON ae.empleado_id = e.id
    JOIN usuarios u ON e.usuario_id = u.id
    ${whereClause}
    ORDER BY ae.${orden} ${direccion}
    LIMIT ${limite} OFFSET ${offset}
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM ausencias_empleados ae
    ${whereClause}
  `;

  try {
    const rows = await query(sql, params);
    const countResult = await query(countQuery, params);

    return {
      ausencias: rows,
      paginacion: {
        pagina,
        limite,
        total: countResult[0].total,
        totalPaginas: Math.ceil(countResult[0].total / limite)
      }
    };
  } catch (error) {
    throw new Error(`Error al obtener ausencias: ${error.message}`);
  }
}


  /**
   * Actualizar ausencia
   * @param {number} id - ID de la ausencia
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Ausencia actualizada
   */
 static async actualizar(id, datos) {
  const camposPermitidos = ['empleado_id', 'fecha_inicio', 'fecha_fin', 'motivo', 'descripcion', 'aprobada'];
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

  if (datos.fecha_inicio !== undefined && datos.fecha_fin !== undefined) {
    if (new Date(datos.fecha_inicio) >= new Date(datos.fecha_fin)) {
      throw new Error('La fecha de inicio debe ser menor que la fecha de fin');
    }
  }

  valores.push(id);
  const sql = `
    UPDATE ausencias_empleados 
    SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  try {
    const result = await query(sql, valores);

    if (result.affectedRows === 0) {
      throw new Error('Ausencia no encontrada');
    }

    return this.obtenerPorId(id);
  } catch (error) {
    throw new Error(`Error al actualizar ausencia: ${error.message}`);
  }
}

  /**
   * Eliminar ausencia
   * @param {number} id - ID de la ausencia
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM ausencias_empleados WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar ausencia: ${error.message}`);
    }
  }

  /**
   * Obtener ausencias por empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Ausencias del empleado
   */
  static async obtenerPorEmpleado(empleado_id, opciones = {}) {
    const { orden = 'fecha_inicio DESC' } = opciones;

    const sql = `
      SELECT ae.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             DATEDIFF(ae.fecha_fin, ae.fecha_inicio) + 1 as dias_ausencia
      FROM ausencias_empleados ae
      JOIN empleados e ON ae.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE ae.empleado_id = ?
      ORDER BY ae.${orden}
    `;

    try {
      const rows = await query(sql, [empleado_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ausencias por empleado: ${error.message}`);
    }
  }

  /**
   * Obtener ausencias por motivo
   * @param {string} motivo - Motivo de la ausencia
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Ausencias del motivo
   */
  static async obtenerPorMotivo(motivo, opciones = {}) {
    const { orden = 'fecha_inicio DESC' } = opciones;

    const sql = `
      SELECT ae.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             DATEDIFF(ae.fecha_fin, ae.fecha_inicio) + 1 as dias_ausencia
      FROM ausencias_empleados ae
      JOIN empleados e ON ae.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE ae.motivo = ?
      ORDER BY ae.${orden}
    `;

    try {
      const rows = await query(sql, [motivo]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ausencias por motivo: ${error.message}`);
    }
  }

  /**
   * Obtener ausencias activas (en curso)
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Ausencias activas
   */
  static async obtenerActivas(opciones = {}) {
    const { orden = 'fecha_inicio ASC' } = opciones;

    const sql = `
      SELECT ae.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             DATEDIFF(ae.fecha_fin, ae.fecha_inicio) + 1 as dias_ausencia
      FROM ausencias_empleados ae
      JOIN empleados e ON ae.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE ae.fecha_inicio <= CURDATE() AND ae.fecha_fin >= CURDATE()
      ORDER BY ae.${orden}
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ausencias activas: ${error.message}`);
    }
  }

  /**
   * Obtener ausencias futuras
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Ausencias futuras
   */
  static async obtenerFuturas(opciones = {}) {
    const { orden = 'fecha_inicio ASC' } = opciones;

    const sql = `
      SELECT ae.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             DATEDIFF(ae.fecha_fin, ae.fecha_inicio) + 1 as dias_ausencia
      FROM ausencias_empleados ae
      JOIN empleados e ON ae.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE ae.fecha_inicio > CURDATE()
      ORDER BY ae.${orden}
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ausencias futuras: ${error.message}`);
    }
  }

  /**
   * Verificar si un empleado está ausente en una fecha
   * @param {number} empleado_id - ID del empleado
   * @param {Date} fecha - Fecha a verificar
   * @returns {Promise<Object|null>} Ausencia si existe
   */
  static async verificarAusencia(empleado_id, fecha) {
    const sql = `
      SELECT ae.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo
      FROM ausencias_empleados ae
      JOIN empleados e ON ae.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE ae.empleado_id = ?
        AND ? BETWEEN ae.fecha_inicio AND ae.fecha_fin
    `;

    try {
      const rows = await query(sql, [empleado_id, fecha]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al verificar ausencia: ${error.message}`);
    }
  }

  /**
   * Obtener empleados ausentes en una fecha
   * @param {Date} fecha - Fecha a verificar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Empleados ausentes
   */
  static async obtenerEmpleadosAusentes(fecha, opciones = {}) {
    const { motivo = null } = opciones;

    let whereConditions = ['? BETWEEN ae.fecha_inicio AND ae.fecha_fin'];
    let params = [fecha];

    if (motivo) {
      whereConditions.push('ae.motivo = ?');
      params.push(motivo);
    }

    const sql = `
      SELECT ae.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             DATEDIFF(ae.fecha_fin, ae.fecha_inicio) + 1 as dias_ausencia
      FROM ausencias_empleados ae
      JOIN empleados e ON ae.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY u.nombre, u.apellido
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener empleados ausentes: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de ausencias
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Estadísticas de ausencias
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('fecha_inicio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha_fin <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total_ausencias,
        COUNT(DISTINCT empleado_id) as empleados_con_ausencias,
        SUM(DATEDIFF(fecha_fin, fecha_inicio) + 1) as total_dias_ausencia,
        AVG(DATEDIFF(fecha_fin, fecha_inicio) + 1) as promedio_dias_por_ausencia,
        COUNT(CASE WHEN motivo = 'Vacaciones' THEN 1 END) as vacaciones,
        COUNT(CASE WHEN motivo = 'Enfermedad' THEN 1 END) as enfermedad,
        COUNT(CASE WHEN motivo = 'Permiso' THEN 1 END) as permisos,
        COUNT(CASE WHEN motivo = 'Otro' THEN 1 END) as otros
      FROM ausencias_empleados
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
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Estadísticas del empleado
   */
  static async obtenerEstadisticasEmpleado(empleado_id, opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = ['empleado_id = ?'];
    let params = [empleado_id];

    if (fecha_inicio) {
      whereConditions.push('fecha_inicio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha_fin <= ?');
      params.push(fecha_fin);
    }

    const sql = `
      SELECT 
        COUNT(*) as total_ausencias,
        SUM(DATEDIFF(fecha_fin, fecha_inicio) + 1) as total_dias_ausencia,
        AVG(DATEDIFF(fecha_fin, fecha_inicio) + 1) as promedio_dias_por_ausencia,
        COUNT(CASE WHEN motivo = 'Vacaciones' THEN 1 END) as vacaciones,
        COUNT(CASE WHEN motivo = 'Enfermedad' THEN 1 END) as enfermedad,
        COUNT(CASE WHEN motivo = 'Permiso' THEN 1 END) as permisos,
        COUNT(CASE WHEN motivo = 'Otro' THEN 1 END) as otros
      FROM ausencias_empleados
      WHERE ${whereConditions.join(' AND ')}
    `;

    try {
      const rows = await query(sql, params);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del empleado: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por motivo
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Estadísticas por motivo
   */
  static async obtenerEstadisticasPorMotivo(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('fecha_inicio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('fecha_fin <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        motivo,
        COUNT(*) as cantidad_ausencias,
        SUM(DATEDIFF(fecha_fin, fecha_inicio) + 1) as total_dias,
        AVG(DATEDIFF(fecha_fin, fecha_inicio) + 1) as promedio_dias
      FROM ausencias_empleados
      ${whereClause}
      GROUP BY motivo
      ORDER BY cantidad_ausencias DESC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por motivo: ${error.message}`);
    }
  }

  /**
   * Obtener motivos disponibles
   * @returns {Array} Motivos disponibles
   */
  static obtenerMotivos() {
    return ['Vacaciones', 'Enfermedad', 'Permiso', 'Otro'];
  }

  /**
   * Exportar ausencias a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      fecha_inicio = null, 
      fecha_fin = null,
      motivo = null,
      incluir_empleado = true 
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('ae.fecha_inicio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('ae.fecha_fin <= ?');
      params.push(fecha_fin);
    }

    if (motivo) {
      whereConditions.push('ae.motivo = ?');
      params.push(motivo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let sql = `
      SELECT ae.id, ae.fecha_inicio, ae.fecha_fin, ae.motivo, ae.descripcion,
             DATEDIFF(ae.fecha_fin, ae.fecha_inicio) + 1 as dias_ausencia
    `;

    if (incluir_empleado) {
      sql = `
        SELECT ae.id, ae.fecha_inicio, ae.fecha_fin, ae.motivo, ae.descripcion,
               DATEDIFF(ae.fecha_fin, ae.fecha_inicio) + 1 as dias_ausencia,
               CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
               e.titulo as empleado_titulo
      `;
    }

    sql += `
      FROM ausencias_empleados ae
      JOIN empleados e ON ae.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      ${whereClause}
      ORDER BY ae.fecha_inicio DESC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar ausencias: ${error.message}`);
    }
  }




  
}

module.exports = AusenciaEmpleado; 