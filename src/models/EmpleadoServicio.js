const { query } = require('../config/database');

/**
 * Modelo para la gestión de relaciones empleado-servicio
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de servicios por empleado
 */
class EmpleadoServicio {
  /**
   * Crear una nueva relación empleado-servicio
   * @param {Object} relacion - Datos de la relación
   * @returns {Promise<Object>} Relación creada
   */
  static async crear(relacion) {
    const {
      empleado_id,
      servicio_id,
      puede_realizar = 1
    } = relacion;

    // Verificar que la relación no exista
    const existente = await this.obtenerPorEmpleadoServicio(empleado_id, servicio_id);
    if (existente) {
      throw new Error('El empleado ya tiene este servicio asignado');
    }

    const query = `
      INSERT INTO empleado_servicio (empleado_id, servicio_id, puede_realizar)
      VALUES (?, ?, ?)
    `;

    try {
      const result = await query(query, [empleado_id, servicio_id, puede_realizar]);
      return this.obtenerPorId(empleado_id, servicio_id);
    } catch (error) {
      throw new Error(`Error al crear relación empleado-servicio: ${error.message}`);
    }
  }

  /**
   * Obtener relación por IDs
   * @param {number} empleado_id - ID del empleado
   * @param {number} servicio_id - ID del servicio
   * @returns {Promise<Object|null>} Relación encontrada
   */
  static async obtenerPorId(empleado_id, servicio_id) {
    const query = `
      SELECT es.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.descripcion as servicio_descripcion,
             s.precio as servicio_precio,
             s.duracion as servicio_duracion,
             cs.nombre as categoria_servicio
      FROM empleado_servicio es
      JOIN empleados e ON es.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON es.servicio_id = s.id
      LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
      WHERE es.empleado_id = ? AND es.servicio_id = ?
    `;

    try {
      const rows = await query(query, [empleado_id, servicio_id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener relación empleado-servicio: ${error.message}`);
    }
  }

  /**
   * Obtener relación por empleado y servicio
   * @param {number} empleado_id - ID del empleado
   * @param {number} servicio_id - ID del servicio
   * @returns {Promise<Object|null>} Relación encontrada
   */
  static async obtenerPorEmpleadoServicio(empleado_id, servicio_id) {
    return await this.obtenerPorId(empleado_id, servicio_id);
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
      servicio_id = null,
      puede_realizar = null,
      orden = 'empleado_id',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (empleado_id) {
      whereConditions.push('es.empleado_id = ?');
      params.push(empleado_id);
    }

    if (servicio_id) {
      whereConditions.push('es.servicio_id = ?');
      params.push(servicio_id);
    }

    if (puede_realizar !== null) {
      whereConditions.push('es.puede_realizar = ?');
      params.push(puede_realizar);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT es.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.descripcion as servicio_descripcion,
             s.precio as servicio_precio,
             s.duracion as servicio_duracion,
             cs.nombre as categoria_servicio
      FROM empleado_servicio es
      JOIN empleados e ON es.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON es.servicio_id = s.id
      LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
      ${whereClause}
      ORDER BY es.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM empleado_servicio es
      ${whereClause}
    `;

    try {
      const rows = await query(query, [...params, limite, offset]);
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
      throw new Error(`Error al obtener relaciones empleado-servicio: ${error.message}`);
    }
  }

  /**
   * Actualizar relación
   * @param {number} empleado_id - ID del empleado
   * @param {number} servicio_id - ID del servicio
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Relación actualizada
   */
  static async actualizar(empleado_id, servicio_id, datos) {
    const camposPermitidos = ['puede_realizar'];
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

    valores.push(empleado_id, servicio_id);
    const query = `
      UPDATE empleado_servicio 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE empleado_id = ? AND servicio_id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Relación empleado-servicio no encontrada');
      }

      return this.obtenerPorId(empleado_id, servicio_id);
    } catch (error) {
      throw new Error(`Error al actualizar relación: ${error.message}`);
    }
  }

  /**
   * Eliminar relación
   * @param {number} empleado_id - ID del empleado
   * @param {number} servicio_id - ID del servicio
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(empleado_id, servicio_id) {
    const query = 'DELETE FROM empleado_servicio WHERE empleado_id = ? AND servicio_id = ?';

    try {
      const result = await query(query, [empleado_id, servicio_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar relación: ${error.message}`);
    }
  }

  /**
   * Obtener servicios por empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Servicios del empleado
   */
  static async obtenerPorEmpleado(empleado_id, opciones = {}) {
    const { puede_realizar = null, orden = 'servicio_nombre ASC' } = opciones;

    let whereConditions = ['es.empleado_id = ?'];
    let params = [empleado_id];

    if (puede_realizar !== null) {
      whereConditions.push('es.puede_realizar = ?');
      params.push(puede_realizar);
    }

    const query = `
      SELECT es.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.descripcion as servicio_descripcion,
             s.precio as servicio_precio,
             s.duracion as servicio_duracion,
             cs.nombre as categoria_servicio
      FROM empleado_servicio es
      JOIN empleados e ON es.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON es.servicio_id = s.id
      LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener servicios por empleado: ${error.message}`);
    }
  }

  /**
   * Obtener empleados por servicio
   * @param {number} servicio_id - ID del servicio
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Empleados del servicio
   */
  static async obtenerPorServicio(servicio_id, opciones = {}) {
    const { puede_realizar = null, orden = 'empleado_nombre ASC' } = opciones;

    let whereConditions = ['es.servicio_id = ?'];
    let params = [servicio_id];

    if (puede_realizar !== null) {
      whereConditions.push('es.puede_realizar = ?');
      params.push(puede_realizar);
    }

    const query = `
      SELECT es.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.descripcion as servicio_descripcion,
             s.precio as servicio_precio,
             s.duracion as servicio_duracion,
             cs.nombre as categoria_servicio
      FROM empleado_servicio es
      JOIN empleados e ON es.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON es.servicio_id = s.id
      LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener empleados por servicio: ${error.message}`);
    }
  }

  /**
   * Obtener empleados disponibles para un servicio
   * @param {number} servicio_id - ID del servicio
   * @returns {Promise<Array>} Empleados disponibles
   */
  static async obtenerEmpleadosDisponibles(servicio_id) {
    const query = `
      SELECT es.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.descripcion as servicio_descripcion,
             s.precio as servicio_precio,
             s.duracion as servicio_duracion
      FROM empleado_servicio es
      JOIN empleados e ON es.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON es.servicio_id = s.id
      WHERE es.servicio_id = ? 
        AND es.puede_realizar = 1 
        AND e.activo = 1
      ORDER BY eu.nombre, eu.apellido
    `;

    try {
      const rows = await query(query, [servicio_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener empleados disponibles: ${error.message}`);
    }
  }

  /**
   * Buscar empleados por servicio
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Empleados encontrados
   */
  static async buscarEmpleadosPorServicio(texto, opciones = {}) {
    const { limite = 20 } = opciones;

    const query = `
      SELECT es.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.descripcion as servicio_descripcion,
             s.precio as servicio_precio,
             s.duracion as servicio_duracion,
             cs.nombre as categoria_servicio
      FROM empleado_servicio es
      JOIN empleados e ON es.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON es.servicio_id = s.id
      LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
      WHERE s.nombre LIKE ? 
         OR s.descripcion LIKE ?
         OR CONCAT(eu.nombre, ' ', eu.apellido) LIKE ?
         OR e.titulo LIKE ?
         OR cs.nombre LIKE ?
      ORDER BY s.nombre ASC, eu.nombre ASC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(query, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar empleados por servicio: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de servicios por empleado
   * @returns {Promise<Object>} Estadísticas de servicios
   */
  static async obtenerEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total_relaciones,
        COUNT(DISTINCT empleado_id) as empleados_con_servicios,
        COUNT(DISTINCT servicio_id) as servicios_asignados,
        COUNT(CASE WHEN puede_realizar = 1 THEN 1 END) as servicios_habilitados,
        COUNT(CASE WHEN puede_realizar = 0 THEN 1 END) as servicios_deshabilitados
      FROM empleado_servicio
    `;

    try {
      const rows = await query(query);
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
    const query = `
      SELECT 
        COUNT(*) as total_servicios,
        COUNT(CASE WHEN puede_realizar = 1 THEN 1 END) as servicios_habilitados,
        COUNT(CASE WHEN puede_realizar = 0 THEN 1 END) as servicios_deshabilitados,
        AVG(s.precio) as precio_promedio_servicios,
        SUM(s.duracion) as duracion_total_servicios
      FROM empleado_servicio es
      JOIN servicios s ON es.servicio_id = s.id
      WHERE es.empleado_id = ?
    `;

    try {
      const rows = await query(query, [empleado_id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas del empleado: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por servicio
   * @returns {Promise<Array>} Estadísticas por servicio
   */
  static async obtenerEstadisticasPorServicio() {
    const query = `
      SELECT s.id,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio,
             COUNT(es.empleado_id) as total_empleados,
             COUNT(CASE WHEN es.puede_realizar = 1 THEN 1 END) as empleados_habilitados,
             COUNT(CASE WHEN es.puede_realizar = 0 THEN 1 END) as empleados_deshabilitados
      FROM servicios s
      LEFT JOIN empleado_servicio es ON s.id = es.servicio_id
      GROUP BY s.id
      ORDER BY total_empleados DESC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por servicio: ${error.message}`);
    }
  }

  /**
   * Asignar múltiples servicios a un empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Array} servicios - Array de servicios con estado
   * @returns {Promise<Array>} Servicios asignados
   */
  static async asignarServicios(empleado_id, servicios) {
    const serviciosAsignados = [];

    for (const servicio of servicios) {
      try {
        const servicioAsignado = await this.crear({
          empleado_id,
          servicio_id: servicio.servicio_id,
          puede_realizar: servicio.puede_realizar !== undefined ? servicio.puede_realizar : 1
        });
        serviciosAsignados.push(servicioAsignado);
      } catch (error) {
        console.error(`Error al asignar servicio ${servicio.servicio_id}:`, error);
      }
    }

    return serviciosAsignados;
  }

  /**
   * Eliminar todos los servicios de un empleado
   * @param {number} empleado_id - ID del empleado
   * @returns {Promise<number>} Cantidad de servicios eliminados
   */
  static async eliminarServiciosEmpleado(empleado_id) {
    const query = 'DELETE FROM empleado_servicio WHERE empleado_id = ?';

    try {
      const result = await query(query, [empleado_id]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al eliminar servicios del empleado: ${error.message}`);
    }
  }

  /**
   * Habilitar/deshabilitar servicio para empleado
   * @param {number} empleado_id - ID del empleado
   * @param {number} servicio_id - ID del servicio
   * @param {boolean} puede_realizar - Estado del servicio
   * @returns {Promise<Object>} Relación actualizada
   */
  static async cambiarEstadoServicio(empleado_id, servicio_id, puede_realizar) {
    return await this.actualizar(empleado_id, servicio_id, { puede_realizar: puede_realizar ? 1 : 0 });
  }

  /**
   * Exportar relaciones a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      empleado_id = null,
      servicio_id = null,
      puede_realizar = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (empleado_id) {
      whereConditions.push('es.empleado_id = ?');
      params.push(empleado_id);
    }

    if (servicio_id) {
      whereConditions.push('es.servicio_id = ?');
      params.push(servicio_id);
    }

    if (puede_realizar !== null) {
      whereConditions.push('es.puede_realizar = ?');
      params.push(puede_realizar);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT es.empleado_id, es.servicio_id, es.puede_realizar, es.created_at,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             e.titulo as empleado_titulo,
             s.nombre as servicio_nombre,
             s.precio as servicio_precio,
             s.duracion as servicio_duracion,
             cs.nombre as categoria_servicio
      FROM empleado_servicio es
      JOIN empleados e ON es.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      JOIN servicios s ON es.servicio_id = s.id
      LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
      ${whereClause}
      ORDER BY eu.nombre, s.nombre
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar relaciones: ${error.message}`);
    }
  }
}

module.exports = EmpleadoServicio; 