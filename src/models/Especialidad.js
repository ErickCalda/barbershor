const { query } = require('../config/database');

/**
 * Modelo para la gestión de especialidades
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de especialidades
 */
class Especialidad {
  /**
   * Crear una nueva especialidad
   * @param {Object} especialidad - Datos de la especialidad
   * @returns {Promise<Object>} Especialidad creada
   */
  static async crear(especialidad) {
    const { nombre, descripcion } = especialidad;

    const sql = `
      INSERT INTO especialidades (nombre, descripcion)
      VALUES (?, ?)
    `;

    try {
      const result = await query(sql, [nombre, descripcion]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear especialidad: ${error.message}`);
    }
  }

  /**
   * Obtener especialidad por ID
   * @param {number} id - ID de la especialidad
   * @returns {Promise<Object|null>} Especialidad encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT e.*, 
             COUNT(ee.empleado_id) as total_empleados,
             COUNT(CASE WHEN ee.nivel = 'Experto' THEN 1 END) as empleados_expertos,
             COUNT(CASE WHEN ee.nivel = 'Avanzado' THEN 1 END) as empleados_avanzados,
             COUNT(CASE WHEN ee.nivel = 'Intermedio' THEN 1 END) as empleados_intermedios,
             COUNT(CASE WHEN ee.nivel = 'Principiante' THEN 1 END) as empleados_principiantes
      FROM especialidades e
      LEFT JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
      WHERE e.id = ?
      GROUP BY e.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener especialidad: ${error.message}`);
    }
  }

  /**
   * Obtener todas las especialidades
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Array>} Lista de especialidades
   */
  static async obtenerTodas(opciones = {}) {
    const { incluirEmpleados = false, soloConEmpleados = false } = opciones;

    let whereClause = '';
    if (soloConEmpleados) {
      whereClause = 'HAVING total_empleados > 0';
    }

    const sql = `
      SELECT e.*, 
             COUNT(ee.empleado_id) as total_empleados,
             COUNT(CASE WHEN ee.nivel = 'Experto' THEN 1 END) as empleados_expertos,
             COUNT(CASE WHEN ee.nivel = 'Avanzado' THEN 1 END) as empleados_avanzados,
             COUNT(CASE WHEN ee.nivel = 'Intermedio' THEN 1 END) as empleados_intermedios,
             COUNT(CASE WHEN ee.nivel = 'Principiante' THEN 1 END) as empleados_principiantes
      FROM especialidades e
      LEFT JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
      GROUP BY e.id
      ${whereClause}
      ORDER BY e.nombre
    `;

    try {
      const rows = await query(sql);
      
      if (incluirEmpleados) {
        // Obtener empleados para cada especialidad
        for (let especialidad of rows) {
          especialidad.empleados = await this.obtenerEmpleadosPorEspecialidad(especialidad.id);
        }
      }

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener especialidades: ${error.message}`);
    }
  }

  /**
   * Actualizar especialidad
   * @param {number} id - ID de la especialidad
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Especialidad actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['nombre', 'descripcion'];
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
      UPDATE especialidades 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Especialidad no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar especialidad: ${error.message}`);
    }
  }

  /**
   * Eliminar especialidad
   * @param {number} id - ID de la especialidad
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    // Verificar si tiene empleados asociados
    const empleados = await this.obtenerEmpleadosPorEspecialidad(id);
    if (empleados.length > 0) {
      throw new Error('No se puede eliminar una especialidad que tiene empleados asociados');
    }

    const sql = 'DELETE FROM especialidades WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar especialidad: ${error.message}`);
    }
  }

  /**
   * Buscar especialidades por nombre
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Especialidades encontradas
   */
  static async buscar(termino) {
    const sql = `
      SELECT e.*, 
             COUNT(ee.empleado_id) as total_empleados
      FROM especialidades e
      LEFT JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
      WHERE e.nombre LIKE ? OR e.descripcion LIKE ?
      GROUP BY e.id
      ORDER BY e.nombre
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(sql, [busquedaParam, busquedaParam]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar especialidades: ${error.message}`);
    }
  }

  /**
   * Obtener empleados por especialidad
   * @param {number} especialidad_id - ID de la especialidad
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Empleados de la especialidad
   */
  static async obtenerEmpleadosPorEspecialidad(especialidad_id, opciones = {}) {
    const { nivel = null, activo = null, orden = 'nombre' } = opciones;

    let whereConditions = ['ee.especialidad_id = ?'];
    let params = [especialidad_id];

    if (nivel) {
      whereConditions.push('ee.nivel = ?');
      params.push(nivel);
    }

    if (activo !== null) {
      whereConditions.push('e.activo = ?');
      params.push(activo);
    }

    const sql = `
      SELECT e.id, e.titulo, e.biografia, e.fecha_contratacion,
             CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
             u.foto_perfil, ee.nivel, ee.created_at as fecha_especialidad
      FROM empleados e
      JOIN usuarios u ON e.usuario_id = u.id
      JOIN empleado_especialidad ee ON e.id = ee.empleado_id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY u.${orden}
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener empleados por especialidad: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de especialidades
   * @returns {Promise<Object>} Estadísticas de especialidades
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_especialidades,
        COUNT(CASE WHEN total_empleados > 0 THEN 1 END) as especialidades_con_empleados,
        COUNT(CASE WHEN total_empleados = 0 THEN 1 END) as especialidades_sin_empleados,
        AVG(total_empleados) as promedio_empleados_por_especialidad,
        MAX(total_empleados) as max_empleados_por_especialidad,
        SUM(empleados_expertos) as total_expertos,
        SUM(empleados_avanzados) as total_avanzados,
        SUM(empleados_intermedios) as total_intermedios,
        SUM(empleados_principiantes) as total_principiantes
      FROM (
        SELECT e.id, 
               COUNT(ee.empleado_id) as total_empleados,
               COUNT(CASE WHEN ee.nivel = 'Experto' THEN 1 END) as empleados_expertos,
               COUNT(CASE WHEN ee.nivel = 'Avanzado' THEN 1 END) as empleados_avanzados,
               COUNT(CASE WHEN ee.nivel = 'Intermedio' THEN 1 END) as empleados_intermedios,
               COUNT(CASE WHEN ee.nivel = 'Principiante' THEN 1 END) as empleados_principiantes
        FROM especialidades e
        LEFT JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
        GROUP BY e.id
      ) as stats
    `;

    try {
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener especialidades más populares
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Especialidades más populares
   */
  static async obtenerMasPopulares(limite = 10) {
    const sql = `
      SELECT e.*, 
             COUNT(ee.empleado_id) as total_empleados,
             COUNT(CASE WHEN ee.nivel = 'Experto' THEN 1 END) as empleados_expertos,
             COUNT(CASE WHEN ee.nivel = 'Avanzado' THEN 1 END) as empleados_avanzados,
             COUNT(CASE WHEN ee.nivel = 'Intermedio' THEN 1 END) as empleados_intermedios,
             COUNT(CASE WHEN ee.nivel = 'Principiante' THEN 1 END) as empleados_principiantes
      FROM especialidades e
      LEFT JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
      GROUP BY e.id
      HAVING total_empleados > 0
      ORDER BY total_empleados DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener especialidades populares: ${error.message}`);
    }
  }

  /**
   * Obtener especialidades con empleados activos
   * @returns {Promise<Array>} Especialidades con empleados activos
   */
  static async obtenerConEmpleadosActivos() {
    const sql = `
      SELECT e.*, 
             COUNT(ee.empleado_id) as total_empleados,
             COUNT(CASE WHEN ee.nivel = 'Experto' THEN 1 END) as empleados_expertos,
             COUNT(CASE WHEN ee.nivel = 'Avanzado' THEN 1 END) as empleados_avanzados,
             COUNT(CASE WHEN ee.nivel = 'Intermedio' THEN 1 END) as empleados_intermedios,
             COUNT(CASE WHEN ee.nivel = 'Principiante' THEN 1 END) as empleados_principiantes
      FROM especialidades e
      LEFT JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
      LEFT JOIN empleados emp ON ee.empleado_id = emp.id
      GROUP BY e.id
      HAVING total_empleados > 0
      ORDER BY e.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener especialidades con empleados activos: ${error.message}`);
    }
  }

  /**
   * Verificar si una especialidad existe
   * @param {string} nombre - Nombre de la especialidad
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe la especialidad
   */
  static async existe(nombre, excludeId = null) {
    let sql = 'SELECT COUNT(*) as total FROM especialidades WHERE nombre = ?';
    let params = [nombre];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const rows = await query(sql, params);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al verificar existencia: ${error.message}`);
    }
  }

  /**
   * Obtener especialidades vacías (sin empleados)
   * @returns {Promise<Array>} Especialidades vacías
   */
  static async obtenerVacias() {
    const sql = `
      SELECT e.*, 
             COUNT(ee.empleado_id) as total_empleados
      FROM especialidades e
      LEFT JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
      GROUP BY e.id
      HAVING total_empleados = 0
      ORDER BY e.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener especialidades vacías: ${error.message}`);
    }
  }

  /**
   * Obtener especialidades por nivel
   * @param {string} nivel - Nivel de especialidad
   * @returns {Promise<Array>} Especialidades por nivel
   */
  static async obtenerPorNivel(nivel) {
    const nivelesValidos = ['Principiante', 'Intermedio', 'Avanzado', 'Experto'];
    
    if (!nivelesValidos.includes(nivel)) {
      throw new Error('Nivel de especialidad no válido');
    }

    const sql = `
      SELECT e.*, 
             COUNT(ee.empleado_id) as total_empleados,
             COUNT(CASE WHEN ee.nivel = ? THEN 1 END) as empleados_nivel
      FROM especialidades e
      LEFT JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
      GROUP BY e.id
      HAVING empleados_nivel > 0
      ORDER BY empleados_nivel DESC
    `;

    try {
      const rows = await query(sql, [nivel]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener especialidades por nivel: ${error.message}`);
    }
  }

  /**
   * Obtener resumen de especialidades
   * @returns {Promise<Array>} Resumen de especialidades
   */
  static async obtenerResumen() {
    const sql = `
      SELECT 
        e.id,
        e.nombre,
        e.descripcion,
        COUNT(ee.empleado_id) as total_empleados,
        COUNT(CASE WHEN ee.nivel = 'Experto' THEN 1 END) as expertos,
        COUNT(CASE WHEN ee.nivel = 'Avanzado' THEN 1 END) as avanzados,
        COUNT(CASE WHEN ee.nivel = 'Intermedio' THEN 1 END) as intermedios,
        COUNT(CASE WHEN ee.nivel = 'Principiante' THEN 1 END) as principiantes
      FROM especialidades e
      LEFT JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
      GROUP BY e.id
      ORDER BY e.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener resumen: ${error.message}`);
    }
  }

  /**
   * Asignar especialidad a empleado
   * @param {number} empleado_id - ID del empleado
   * @param {number} especialidad_id - ID de la especialidad
   * @param {string} nivel - Nivel de la especialidad
   * @returns {Promise<Object>} Asignación creada
   */
  static async asignarAEmpleado(empleado_id, especialidad_id, nivel = 'Intermedio') {
    const nivelesValidos = ['Principiante', 'Intermedio', 'Avanzado', 'Experto'];
    
    if (!nivelesValidos.includes(nivel)) {
      throw new Error('Nivel de especialidad no válido');
    }

    const sql = `
      INSERT INTO empleado_especialidad (empleado_id, especialidad_id, nivel)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE nivel = ?
    `;

    try {
      const result = await query(sql, [empleado_id, especialidad_id, nivel, nivel]);
      return { empleado_id, especialidad_id, nivel };
    } catch (error) {
      throw new Error(`Error al asignar especialidad: ${error.message}`);
    }
  }

  /**
   * Remover especialidad de empleado
   * @param {number} empleado_id - ID del empleado
   * @param {number} especialidad_id - ID de la especialidad
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async removerDeEmpleado(empleado_id, especialidad_id) {
    const sql = 'DELETE FROM empleado_especialidad WHERE empleado_id = ? AND especialidad_id = ?';

    try {
      const result = await query(sql, [empleado_id, especialidad_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al remover especialidad: ${error.message}`);
    }
  }

  /**
   * Obtener especialidades de un empleado
   * @param {number} empleado_id - ID del empleado
   * @returns {Promise<Array>} Especialidades del empleado
   */
  static async obtenerPorEmpleado(empleado_id) {
    const sql = `
      SELECT e.*, ee.nivel, ee.created_at as fecha_asignacion
      FROM especialidades e
      JOIN empleado_especialidad ee ON e.id = ee.especialidad_id
      WHERE ee.empleado_id = ?
      ORDER BY e.nombre
    `;

    try {
      const rows = await query(sql, [empleado_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener especialidades del empleado: ${error.message}`);
    }
  }
}

module.exports = Especialidad; 