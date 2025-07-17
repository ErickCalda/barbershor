const { query } = require('../config/database');

/**
 * Modelo para la gestión de horarios de empleados
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de horarios
 */
class HorarioEmpleado {
  /**
   * Crear un nuevo horario de empleado
   * @param {Object} horario - Datos del horario
   * @returns {Promise<Object>} Horario creado
   */
  static async crear(horario) {
    const {
      empleado_id,
      dia_semana,
      hora_inicio,
      hora_fin,
      es_descanso = 0
    } = horario;

    // Validar que la hora de inicio sea menor que la hora de fin
    if (hora_inicio >= hora_fin) {
      throw new Error('La hora de inicio debe ser menor que la hora de fin');
    }

    // Validar que el día de la semana esté entre 1 y 7
    if (dia_semana < 1 || dia_semana > 7) {
      throw new Error('El día de la semana debe estar entre 1 y 7');
    }

    const sql = `
      INSERT INTO horarios_empleados (empleado_id, dia_semana, hora_inicio, hora_fin, es_descanso)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        empleado_id, dia_semana, hora_inicio, hora_fin, es_descanso
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear horario: ${error.message}`);
    }
  }

  /**
   * Obtener horario por ID
   * @param {number} id - ID del horario
   * @returns {Promise<Object|null>} Horario encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT he.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo
      FROM horarios_empleados he
      JOIN empleados e ON he.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE he.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener horario: ${error.message}`);
    }
  }

  /**
   * Obtener todos los horarios con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de horarios y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      empleado_id = null,
      dia_semana = null,
      es_descanso = null,
      orden = 'empleado_id',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (empleado_id) {
      whereConditions.push('he.empleado_id = ?');
      params.push(empleado_id);
    }

    if (dia_semana) {
      whereConditions.push('he.dia_semana = ?');
      params.push(dia_semana);
    }

    if (es_descanso !== null) {
      whereConditions.push('he.es_descanso = ?');
      params.push(es_descanso);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT he.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo
      FROM horarios_empleados he
      JOIN empleados e ON he.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      ${whereClause}
      ORDER BY he.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM horarios_empleados he
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        horarios: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener horarios: ${error.message}`);
    }
  }

  /**
   * Actualizar horario
   * @param {number} id - ID del horario
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Horario actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['empleado_id', 'dia_semana', 'hora_inicio', 'hora_fin', 'es_descanso'];
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

    // Validar horas si se están actualizando
    if (datos.hora_inicio !== undefined && datos.hora_fin !== undefined) {
      if (datos.hora_inicio >= datos.hora_fin) {
        throw new Error('La hora de inicio debe ser menor que la hora de fin');
      }
    }

    valores.push(id);
    const sql = `
      UPDATE horarios_empleados 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Horario no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar horario: ${error.message}`);
    }
  }

  /**
   * Eliminar horario
   * @param {number} id - ID del horario
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM horarios_empleados WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar horario: ${error.message}`);
    }
  }

  /**
   * Obtener horarios por empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Horarios del empleado
   */
  static async obtenerPorEmpleado(empleado_id, opciones = {}) {
    const { orden = 'dia_semana ASC, hora_inicio ASC' } = opciones;

    const sql = `
      SELECT he.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo
      FROM horarios_empleados he
      JOIN empleados e ON he.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE he.empleado_id = ?
      ORDER BY he.${orden}
    `;

    try {
      const rows = await query(sql, [empleado_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener horarios por empleado: ${error.message}`);
    }
  }

  /**
   * Obtener horarios por día de la semana
   * @param {number} dia_semana - Día de la semana (1-7)
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Horarios del día
   */
  static async obtenerPorDia(dia_semana, opciones = {}) {
    const { es_descanso = null, orden = 'hora_inicio ASC' } = opciones;

    let whereConditions = ['he.dia_semana = ?'];
    let params = [dia_semana];

    if (es_descanso !== null) {
      whereConditions.push('he.es_descanso = ?');
      params.push(es_descanso);
    }

    const sql = `
      SELECT he.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo
      FROM horarios_empleados he
      JOIN empleados e ON he.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY he.${orden}
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener horarios por día: ${error.message}`);
    }
  }

  /**
   * Obtener horarios de descanso
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Horarios de descanso
   */
  static async obtenerDescansos(opciones = {}) {
    const { empleado_id = null, dia_semana = null } = opciones;

    let whereConditions = ['he.es_descanso = 1'];
    let params = [];

    if (empleado_id) {
      whereConditions.push('he.empleado_id = ?');
      params.push(empleado_id);
    }

    if (dia_semana) {
      whereConditions.push('he.dia_semana = ?');
      params.push(dia_semana);
    }

    const sql = `
      SELECT he.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo
      FROM horarios_empleados he
      JOIN empleados e ON he.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY he.dia_semana ASC, he.hora_inicio ASC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener descansos: ${error.message}`);
    }
  }

  /**
   * Verificar disponibilidad de empleado
   * @param {number} empleado_id - ID del empleado
   * @param {number} dia_semana - Día de la semana (1-7)
   * @param {string} hora_inicio - Hora de inicio
   * @param {string} hora_fin - Hora de fin
   * @returns {Promise<boolean>} Empleado disponible
   */
  static async verificarDisponibilidad(empleado_id, dia_semana, hora_inicio, hora_fin) {
    const sql = `
      SELECT COUNT(*) as total
      FROM horarios_empleados
      WHERE empleado_id = ? 
        AND dia_semana = ? 
        AND es_descanso = 0
        AND (
          (hora_inicio <= ? AND hora_fin > ?) OR
          (hora_inicio < ? AND hora_fin >= ?) OR
          (hora_inicio >= ? AND hora_fin <= ?)
        )
    `;

    try {
      const rows = await query(sql, [
        empleado_id, dia_semana, hora_inicio, hora_inicio, hora_fin, hora_fin, hora_inicio, hora_fin
      ]);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al verificar disponibilidad: ${error.message}`);
    }
  }

  /**
   * Obtener horarios semanales de empleado
   * @param {number} empleado_id - ID del empleado
   * @returns {Promise<Array>} Horarios semanales
   */
  static async obtenerHorarioSemanal(empleado_id) {
    const sql = `
      SELECT he.*,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo
      FROM horarios_empleados he
      JOIN empleados e ON he.empleado_id = e.id
      JOIN usuarios u ON e.usuario_id = u.id
      WHERE he.empleado_id = ?
      ORDER BY he.dia_semana ASC, he.hora_inicio ASC
    `;

    try {
      const rows = await query(sql, [empleado_id]);
      
      // Organizar por días de la semana
      const horarioSemanal = {
        1: [], // Lunes
        2: [], // Martes
        3: [], // Miércoles
        4: [], // Jueves
        5: [], // Viernes
        6: [], // Sábado
        7: []  // Domingo
      };

      rows.forEach(horario => {
        horarioSemanal[horario.dia_semana].push(horario);
      });

      return horarioSemanal;
    } catch (error) {
      throw new Error(`Error al obtener horario semanal: ${error.message}`);
    }
  }

  /**
   * Obtener empleados disponibles en un horario específico
   * @param {number} dia_semana - Día de la semana (1-7)
   * @param {string} hora_inicio - Hora de inicio
   * @param {string} hora_fin - Hora de fin
   * @returns {Promise<Array>} Empleados disponibles
   */
  static async obtenerEmpleadosDisponibles(dia_semana, hora_inicio, hora_fin) {
    const sql = `
      SELECT DISTINCT e.id,
             CONCAT(u.nombre, ' ', u.apellido) as empleado_nombre,
             e.titulo as empleado_titulo
      FROM empleados e
      JOIN usuarios u ON e.usuario_id = u.id
      JOIN horarios_empleados he ON e.id = he.empleado_id
      WHERE e.activo = 1
        AND he.dia_semana = ?
        AND he.es_descanso = 0
        AND he.hora_inicio <= ?
        AND he.hora_fin >= ?
      ORDER BY u.nombre, u.apellido
    `;

    try {
      const rows = await query(sql, [dia_semana, hora_inicio, hora_fin]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener empleados disponibles: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de horarios
   * @returns {Promise<Object>} Estadísticas de horarios
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_horarios,
        COUNT(DISTINCT empleado_id) as empleados_con_horario,
        COUNT(CASE WHEN es_descanso = 1 THEN 1 END) as total_descansos,
        COUNT(CASE WHEN es_descanso = 0 THEN 1 END) as total_trabajo,
        AVG(TIMESTAMPDIFF(MINUTE, hora_inicio, hora_fin)) as promedio_horas_por_dia,
        COUNT(CASE WHEN dia_semana = 1 THEN 1 END) as lunes,
        COUNT(CASE WHEN dia_semana = 2 THEN 1 END) as martes,
        COUNT(CASE WHEN dia_semana = 3 THEN 1 END) as miercoles,
        COUNT(CASE WHEN dia_semana = 4 THEN 1 END) as jueves,
        COUNT(CASE WHEN dia_semana = 5 THEN 1 END) as viernes,
        COUNT(CASE WHEN dia_semana = 6 THEN 1 END) as sabado,
        COUNT(CASE WHEN dia_semana = 7 THEN 1 END) as domingo
      FROM horarios_empleados
    `;

    try {
      const rows = await query(sql);
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
        COUNT(*) as total_horarios,
        COUNT(CASE WHEN es_descanso = 1 THEN 1 END) as total_descansos,
        COUNT(CASE WHEN es_descanso = 0 THEN 1 END) as total_trabajo,
        AVG(TIMESTAMPDIFF(MINUTE, hora_inicio, hora_fin)) as promedio_horas_por_dia,
        SUM(TIMESTAMPDIFF(MINUTE, hora_inicio, hora_fin)) as total_minutos_semana
      FROM horarios_empleados
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
   * Crear horario semanal completo
   * @param {number} empleado_id - ID del empleado
   * @param {Array} horarios - Array de horarios por día
   * @returns {Promise<Array>} Horarios creados
   */
  static async crearHorarioSemanal(empleado_id, horarios) {
    const horariosCreados = [];

    for (const horario of horarios) {
      try {
        const horarioCreado = await this.crear({
          empleado_id,
          dia_semana: horario.dia_semana,
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          es_descanso: horario.es_descanso || 0
        });
        horariosCreados.push(horarioCreado);
      } catch (error) {
        console.error(`Error al crear horario para día ${horario.dia_semana}:`, error);
      }
    }

    return horariosCreados;
  }

  /**
   * Eliminar horarios de empleado
   * @param {number} empleado_id - ID del empleado
   * @returns {Promise<number>} Cantidad de horarios eliminados
   */
  static async eliminarHorariosEmpleado(empleado_id) {
    const sql = 'DELETE FROM horarios_empleados WHERE empleado_id = ?';

    try {
      const result = await query(sql, [empleado_id]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al eliminar horarios del empleado: ${error.message}`);
    }
  }

  /**
   * Obtener nombres de días de la semana
   * @returns {Object} Mapeo de días
   */
  static obtenerNombresDias() {
    return {
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado',
      7: 'Domingo'
    };
  }
}

module.exports = HorarioEmpleado; 