const { query } = require('../config/database');

/**
 * Modelo para la gestión de relaciones empleado-especialidad
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de especialidades
 */
class EmpleadoEspecialidad {
  /**
   * Crear una nueva relación empleado-especialidad
   * @param {Object} relacion - Datos de la relación
   * @returns {Promise<Object>} Relación creada
   */
  static async crear(relacion) {
    const {
      empleado_id,
      especialidad_id,
      nivel = 'Intermedio'
    } = relacion;

    // Verificar que la relación no exista
    const existente = await this.obtenerPorEmpleadoEspecialidad(empleado_id, especialidad_id);
    if (existente) {
      throw new Error('El empleado ya tiene esta especialidad asignada');
    }

    const sql = `
      INSERT INTO empleado_especialidad (empleado_id, especialidad_id, nivel)
      VALUES (?, ?, ?)
    `;

    try {
      const result = await query(sql, [empleado_id, especialidad_id, nivel]);
      return this.obtenerPorId(empleado_id, especialidad_id);
    } catch (error) {
      throw new Error(`Error al crear relación empleado-especialidad: ${error.message}`);
    }
  }

  /**
   * Obtener relación por IDs
   * @param {number} empleado_id - ID del empleado
   * @param {number} especialidad_id - ID de la especialidad
   * @returns {Promise<Object|null>} Relación encontrada
   */
  static async obtenerPorId(empleado_id, especialidad_id) {
    const sql = `
      SELECT ee.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             es.nombre as especialidad_nombre,
             es.descripcion as especialidad_descripcion
      FROM empleado_especialidad ee
      JOIN empleados e ON ee.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN especialidades es ON ee.especialidad_id = es.id
      WHERE ee.empleado_id = ? AND ee.especialidad_id = ?
    `;

    try {
      const rows = await query(sql, [empleado_id, especialidad_id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener relación empleado-especialidad: ${error.message}`);
    }
  }

  /**
   * Obtener relación por empleado y especialidad
   * @param {number} empleado_id - ID del empleado
   * @param {number} especialidad_id - ID de la especialidad
   * @returns {Promise<Object|null>} Relación encontrada
   */
  static async obtenerPorEmpleadoEspecialidad(empleado_id, especialidad_id) {
    return await this.obtenerPorId(empleado_id, especialidad_id);
  }

  /**
   * Obtener todas las relaciones con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de relaciones y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      empleado_id = null,
      especialidad_id = null,
      nivel = null,
      orden = 'empleado_id',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (empleado_id) {
      whereConditions.push('ee.empleado_id = ?');
      params.push(empleado_id);
    }

    if (especialidad_id) {
      whereConditions.push('ee.especialidad_id = ?');
      params.push(especialidad_id);
    }

    if (nivel) {
      whereConditions.push('ee.nivel = ?');
      params.push(nivel);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT ee.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             es.nombre as especialidad_nombre,
             es.descripcion as especialidad_descripcion
      FROM empleado_especialidad ee
      JOIN empleados e ON ee.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN especialidades es ON ee.especialidad_id = es.id
      ${whereClause}
      ORDER BY ee.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM empleado_especialidad ee
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        relaciones: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener relaciones empleado-especialidad: ${error.message}`);
    }
  }

  /**
   * Actualizar relación
   * @param {number} empleado_id - ID del empleado
   * @param {number} especialidad_id - ID de la especialidad
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Relación actualizada
   */
  static async actualizar(empleado_id, especialidad_id, datos) {
    const camposPermitidos = ['nivel'];
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

    valores.push(empleado_id, especialidad_id);
    const sql = `
      UPDATE empleado_especialidad 
      SET ${camposActualizar.join(', ')}
      WHERE empleado_id = ? AND especialidad_id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Relación empleado-especialidad no encontrada');
      }

      return this.obtenerPorId(empleado_id, especialidad_id);
    } catch (error) {
      throw new Error(`Error al actualizar relación: ${error.message}`);
    }
  }

  /**
   * Eliminar relación
   * @param {number} empleado_id - ID del empleado
   * @param {number} especialidad_id - ID de la especialidad
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(empleado_id, especialidad_id) {
    const sql = 'DELETE FROM empleado_especialidad WHERE empleado_id = ? AND especialidad_id = ?';

    try {
      const result = await query(sql, [empleado_id, especialidad_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar relación: ${error.message}`);
    }
  }

  /**
   * Obtener especialidades por empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Especialidades del empleado
   */
  static async obtenerPorEmpleado(empleado_id, opciones = {}) {
    const { orden = 'especialidad_nombre ASC' } = opciones;

    const sql = `
      SELECT ee.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             es.nombre as especialidad_nombre,
             es.descripcion as especialidad_descripcion
      FROM empleado_especialidad ee
      JOIN empleados e ON ee.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN especialidades es ON ee.especialidad_id = es.id
      WHERE ee.empleado_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, [empleado_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener especialidades por empleado: ${error.message}`);
    }
  }

  /**
   * Obtener empleados por especialidad
   * @param {number} especialidad_id - ID de la especialidad
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Empleados de la especialidad
   */
  static async obtenerPorEspecialidad(especialidad_id, opciones = {}) {
    const { nivel = null, orden = 'empleado_nombre ASC' } = opciones;

    let whereConditions = ['ee.especialidad_id = ?'];
    let params = [especialidad_id];

    if (nivel) {
      whereConditions.push('ee.nivel = ?');
      params.push(nivel);
    }

    const sql = `
      SELECT ee.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             es.nombre as especialidad_nombre,
             es.descripcion as especialidad_descripcion
      FROM empleado_especialidad ee
      JOIN empleados e ON ee.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN especialidades es ON ee.especialidad_id = es.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener empleados por especialidad: ${error.message}`);
    }
  }

  /**
   * Obtener empleados por nivel
   * @param {string} nivel - Nivel de especialidad
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Empleados del nivel
   */
  static async obtenerPorNivel(nivel, opciones = {}) {
    const { especialidad_id = null, orden = 'empleado_nombre ASC' } = opciones;

    let whereConditions = ['ee.nivel = ?'];
    let params = [nivel];

    if (especialidad_id) {
      whereConditions.push('ee.especialidad_id = ?');
      params.push(especialidad_id);
    }

    const sql = `
      SELECT ee.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             es.nombre as especialidad_nombre,
             es.descripcion as especialidad_descripcion
      FROM empleado_especialidad ee
      JOIN empleados e ON ee.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN especialidades es ON ee.especialidad_id = es.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener empleados por nivel: ${error.message}`);
    }
  }

  /**
   * Buscar empleados por especialidad
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Empleados encontrados
   */
  static async buscarEmpleadosPorEspecialidad(texto, opciones = {}) {
    const { limite = 20 } = opciones;

    const sql = `
      SELECT ee.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             es.nombre as especialidad_nombre,
             es.descripcion as especialidad_descripcion
      FROM empleado_especialidad ee
      JOIN empleados e ON ee.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN especialidades es ON ee.especialidad_id = es.id
      WHERE es.nombre LIKE ? 
         OR es.descripcion LIKE ?
         OR CONCAT(eu.nombre, ' ', eu.apellido) LIKE ?
         OR e.titulo LIKE ?
      ORDER BY es.nombre ASC, eu.nombre ASC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar empleados por especialidad: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de especialidades
   * @returns {Promise<Object>} Estadísticas de especialidades
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_relaciones,
        COUNT(DISTINCT empleado_id) as empleados_con_especialidades,
        COUNT(DISTINCT especialidad_id) as especialidades_asignadas,
        COUNT(CASE WHEN nivel = 'Principiante' THEN 1 END) as principiantes,
        COUNT(CASE WHEN nivel = 'Intermedio' THEN 1 END) as intermedios,
        COUNT(CASE WHEN nivel = 'Avanzado' THEN 1 END) as avanzados,
        COUNT(CASE WHEN nivel = 'Experto' THEN 1 END) as expertos
      FROM empleado_especialidad
    `;

    try {
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por especialidad
   * @returns {Promise<Array>} Estadísticas por especialidad
   */
  static async obtenerEstadisticasPorEspecialidad() {
    const sql = `
      SELECT es.id,
             es.nombre as especialidad_nombre,
             COUNT(ee.empleado_id) as total_empleados,
             COUNT(CASE WHEN ee.nivel = 'Principiante' THEN 1 END) as principiantes,
             COUNT(CASE WHEN ee.nivel = 'Intermedio' THEN 1 END) as intermedios,
             COUNT(CASE WHEN ee.nivel = 'Avanzado' THEN 1 END) as avanzados,
             COUNT(CASE WHEN ee.nivel = 'Experto' THEN 1 END) as expertos
      FROM especialidades es
      LEFT JOIN empleado_especialidad ee ON es.id = ee.especialidad_id
      GROUP BY es.id
      ORDER BY total_empleados DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por especialidad: ${error.message}`);
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
        COUNT(*) as total_especialidades,
        COUNT(CASE WHEN nivel = 'Principiante' THEN 1 END) as principiantes,
        COUNT(CASE WHEN nivel = 'Intermedio' THEN 1 END) as intermedios,
        COUNT(CASE WHEN nivel = 'Avanzado' THEN 1 END) as avanzados,
        COUNT(CASE WHEN nivel = 'Experto' THEN 1 END) as expertos
      FROM empleado_especialidad
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
   * Asignar múltiples especialidades a un empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Array} especialidades - Array de especialidades con nivel
   * @returns {Promise<Array>} Especialidades asignadas
   */
  static async asignarEspecialidades(empleado_id, especialidades) {
    const especialidadesAsignadas = [];

    for (const especialidad of especialidades) {
      try {
        const especialidadAsignada = await this.crear({
          empleado_id,
          especialidad_id: especialidad.especialidad_id,
          nivel: especialidad.nivel || 'Intermedio'
        });
        especialidadesAsignadas.push(especialidadAsignada);
      } catch (error) {
        console.error(`Error al asignar especialidad ${especialidad.especialidad_id}:`, error);
      }
    }

    return especialidadesAsignadas;
  }

  /**
   * Eliminar todas las especialidades de un empleado
   * @param {number} empleado_id - ID del empleado
   * @returns {Promise<number>} Cantidad de especialidades eliminadas
   */
  static async eliminarEspecialidadesEmpleado(empleado_id) {
    const sql = 'DELETE FROM empleado_especialidad WHERE empleado_id = ?';

    try {
      const result = await query(sql, [empleado_id]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al eliminar especialidades del empleado: ${error.message}`);
    }
  }

  /**
   * Obtener niveles disponibles
   * @returns {Array} Niveles disponibles
   */
  static obtenerNiveles() {
    return ['Principiante', 'Intermedio', 'Avanzado', 'Experto'];
  }

  /**
   * Exportar relaciones a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      empleado_id = null,
      especialidad_id = null,
      nivel = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (empleado_id) {
      whereConditions.push('ee.empleado_id = ?');
      params.push(empleado_id);
    }

    if (especialidad_id) {
      whereConditions.push('ee.especialidad_id = ?');
      params.push(especialidad_id);
    }

    if (nivel) {
      whereConditions.push('ee.nivel = ?');
      params.push(nivel);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT ee.empleado_id, ee.especialidad_id, ee.nivel, ee.created_at,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             es.nombre as especialidad_nombre,
             es.descripcion as especialidad_descripcion
      FROM empleado_especialidad ee
      JOIN empleados e ON ee.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN especialidades es ON ee.especialidad_id = es.id
      ${whereClause}
      ORDER BY eu.nombre, es.nombre
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar relaciones: ${error.message}`);
    }
  }
}

module.exports = EmpleadoEspecialidad; 