const { query } = require('../config/database');

/**
 * Modelo para la gestión de categorías de productos
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de categorías
 */
class CategoriaProducto {
  /**
   * Crear una nueva categoría de producto
   * @param {Object} categoria - Datos de la categoría
   * @returns {Promise<Object>} Categoría creada
   */
  static async crear(categoria) {
    const { nombre, descripcion } = categoria;

    const sql = `
      INSERT INTO categorias_productos (nombre, descripcion)
      VALUES (?, ?)
    `;

    try {
      const result = await query(sql, [nombre, descripcion]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear categoría de producto: ${error.message}`);
    }
  }

  /**
   * Obtener categoría por ID
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object|null>} Categoría encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT cp.*, 
             COUNT(p.id) as total_productos,
             COUNT(CASE WHEN p.activo = 1 THEN 1 END) as productos_activos,
             SUM(p.stock) as stock_total,
             AVG(p.precio_venta) as precio_promedio
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      WHERE cp.id = ?
      GROUP BY cp.id
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
    const { incluirProductos = false, soloConProductos = false } = opciones;

    let whereClause = '';
    if (soloConProductos) {
      whereClause = 'HAVING total_productos > 0';
    }

    const sql = `
      SELECT cp.*, 
             COUNT(p.id) as total_productos,
             COUNT(CASE WHEN p.activo = 1 THEN 1 END) as productos_activos,
             SUM(p.stock) as stock_total,
             AVG(p.precio_venta) as precio_promedio
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      GROUP BY cp.id
      ${whereClause}
      ORDER BY cp.nombre
    `;

    try {
      const rows = await query(sql);
      
      if (incluirProductos) {
        // Obtener productos para cada categoría
        for (let categoria of rows) {
          categoria.productos = await this.obtenerProductosPorCategoria(categoria.id);
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
      UPDATE categorias_productos 
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
    // Verificar si tiene productos asociados
    const productos = await this.obtenerProductosPorCategoria(id);
    if (productos.length > 0) {
      throw new Error('No se puede eliminar una categoría que tiene productos asociados');
    }

    const sql = 'DELETE FROM categorias_productos WHERE id = ?';

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
      SELECT cp.*, 
             COUNT(p.id) as total_productos,
             COUNT(CASE WHEN p.activo = 1 THEN 1 END) as productos_activos
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      WHERE cp.nombre LIKE ? OR cp.descripcion LIKE ?
      GROUP BY cp.id
      ORDER BY cp.nombre
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
   * Obtener productos por categoría
   * @param {number} categoria_id - ID de la categoría
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Productos de la categoría
   */
  static async obtenerProductosPorCategoria(categoria_id, opciones = {}) {
    const { activo = null, orden = 'nombre', limite = null } = opciones;

    let whereConditions = ['p.categoria_id = ?'];
    let params = [categoria_id];

    if (activo !== null) {
      whereConditions.push('p.activo = ?');
      params.push(activo);
    }

    let limitClause = '';
    if (limite) {
      const limiteNum = Math.max(1, Math.min(100, parseInt(limite) || 10));
      limitClause = 'LIMIT ?';
      params.push(limiteNum);
    }

    const sql = `
      SELECT p.*
      FROM productos p
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY p.${orden}
      ${limitClause}
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener productos por categoría: ${error.message}`);
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
        COUNT(CASE WHEN total_productos > 0 THEN 1 END) as categorias_con_productos,
        COUNT(CASE WHEN total_productos = 0 THEN 1 END) as categorias_sin_productos,
        AVG(total_productos) as promedio_productos_por_categoria,
        MAX(total_productos) as max_productos_por_categoria,
        SUM(stock_total) as stock_total_general,
        AVG(precio_promedio) as precio_promedio_general
      FROM (
        SELECT cp.id, 
               COUNT(p.id) as total_productos,
               SUM(p.stock) as stock_total,
               AVG(p.precio_venta) as precio_promedio
        FROM categorias_productos cp
        LEFT JOIN productos p ON cp.id = p.categoria_id
        GROUP BY cp.id
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
      SELECT cp.*, 
             COUNT(p.id) as total_productos,
             COUNT(CASE WHEN p.activo = 1 THEN 1 END) as productos_activos,
             SUM(p.stock) as stock_total,
             AVG(p.precio_venta) as precio_promedio
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      GROUP BY cp.id
      HAVING total_productos > 0
      ORDER BY total_productos DESC
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
   * Obtener categorías con productos activos
   * @returns {Promise<Array>} Categorías con productos activos
   */
  static async obtenerConProductosActivos() {
    const sql = `
      SELECT cp.*, 
             COUNT(p.id) as total_productos,
             COUNT(CASE WHEN p.activo = 1 THEN 1 END) as productos_activos,
             SUM(p.stock) as stock_total,
             AVG(p.precio_venta) as precio_promedio
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      GROUP BY cp.id
      HAVING productos_activos > 0
      ORDER BY cp.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías con productos activos: ${error.message}`);
    }
  }

  /**
   * Obtener categorías con stock bajo
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Categorías con stock bajo
   */
  static async obtenerConStockBajo(limite = 10) {
    const sql = `
      SELECT cp.*, 
             COUNT(p.id) as total_productos,
             COUNT(CASE WHEN p.stock <= p.stock_minimo THEN 1 END) as productos_stock_bajo,
             SUM(p.stock) as stock_total
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      GROUP BY cp.id
      HAVING productos_stock_bajo > 0
      ORDER BY productos_stock_bajo DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías con stock bajo: ${error.message}`);
    }
  }

  /**
   * Verificar si una categoría existe
   * @param {string} nombre - Nombre de la categoría
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe la categoría
   */
  static async existe(nombre, excludeId = null) {
    let sql = 'SELECT COUNT(*) as total FROM categorias_productos WHERE nombre = ?';
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
   * Obtener categorías vacías (sin productos)
   * @returns {Promise<Array>} Categorías vacías
   */
  static async obtenerVacias() {
    const sql = `
      SELECT cp.*, 
             COUNT(p.id) as total_productos
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      GROUP BY cp.id
      HAVING total_productos = 0
      ORDER BY cp.nombre
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
        cp.id,
        cp.nombre,
        COUNT(p.id) as total_productos,
        COUNT(CASE WHEN p.activo = 1 THEN 1 END) as productos_activos,
        SUM(p.stock) as stock_total,
        AVG(p.precio_venta) as precio_promedio,
        MIN(p.precio_venta) as precio_minimo,
        MAX(p.precio_venta) as precio_maximo,
        COUNT(CASE WHEN p.stock <= p.stock_minimo THEN 1 END) as productos_stock_bajo
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      GROUP BY cp.id
      ORDER BY cp.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener resumen: ${error.message}`);
    }
  }

  /**
   * Obtener categorías por rango de precios
   * @param {number} precioMin - Precio mínimo
   * @param {number} precioMax - Precio máximo
   * @returns {Promise<Array>} Categorías en el rango de precios
   */
  static async obtenerPorRangoPrecios(precioMin, precioMax) {
    const sql = `
      SELECT cp.*, 
             COUNT(p.id) as total_productos,
             AVG(p.precio_venta) as precio_promedio
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      WHERE p.precio_venta BETWEEN ? AND ?
      GROUP BY cp.id
      ORDER BY precio_promedio
    `;

    try {
      const rows = await query(sql, [precioMin, precioMax]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías por rango de precios: ${error.message}`);
    }
  }

  /**
   * Obtener categorías con mayor valor de inventario
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Categorías con mayor valor de inventario
   */
  static async obtenerConMayorValorInventario(limite = 10) {
    const sql = `
      SELECT cp.*, 
             COUNT(p.id) as total_productos,
             SUM(p.stock * p.precio_venta) as valor_inventario,
             AVG(p.precio_venta) as precio_promedio
      FROM categorias_productos cp
      LEFT JOIN productos p ON cp.id = p.categoria_id
      GROUP BY cp.id
      HAVING valor_inventario > 0
      ORDER BY valor_inventario DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías con mayor valor de inventario: ${error.message}`);
    }
  }
}

module.exports = CategoriaProducto; 