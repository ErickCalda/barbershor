const { query } = require('../config/database');

/**
 * Modelo para la tabla empleados
 * Maneja todas las operaciones CRUD y consultas relacionadas con empleados
 */
class Empleado {
  /**
   * Crear un nuevo empleado
   * @param {Object} empleadoData - Datos del empleado
   * @returns {Object} - Empleado creado
   */
  static async crear(empleadoData) {
    try {
      const {
        usuario_id,
        titulo,
        biografia,
        fecha_contratacion,
        numero_seguro_social,
        salario_base,
        comision_porcentaje = 0.00,
        activo = 1
      } = empleadoData;

      const sql = `
        INSERT INTO empleados (
          usuario_id, titulo, biografia, fecha_contratacion,
          numero_seguro_social, salario_base, comision_porcentaje, activo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        usuario_id, titulo, biografia, fecha_contratacion,
        numero_seguro_social, salario_base, comision_porcentaje, activo
      ];

      const result = await query(sql, params);
      return { id: result.insertId, ...empleadoData };
    } catch (error) {
      console.error('Error creando empleado:', error);
      throw error;
    }
  }

  /**
   * Obtener empleado por ID
   * @param {number} id - ID del empleado
   * @returns {Object|null} - Empleado encontrado o null
   */
  static async obtenerPorId(id) {
    try {
      const sql = `
        SELECT e.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil,
               u.activo, u.fecha_registro, u.ultimo_acceso,
               r.nombre as rol_nombre
        FROM empleados e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE e.id = ?
      `;
      
      const empleados = await query(sql, [id]);
      return empleados.length > 0 ? empleados[0] : null;
    } catch (error) {
      console.error('Error obteniendo empleado por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener empleado por usuario_id
   * @param {number} usuario_id - ID del usuario
   * @returns {Object|null} - Empleado encontrado o null
   */
  static async obtenerPorUsuarioId(usuario_id) {
    try {
      const sql = `
        SELECT e.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil,
               u.activo, u.fecha_registro, u.ultimo_acceso,
               r.nombre as rol_nombre
        FROM empleados e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE e.usuario_id = ?
      `;
      
      const empleados = await query(sql, [usuario_id]);
      return empleados.length > 0 ? empleados[0] : null;
    } catch (error) {
      console.error('Error obteniendo empleado por usuario_id:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los empleados con filtros opcionales
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} - Lista de empleados
   */
  static async obtenerTodos(filtros = {}) {
    try {
      let sql = `
SELECT e.*, 
       u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil,
       u.activo, u.fecha_registro, u.ultimo_acceso,
       u.rol_id,                            -- 👈 AÑADE ESTO
       r.nombre as rol_nombre
FROM empleados e
INNER JOIN usuarios u ON e.usuario_id = u.id
INNER JOIN roles r ON u.rol_id = r.id


      `;
      
      const params = [];
      const condiciones = [];

      // Aplicar filtros
      if (filtros.activo !== undefined) {
        condiciones.push('e.activo = ?');
        params.push(filtros.activo);
      }

      if (filtros.titulo) {
        condiciones.push('e.titulo LIKE ?');
        params.push(`%${filtros.titulo}%`);
      }

      if (filtros.busqueda) {
        condiciones.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ? OR e.titulo LIKE ?)');
        const busqueda = `%${filtros.busqueda}%`;
        params.push(busqueda, busqueda, busqueda, busqueda);
      }

      if (filtros.fecha_desde) {
        condiciones.push('e.fecha_contratacion >= ?');
        params.push(filtros.fecha_desde);
      }

      if (filtros.fecha_hasta) {
        condiciones.push('e.fecha_contratacion <= ?');
        params.push(filtros.fecha_hasta);
      }

      if (condiciones.length > 0) {
        sql += ' WHERE ' + condiciones.join(' AND ');
      }

      // Ordenamiento
      sql += ' ORDER BY u.nombre, u.apellido';

      // Paginación con validación
      if (filtros.limite) {
        const limiteNum = Math.max(1, Math.min(100, parseInt(filtros.limite) || 10));
        sql += ' LIMIT ?';
        params.push(limiteNum);
        
        if (filtros.offset) {
          const offsetNum = Math.max(0, parseInt(filtros.offset) || 0);
          sql += ' OFFSET ?';
          params.push(offsetNum);
        }
      }

      const empleados = await query(sql, params);
      return empleados;
    } catch (error) {
      console.error('Error obteniendo empleados:', error);
      throw error;
    }
  }

  /**
   * Actualizar empleado
   * @param {number} id - ID del empleado
   * @param {Object} empleadoData - Datos a actualizar
   * @returns {boolean} - True si se actualizó correctamente
   */
  static async actualizar(id, empleadoData) {
    try {
      const camposPermitidos = [
        'titulo', 'biografia', 'fecha_contratacion', 'numero_seguro_social',
        'salario_base', 'comision_porcentaje', 'activo'
      ];

      const camposActualizar = [];
      const valores = [];

      // Filtrar solo campos permitidos
      for (const campo of camposPermitidos) {
        if (empleadoData[campo] !== undefined) {
          camposActualizar.push(`${campo} = ?`);
          valores.push(empleadoData[campo]);
        }
      }

      if (camposActualizar.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      valores.push(id);
      const sql = `UPDATE empleados SET ${camposActualizar.join(', ')} WHERE id = ?`;
      
      const result = await query(sql, valores);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando empleado:', error);
      throw error;
    }
  }

  /**
   * Eliminar empleado (marcar como inactivo)
   * @param {number} id - ID del empleado
   * @returns {boolean} - True si se eliminó correctamente
   */
  static async eliminar(id) {
    try {
      const sql = 'UPDATE empleados SET activo = 0 WHERE id = ?';
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error eliminando empleado:', error);
      throw error;
    }
  }

  /**
   * Verificar si existe un empleado por usuario_id
   * @param {number} usuario_id - ID del usuario a verificar
   * @returns {boolean} - True si existe
   */
  static async existePorUsuarioId(usuario_id) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM empleados WHERE usuario_id = ?';
      const result = await query(sql, [usuario_id]);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error verificando existencia por usuario_id:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de empleados
   * @returns {Object} - Estadísticas
   */
  static async obtenerEstadisticas() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_empleados,
          COUNT(CASE WHEN e.activo = 1 THEN 1 END) as empleados_activos,
          COUNT(CASE WHEN e.activo = 0 THEN 1 END) as empleados_inactivos,
          AVG(e.salario_base) as salario_promedio,
          AVG(e.comision_porcentaje) as comision_promedio,
          COUNT(CASE WHEN e.fecha_contratacion >= DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN 1 END) as empleados_nuevos_1año
        FROM empleados e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        WHERE u.activo = 1
      `;

      const result = await query(sql);
      return result[0];
    } catch (error) {
      console.error('Error obteniendo estadísticas de empleados:', error);
      throw error;
    }
  }

  /**
   * Obtener empleados por especialidad
   * @param {number} especialidad_id - ID de la especialidad
   * @returns {Array} - Lista de empleados con esa especialidad
   */
  static async obtenerPorEspecialidad(especialidad_id) {
    try {
      const sql = `
        SELECT e.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil,
               ee.nivel, esp.nombre as especialidad_nombre
        FROM empleados e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        INNER JOIN empleado_especialidad ee ON e.id = ee.empleado_id
        INNER JOIN especialidades esp ON ee.especialidad_id = esp.id
        WHERE ee.especialidad_id = ? AND e.activo = 1 AND u.activo = 1
        ORDER BY ee.nivel DESC, u.nombre, u.apellido
      `;

      const empleados = await query(sql, [especialidad_id]);
      return empleados;
    } catch (error) {
      console.error('Error obteniendo empleados por especialidad:', error);
      throw error;
    }
  }

  /**
   * Obtener empleados por servicio
   * @param {number} servicio_id - ID del servicio
   * @returns {Array} - Lista de empleados que pueden realizar el servicio
   */
  static async obtenerPorServicio(servicio_id) {
    try {
      const sql = `
        SELECT e.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil,
               es.puede_realizar
        FROM empleados e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        INNER JOIN empleado_servicio es ON e.id = es.empleado_id
        WHERE es.servicio_id = ? AND es.puede_realizar = 1 
        AND e.activo = 1 AND u.activo = 1
        ORDER BY u.nombre, u.apellido
      `;

      const empleados = await query(sql, [servicio_id]);
      return empleados;
    } catch (error) {
      console.error('Error obteniendo empleados por servicio:', error);
      throw error;
    }
  }

  /**
   * Obtener empleados disponibles en una fecha y hora
   * @param {Date} fecha - Fecha de la cita
   * @param {string} hora_inicio - Hora de inicio
   * @param {string} hora_fin - Hora de fin
   * @returns {Array} - Lista de empleados disponibles
   */
  static async obtenerDisponibles(fecha, hora_inicio, hora_fin) {
    try {
      const diaSemana = new Date(fecha).getDay() || 7; // 1=Lunes, 7=Domingo
      
      const sql = `
        SELECT DISTINCT e.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil
        FROM empleados e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        INNER JOIN horarios_empleados he ON e.id = he.empleado_id
        WHERE e.activo = 1 AND u.activo = 1
        AND he.dia_semana = ?
        AND he.es_descanso = 0
        AND he.hora_inicio <= ?
        AND he.hora_fin >= ?
        AND e.id NOT IN (
          SELECT DISTINCT c.empleado_id
          FROM citas c
          WHERE DATE(c.fecha_hora_inicio) = ?
          AND (
            (c.fecha_hora_inicio < ? AND c.fecha_hora_fin > ?) OR
            (c.fecha_hora_inicio < ? AND c.fecha_hora_fin > ?) OR
            (c.fecha_hora_inicio >= ? AND c.fecha_hora_fin <= ?)
          )
          AND c.estado_id NOT IN (SELECT id FROM estados_citas WHERE nombre IN ('Cancelada', 'No asistió'))
        )
        ORDER BY u.nombre, u.apellido
      `;

      const empleados = await query(sql, [
        diaSemana, hora_inicio, hora_fin, fecha, 
        hora_fin, hora_inicio, hora_inicio, hora_fin, hora_inicio, hora_fin
      ]);
      return empleados;
    } catch (error) {
      console.error('Error obteniendo empleados disponibles:', error);
      throw error;
    }
  }

  /**
   * Obtener empleados con más citas
   * @param {number} limite - Número de empleados a retornar
   * @param {string} periodo - Periodo de tiempo (mes, semana, dia)
   * @returns {Array} - Lista de empleados con más citas
   */
  static async obtenerConMasCitas(limite = 10, periodo = 'mes') {
    try {
      let fechaFiltro = '';
      switch (periodo) {
        case 'semana':
          fechaFiltro = 'AND c.fecha_hora_inicio >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          break;
        case 'dia':
          fechaFiltro = 'AND DATE(c.fecha_hora_inicio) = CURDATE()';
          break;
        default: // mes
          fechaFiltro = 'AND c.fecha_hora_inicio >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
      }

      const sql = `
        SELECT e.*, u.nombre, u.apellido, u.email, u.telefono,
               COUNT(c.id) as total_citas,
               COUNT(CASE WHEN c.estado_id IN (SELECT id FROM estados_citas WHERE nombre = 'Completada') THEN 1 END) as citas_completadas
        FROM empleados e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        LEFT JOIN citas c ON e.id = c.empleado_id
        WHERE e.activo = 1 AND u.activo = 1
        ${fechaFiltro}
        GROUP BY e.id
        ORDER BY total_citas DESC
        LIMIT ?
      `;

      const empleados = await query(sql, [limite]);
      return empleados;
    } catch (error) {
      console.error('Error obteniendo empleados con más citas:', error);
      throw error;
    }
  }

  /**
   * Buscar empleados
   * @param {string} termino - Término de búsqueda
   * @returns {Array} - Lista de empleados que coinciden
   */
  static async buscar(termino) {
    try {
      const sql = `
        SELECT e.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil
        FROM empleados e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        WHERE e.activo = 1 AND u.activo = 1 AND (
          u.nombre LIKE ? OR 
          u.apellido LIKE ? OR 
          u.email LIKE ? OR
          e.titulo LIKE ? OR
          CONCAT(u.nombre, ' ', u.apellido) LIKE ?
        )
        ORDER BY u.nombre, u.apellido
        LIMIT 20
      `;

      const busqueda = `%${termino}%`;
      const empleados = await query(sql, [busqueda, busqueda, busqueda, busqueda, busqueda]);
      return empleados;
    } catch (error) {
      console.error('Error buscando empleados:', error);
      throw error;
    }
  }

  /**
   * Obtener especialidades de un empleado
   * @param {number} empleadoId - ID del empleado
   * @returns {Array} - Lista de especialidades
   */
  static async obtenerEspecialidades(empleadoId) {
    try {
      const sql = `
        SELECT esp.*, ee.nivel
        FROM especialidades esp
        INNER JOIN empleado_especialidad ee ON esp.id = ee.especialidad_id
        WHERE ee.empleado_id = ?
        ORDER BY ee.nivel DESC, esp.nombre
      `;

      const especialidades = await query(sql, [empleadoId]);
      return especialidades;
    } catch (error) {
      console.error('Error obteniendo especialidades del empleado:', error);
      throw error;
    }
  }

  /**
   * Obtener servicios de un empleado
   * @param {number} empleadoId - ID del empleado
   * @returns {Array} - Lista de servicios
   */
  static async obtenerServicios(empleadoId) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre, es.puede_realizar
        FROM servicios s
        INNER JOIN empleado_servicio es ON s.id = es.servicio_id
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
        WHERE es.empleado_id = ? AND es.puede_realizar = 1 AND s.activo = 1
        ORDER BY cs.nombre, s.nombre
      `;

      const servicios = await query(sql, [empleadoId]);
      return servicios;
    } catch (error) {
      console.error('Error obteniendo servicios del empleado:', error);
      throw error;
    }
  }

  /**
   * Obtener horarios de un empleado
   * @param {number} empleadoId - ID del empleado
   * @returns {Array} - Lista de horarios
   */
  static async obtenerHorarios(empleadoId) {
    try {
      const sql = `
        SELECT he.*, 
               CASE he.dia_semana 
                 WHEN 1 THEN 'Lunes'
                 WHEN 2 THEN 'Martes'
                 WHEN 3 THEN 'Miércoles'
                 WHEN 4 THEN 'Jueves'
                 WHEN 5 THEN 'Viernes'
                 WHEN 6 THEN 'Sábado'
                 WHEN 7 THEN 'Domingo'
               END as dia_nombre
        FROM horarios_empleados he
        WHERE he.empleado_id = ?
        ORDER BY he.dia_semana, he.hora_inicio
      `;

      const horarios = await query(sql, [empleadoId]);
      return horarios;
    } catch (error) {
      console.error('Error obteniendo horarios del empleado:', error);
      throw error;
    }
  }
}

module.exports = Empleado; 