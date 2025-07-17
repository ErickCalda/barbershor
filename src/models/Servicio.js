const { query } = require('../config/database');

/**
 * Modelo para la tabla servicios
 * Maneja todas las operaciones CRUD y consultas relacionadas con servicios
 */
class Servicio {
  /**
   * Crear un nuevo servicio
   * @param {Object} servicioData - Datos del servicio
   * @returns {Object} - Servicio creado
   */
  static async crear(servicioData) {
    try {
      const {
        nombre,
        descripcion,
        precio,
        duracion_minutos,
        categoria_id,
        imagen_url,
        activo = 1,
        destacado = 0,
        requiere_cita = 1,
        color_servicio,
        icono_servicio
      } = servicioData;

      const sql = `
        INSERT INTO servicios (
          nombre, descripcion, precio, duracion_minutos, categoria_id,
          imagen_url, activo, destacado, requiere_cita, color_servicio, icono_servicio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        nombre, descripcion, precio, duracion_minutos, categoria_id,
        imagen_url, activo, destacado, requiere_cita, color_servicio, icono_servicio
      ];

      const result = await query(sql, params);
      return { id: result.insertId, ...servicioData };
    } catch (error) {
      console.error('Error creando servicio:', error);
      throw error;
    }
  }

  /**
   * Obtener servicio por ID
   * @param {number} id - ID del servicio
   * @returns {Object|null} - Servicio encontrado o null
   */
  static async obtenerPorId(id) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre, cs.descripcion as categoria_descripcion
        FROM servicios s
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
        WHERE s.id = ?
      `;
      
      const servicios = await query(sql, [id]);
      return servicios.length > 0 ? servicios[0] : null;
    } catch (error) {
      console.error('Error obteniendo servicio por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener servicio por nombre
   * @param {string} nombre - Nombre del servicio
   * @returns {Object|null} - Servicio encontrado o null
   */
  static async obtenerPorNombre(nombre) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre
        FROM servicios s
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
        WHERE s.nombre = ? AND s.activo = 1
      `;
      
      const servicios = await query(sql, [nombre]);
      return servicios.length > 0 ? servicios[0] : null;
    } catch (error) {
      console.error('Error obteniendo servicio por nombre:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los servicios con filtros opcionales
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} - Lista de servicios
   */
  static async obtenerTodos(filtros = {}) {
    try {
      let sql = `
        SELECT s.*, cs.nombre as categoria_nombre, cs.descripcion as categoria_descripcion
        FROM servicios s
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
      `;
      
      const params = [];
      const condiciones = [];

      // Aplicar filtros
      if (filtros.activo !== undefined) {
        condiciones.push('s.activo = ?');
        params.push(filtros.activo);
      }

      if (filtros.categoria_id) {
        condiciones.push('s.categoria_id = ?');
        params.push(filtros.categoria_id);
      }

      if (filtros.destacado !== undefined) {
        condiciones.push('s.destacado = ?');
        params.push(filtros.destacado);
      }

      if (filtros.requiere_cita !== undefined) {
        condiciones.push('s.requiere_cita = ?');
        params.push(filtros.requiere_cita);
      }

      if (filtros.busqueda) {
        condiciones.push('(s.nombre LIKE ? OR s.descripcion LIKE ? OR cs.nombre LIKE ?)');
        const busqueda = `%${filtros.busqueda}%`;
        params.push(busqueda, busqueda, busqueda);
      }

      if (filtros.precio_min) {
        condiciones.push('s.precio >= ?');
        params.push(filtros.precio_min);
      }

      if (filtros.precio_max) {
        condiciones.push('s.precio <= ?');
        params.push(filtros.precio_max);
      }

      if (condiciones.length > 0) {
        sql += ' WHERE ' + condiciones.join(' AND ');
      }

      // Ordenamiento
      if (filtros.ordenar_por) {
        const ordenamientos = {
          'nombre': 's.nombre',
          'precio': 's.precio',

          
          'categoria': 'cs.nombre',
          'destacado': 's.destacado DESC, s.nombre'
        };
        
        const orden = ordenamientos[filtros.ordenar_por] || 's.nombre';
        sql += ` ORDER BY ${orden}`;
      } else {
        sql += ' ORDER BY s.nombre';
      }

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

      const servicios = await query(sql, params);
      return servicios;
    } catch (error) {
      console.error('Error obteniendo servicios:', error);
      throw error;
    }
  }

  /**
   * Actualizar servicio
   * @param {number} id - ID del servicio
   * @param {Object} servicioData - Datos a actualizar
   * @returns {boolean} - True si se actualizó correctamente
   */
  static async actualizar(id, servicioData) {
    try {
      const camposPermitidos = [
        'nombre', 'descripcion', 'precio', 'duracion_minutos', 'categoria_id',
        'imagen_url', 'activo', 'destacado', 'requiere_cita', 'color_servicio', 'icono_servicio'
      ];

      const camposActualizar = [];
      const valores = [];

      // Filtrar solo campos permitidos
      for (const campo of camposPermitidos) {
        if (servicioData[campo] !== undefined) {
          camposActualizar.push(`${campo} = ?`);
          valores.push(servicioData[campo]);
        }
      }

      if (camposActualizar.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      valores.push(id);
      const sql = `UPDATE servicios SET ${camposActualizar.join(', ')} WHERE id = ?`;
      
      const result = await query(sql, valores);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando servicio:', error);
      throw error;
    }
  }

  /**
   * Eliminar servicio (marcar como inactivo)
   * @param {number} id - ID del servicio
   * @returns {boolean} - True si se eliminó correctamente
   */
  static async eliminar(id) {
    try {
      const sql = 'UPDATE servicios SET activo = 0 WHERE id = ?';
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      throw error;
    }
  }

  /**
   * Verificar si existe un servicio por nombre
   * @param {string} nombre - Nombre a verificar
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {boolean} - True si existe
   */
  static async existePorNombre(nombre, excludeId = null) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM servicios WHERE nombre = ?';
      const params = [nombre];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const result = await query(sql, params);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error verificando existencia por nombre:', error);
      throw error;
    }
  }

  /**
   * Obtener servicios por categoría
   * @param {number} categoria_id - ID de la categoría
   * @returns {Array} - Lista de servicios de la categoría
   */
  static async obtenerPorCategoria(categoria_id) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre
        FROM servicios s
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
        WHERE s.categoria_id = ? AND s.activo = 1
        ORDER BY s.nombre
      `;

      const servicios = await query(sql, [categoria_id]);
      return servicios;
    } catch (error) {
      console.error('Error obteniendo servicios por categoría:', error);
      throw error;
    }
  }

  /**
   * Obtener servicios destacados
   * @param {number} limite - Número de servicios a retornar
   * @returns {Array} - Lista de servicios destacados
   */
  static async obtenerDestacados(limite = 10) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre
        FROM servicios s
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
        WHERE s.destacado = 1 AND s.activo = 1
        ORDER BY s.nombre
        LIMIT ?
      `;

      const servicios = await query(sql, [limite]);
      return servicios;
    } catch (error) {
      console.error('Error obteniendo servicios destacados:', error);
      throw error;
    }
  }

  /**
   * Obtener servicios más populares
   * @param {number} limite - Número de servicios a retornar
   * @returns {Array} - Lista de servicios más populares
   */
  static async obtenerPopulares(limite = 10) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre,
               COUNT(cs.cita_id) as total_citas
        FROM servicios s
        LEFT JOIN categorias_servicios cs_cat ON s.categoria_id = cs_cat.id
        LEFT JOIN cita_servicio cs ON s.id = cs.servicio_id
        WHERE s.activo = 1
        GROUP BY s.id
        HAVING total_citas > 0
        ORDER BY total_citas DESC
        LIMIT ?
      `;

      const servicios = await query(sql, [limite]);
      return servicios;
    } catch (error) {
      console.error('Error obteniendo servicios populares:', error);
      throw error;
    }
  }

  /**
   * Obtener servicios por empleado
   * @param {number} empleado_id - ID del empleado
   * @returns {Array} - Lista de servicios que puede realizar el empleado
   */
  static async obtenerPorEmpleado(empleado_id) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre, es.puede_realizar
        FROM servicios s
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
        INNER JOIN empleado_servicio es ON s.id = es.servicio_id
        WHERE es.empleado_id = ? AND es.puede_realizar = 1 AND s.activo = 1
        ORDER BY s.nombre
      `;

      const servicios = await query(sql, [empleado_id]);
      return servicios;
    } catch (error) {
      console.error('Error obteniendo servicios por empleado:', error);
      throw error;
    }
  }

  /**
   * Buscar servicios
   * @param {string} termino - Término de búsqueda
   * @returns {Array} - Lista de servicios que coinciden
   */
  static async buscar(termino) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre
        FROM servicios s
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
        WHERE s.activo = 1 AND (
          s.nombre LIKE ? OR 
          s.descripcion LIKE ? OR 
          cs.nombre LIKE ?
        )
        ORDER BY s.nombre
        LIMIT 20
      `;

      const busqueda = `%${termino}%`;
      const servicios = await query(sql, [busqueda, busqueda, busqueda]);
      return servicios;
    } catch (error) {
      console.error('Error buscando servicios:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de servicios
   * @returns {Object} - Estadísticas
   */
  static async obtenerEstadisticas() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_servicios,
          COUNT(CASE WHEN activo = 1 THEN 1 END) as servicios_activos,
          COUNT(CASE WHEN activo = 0 THEN 1 END) as servicios_inactivos,
          COUNT(CASE WHEN destacado = 1 THEN 1 END) as servicios_destacados,
          AVG(precio) as precio_promedio,
          MIN(precio) as precio_minimo,
          MAX(precio) as precio_maximo,
          AVG(duracion_minutos) as duracion_promedio_minutos
        FROM servicios
      `;

      const result = await query(sql);
      return result[0];
    } catch (error) {
      console.error('Error obteniendo estadísticas de servicios:', error);
      throw error;
    }
  }

  /**
   * Obtener servicios por rango de precio
   * @param {number} precioMin - Precio mínimo
   * @param {number} precioMax - Precio máximo
   * @returns {Array} - Lista de servicios en el rango
   */
  static async obtenerPorRangoPrecio(precioMin, precioMax) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre
        FROM servicios s
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
        WHERE s.activo = 1 AND s.precio BETWEEN ? AND ?
        ORDER BY s.precio, s.nombre
      `;

      const servicios = await query(sql, [precioMin, precioMax]);
      return servicios;
    } catch (error) {
      console.error('Error obteniendo servicios por rango de precio:', error);
      throw error;
    }
  }

  /**
   * Obtener servicios por duración
   * @param {number} duracionMin - Duración mínima en minutos
   * @param {number} duracionMax - Duración máxima en minutos
   * @returns {Array} - Lista de servicios en el rango de duración
   */
  static async obtenerPorDuracion(duracionMin, duracionMax) {
    try {
      const sql = `
        SELECT s.*, cs.nombre as categoria_nombre
        FROM servicios s
        LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
        WHERE s.activo = 1 AND s.duracion_minutos BETWEEN ? AND ?
        ORDER BY s.duracion_minutos, s.nombre
      `;

      const servicios = await query(sql, [duracionMin, duracionMax]);
      return servicios;
    } catch (error) {
      console.error('Error obteniendo servicios por duración:', error);
      throw error;
    }
  }

  /**
   * Asignar servicio a empleado
   * @param {number} servicio_id - ID del servicio
   * @param {number} empleado_id - ID del empleado
   * @param {boolean} puede_realizar - Si puede realizar el servicio
   * @returns {boolean} - True si se asignó correctamente
   */
  static async asignarAEmpleado(servicio_id, empleado_id, puede_realizar = true) {
    try {
      const sql = `
        INSERT INTO empleado_servicio (empleado_id, servicio_id, puede_realizar)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE puede_realizar = ?
      `;

      const result = await query(sql, [empleado_id, servicio_id, puede_realizar, puede_realizar]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error asignando servicio a empleado:', error);
      throw error;
    }
  }

  /**
   * Remover servicio de empleado
   * @param {number} servicio_id - ID del servicio
   * @param {number} empleado_id - ID del empleado
   * @returns {boolean} - True si se removió correctamente
   */
  static async removerDeEmpleado(servicio_id, empleado_id) {
    try {
      const sql = 'DELETE FROM empleado_servicio WHERE empleado_id = ? AND servicio_id = ?';
      const result = await query(sql, [empleado_id, servicio_id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error removiendo servicio de empleado:', error);
      throw error;
    }
  }
}

module.exports = Servicio; 