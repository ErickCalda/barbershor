const { query } = require('../config/database');

/**
 * Modelo para la gestión de categorías de servicios
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de categorías
 */
class CategoriaServicio {
  /**
   * Crear una nueva categoría de servicio
   * @param {Object} categoria - Datos de la categoría
   * @returns {Promise<Object>} Categoría creada
   */
  static async crear(categoria) {
    const { nombre, descripcion } = categoria;

    const sql = `
      INSERT INTO categorias_servicios (nombre, descripcion)
      VALUES (?, ?)
    `;

    try {
      const result = await query(sql, [nombre, descripcion]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear categoría de servicio: ${error.message}`);
    }
  }

  /**
   * Obtener categoría por ID
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object|null>} Categoría encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT cs.*, 
             COUNT(s.id) as total_servicios,
             COUNT(CASE WHEN s.activo = 1 THEN 1 END) as servicios_activos
      FROM categorias_servicios cs
      LEFT JOIN servicios s ON cs.id = s.categoria_id
      WHERE cs.id = ?
      GROUP BY cs.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener categoría: ${error.message}`);
    }
  }

  /**
   * Obtener todas las categorías
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Array>} Lista de categorías
   */
  static async obtenerTodas(opciones = {}) {
    const { incluirServicios = false, soloConServicios = false } = opciones;

    let whereClause = '';
    if (soloConServicios) {
      whereClause = 'HAVING total_servicios > 0';
    }

    const sql = `
      SELECT cs.*, 
             COUNT(s.id) as total_servicios,
             COUNT(CASE WHEN s.activo = 1 THEN 1 END) as servicios_activos
      FROM categorias_servicios cs
      LEFT JOIN servicios s ON cs.id = s.categoria_id
      GROUP BY cs.id
      ${whereClause}
      ORDER BY cs.nombre
    `;

    try {
      const rows = await query(sql);
      
      if (incluirServicios) {
        // Obtener servicios para cada categoría
        for (let categoria of rows) {
          categoria.servicios = await this.obtenerServiciosPorCategoria(categoria.id);
        }
      }

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }

  /**
   * Actualizar categoría
   * @param {number} id - ID de la categoría
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Categoría actualizada
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
      UPDATE categorias_servicios 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Categoría no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar categoría: ${error.message}`);
    }
  }

  /**
   * Eliminar categoría
   * @param {number} id - ID de la categoría
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    // Verificar si tiene servicios asociados
    const servicios = await this.obtenerServiciosPorCategoria(id);
    if (servicios.length > 0) {
      throw new Error('No se puede eliminar una categoría que tiene servicios asociados');
    }

    const sql = 'DELETE FROM categorias_servicios WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar categoría: ${error.message}`);
    }
  }

  /**
   * Buscar categorías por nombre
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Categorías encontradas
   */
  static async buscar(termino) {
    const sql = `
      SELECT cs.*, 
             COUNT(s.id) as total_servicios,
             COUNT(CASE WHEN s.activo = 1 THEN 1 END) as servicios_activos
      FROM categorias_servicios cs
      LEFT JOIN servicios s ON cs.id = s.categoria_id
      WHERE cs.nombre LIKE ? OR cs.descripcion LIKE ?
      GROUP BY cs.id
      ORDER BY cs.nombre
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(sql, [busquedaParam, busquedaParam]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar categorías: ${error.message}`);
    }
  }

  /**
   * Obtener servicios por categoría
   * @param {number} categoria_id - ID de la categoría
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Servicios de la categoría
   */
  static async obtenerServiciosPorCategoria(categoria_id, opciones = {}) {
    const { activo = null, orden = 'nombre' } = opciones;

    let whereConditions = ['s.categoria_id = ?'];
    let params = [categoria_id];

    if (activo !== null) {
      whereConditions.push('s.activo = ?');
      params.push(activo);
    }

    const sql = `
      SELECT s.*
      FROM servicios s
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY s.${orden}
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener servicios por categoría: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de categorías
   * @returns {Promise<Object>} Estadísticas de categorías
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_categorias,
        COUNT(CASE WHEN total_servicios > 0 THEN 1 END) as categorias_con_servicios,
        COUNT(CASE WHEN total_servicios = 0 THEN 1 END) as categorias_sin_servicios,
        AVG(total_servicios) as promedio_servicios_por_categoria,
        MAX(total_servicios) as max_servicios_por_categoria
      FROM (
        SELECT cs.id, COUNT(s.id) as total_servicios
        FROM categorias_servicios cs
        LEFT JOIN servicios s ON cs.id = s.categoria_id
        GROUP BY cs.id
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
   * Obtener categorías más populares
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Categorías más populares
   */
  static async obtenerMasPopulares(limite = 10) {
    const sql = `
      SELECT cs.*, 
             COUNT(s.id) as total_servicios,
             COUNT(CASE WHEN s.activo = 1 THEN 1 END) as servicios_activos
      FROM categorias_servicios cs
      LEFT JOIN servicios s ON cs.id = s.categoria_id
      GROUP BY cs.id
      HAVING total_servicios > 0
      ORDER BY total_servicios DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías populares: ${error.message}`);
    }
  }

  /**
   * Obtener categorías con servicios activos
   * @returns {Promise<Array>} Categorías con servicios activos
   */
  static async obtenerConServiciosActivos() {
    const sql = `
      SELECT cs.*, 
             COUNT(s.id) as total_servicios,
             COUNT(CASE WHEN s.activo = 1 THEN 1 END) as servicios_activos
      FROM categorias_servicios cs
      LEFT JOIN servicios s ON cs.id = s.categoria_id
      GROUP BY cs.id
      HAVING servicios_activos > 0
      ORDER BY cs.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías con servicios activos: ${error.message}`);
    }
  }

  /**
   * Verificar si una categoría existe
   * @param {string} nombre - Nombre de la categoría
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe la categoría
   */
  static async existe(nombre, excludeId = null) {
    let sql = 'SELECT COUNT(*) as total FROM categorias_servicios WHERE nombre = ?';
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
   * Obtener categorías vacías (sin servicios)
   * @returns {Promise<Array>} Categorías vacías
   */
  static async obtenerVacias() {
    const sql = `
      SELECT cs.*, 
             COUNT(s.id) as total_servicios
      FROM categorias_servicios cs
      LEFT JOIN servicios s ON cs.id = s.categoria_id
      GROUP BY cs.id
      HAVING total_servicios = 0
      ORDER BY cs.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías vacías: ${error.message}`);
    }
  }

  /**
   * Obtener resumen de categorías
   * @returns {Promise<Array>} Resumen de categorías
   */
  static async obtenerResumen() {
    const sql = `
      SELECT 
        cs.id,
        cs.nombre,
        COUNT(s.id) as total_servicios,
        COUNT(CASE WHEN s.activo = 1 THEN 1 END) as servicios_activos,
        AVG(s.precio) as precio_promedio,
        MIN(s.precio) as precio_minimo,
        MAX(s.precio) as precio_maximo
      FROM categorias_servicios cs
      LEFT JOIN servicios s ON cs.id = s.categoria_id
      GROUP BY cs.id
      ORDER BY cs.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener resumen: ${error.message}`);
    }
  }
}

module.exports = CategoriaServicio; 