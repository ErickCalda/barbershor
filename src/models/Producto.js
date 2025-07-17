const { query } = require('../config/database');

/**
 * Modelo para la gestión de productos
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de productos
 */
class Producto {
  /**
   * Crear un nuevo producto
   * @param {Object} producto - Datos del producto
   * @returns {Promise<Object>} Producto creado
   */
  static async crear(producto) {
    const {
      categoria_id,
      nombre,
      descripcion,
      marca,
      precio_compra,
      precio_venta,
      stock,
      stock_minimo,
      codigo_barras,
      imagen,
      activo = 1
    } = producto;

    const sql = `
      INSERT INTO productos (
        categoria_id, nombre, descripcion, marca, precio_compra, 
        precio_venta, stock, stock_minimo, codigo_barras, imagen, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        categoria_id, nombre, descripcion, marca, precio_compra,
        precio_venta, stock, stock_minimo, codigo_barras, imagen, activo
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  /**
   * Obtener producto por ID
   * @param {number} id - ID del producto
   * @returns {Promise<Object|null>} Producto encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT p.*, cp.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      WHERE p.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener producto: ${error.message}`);
    }
  }

  /**
   * Obtener todos los productos con paginación y filtros
   * @param {Object} opciones - Opciones de consulta
   * @returns {Promise<Object>} Productos y información de paginación
   */
  static async obtenerTodos(opciones = {}) {
    let {
      pagina = 1,
      limite = 10,
      orden = 'nombre',
      direccion = 'ASC',
      categoria_id,
      activo,
      busqueda
    } = opciones;

    // Validar y asegurar que sean números válidos
    let pageNum = parseInt(pagina);
    let limitNum = parseInt(limite);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(limitNum) || limitNum < 1) limitNum = 10;
    const offset = (pageNum - 1) * limitNum;

    const params = [];
    let whereClause = '';

    // Construir cláusula WHERE
    if (categoria_id) {
      whereClause += ' WHERE productos.categoria_id = ?';
      params.push(categoria_id);
    }
    if (activo !== undefined && activo !== null && activo !== '') {
      whereClause += whereClause ? ' AND productos.activo = ?' : ' WHERE productos.activo = ?';
      params.push(activo);
    }
    if (busqueda) {
      const busquedaClause = ' AND (productos.nombre LIKE ? OR productos.descripcion LIKE ? OR productos.marca LIKE ?)';
      whereClause += whereClause ? busquedaClause : ' WHERE (productos.nombre LIKE ? OR productos.descripcion LIKE ? OR productos.marca LIKE ?)';
      const busquedaParam = `%${busqueda}%`;
      params.push(busquedaParam, busquedaParam, busquedaParam);
    }

    const sql = `
      SELECT productos.id, productos.categoria_id, productos.nombre, productos.descripcion, productos.marca, productos.precio_compra, productos.precio_venta, productos.stock, productos.stock_minimo, productos.codigo_barras, productos.imagen, productos.activo, productos.created_at, productos.updated_at, categorias_productos.nombre as categoria_nombre
      FROM productos
      LEFT JOIN categorias_productos ON productos.categoria_id = categorias_productos.id
      ${whereClause}
      ORDER BY productos.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM productos
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limitNum, offset]);
      const countResult = await query(countSql, params);

      return {
        productos: rows,
        paginacion: {
          pagina: pageNum,
          limite: limitNum,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limitNum)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  /**
   * Actualizar producto
   * @param {number} id - ID del producto
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Producto actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'categoria_id', 'nombre', 'descripcion', 'marca', 'precio_compra',
      'precio_venta', 'stock', 'stock_minimo', 'codigo_barras', 'imagen', 'activo'
    ];

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
      UPDATE productos 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Producto no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  /**
   * Eliminar producto (marcar como inactivo)
   * @param {number} id - ID del producto
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'UPDATE productos SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  /**
   * Buscar productos por nombre o descripción
   * @param {string} termino - Término de búsqueda
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Productos encontrados
   */
  static async buscar(termino, limite = 10) {
    const sql = `
      SELECT p.*, cp.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      WHERE p.activo = 1 
        AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.marca LIKE ?)
      ORDER BY p.nombre
      LIMIT ?
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(sql, [busquedaParam, busquedaParam, busquedaParam, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar productos: ${error.message}`);
    }
  }

  /**
   * Obtener productos por categoría
   * @param {number} categoria_id - ID de la categoría
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Productos de la categoría
   */
  static async obtenerPorCategoria(categoria_id, opciones = {}) {
    const { activo = 1, orden = 'nombre' } = opciones;

    const sql = `
      SELECT p.*, cp.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      WHERE p.categoria_id = ? AND p.activo = ?
      ORDER BY p.${orden}
    `;

    try {
      const rows = await query(sql, [categoria_id, activo]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener productos por categoría: ${error.message}`);
    }
  }

  /**
   * Obtener productos con stock bajo
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Productos con stock bajo
   */
  static async obtenerConStockBajo(limite = 20) {
    const sql = `
      SELECT p.*, cp.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      WHERE p.activo = 1 AND p.stock <= p.stock_minimo
      ORDER BY p.stock ASC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener productos con stock bajo: ${error.message}`);
    }
  }

  /**
   * Actualizar stock de producto
   * @param {number} id - ID del producto
   * @param {number} cantidad - Cantidad a sumar/restar (negativo para restar)
   * @param {string} tipo - Tipo de operación ('suma' o 'resta')
   * @returns {Promise<Object>} Producto actualizado
   */
  static async actualizarStock(id, cantidad, tipo = 'suma') {
    const cantidadFinal = tipo === 'resta' ? -cantidad : cantidad;
    
    const sql = `
      UPDATE productos 
      SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND activo = 1
    `;

    try {
      const result = await query(sql, [cantidadFinal, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Producto no encontrado o inactivo');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar stock: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de productos
   * @returns {Promise<Object>} Estadísticas generales
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_productos,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as productos_activos,
        COUNT(CASE WHEN stock <= stock_minimo THEN 1 END) as productos_stock_bajo,
        SUM(stock) as stock_total,
        SUM(precio_venta * stock) as valor_inventario,
        AVG(precio_venta) as precio_promedio
      FROM productos
    `;

    try {
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener productos más vendidos
   * @param {number} limite - Límite de resultados
   * @param {string} periodo - Período de análisis (dias)
   * @returns {Promise<Array>} Productos más vendidos
   */
  static async obtenerMasVendidos(limite = 10, periodo = 30) {
    const sql = `
      SELECT 
        p.id,
        p.nombre,
        p.marca,
        p.precio_venta,
        SUM(dvp.cantidad) as total_vendido,
        SUM(dvp.subtotal) as ingresos_totales
      FROM productos p
      JOIN detalle_venta_producto dvp ON p.id = dvp.producto_id
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      WHERE p.activo = 1 
        AND vp.fecha_venta >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY p.id
      ORDER BY total_vendido DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [periodo, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener productos más vendidos: ${error.message}`);
    }
  }

  /**
   * Obtener historial de ventas de un producto
   * @param {number} producto_id - ID del producto
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Array>} Historial de ventas
   */
  static async obtenerHistorialVentas(producto_id, opciones = {}) {
    const { limite = 50, fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = ['dvp.producto_id = ?'];
    let params = [producto_id];

    if (fecha_inicio) {
      whereConditions.push('vp.fecha_venta >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('vp.fecha_venta <= ?');
      params.push(fecha_fin);
    }

    const sql = `
      SELECT 
        vp.id as venta_id,
        vp.fecha_venta,
        dvp.cantidad,
        dvp.precio_unitario,
        dvp.subtotal,
        CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
        CONCAT(emp.nombre, ' ', emp.apellido) as empleado_nombre
      FROM detalle_venta_producto dvp
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios emp ON e.usuario_id = emp.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY vp.fecha_venta DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener historial de ventas: ${error.message}`);
    }
  }

  /**
   * Verificar disponibilidad de stock
   * @param {number} producto_id - ID del producto
   * @param {number} cantidad - Cantidad requerida
   * @returns {Promise<boolean>} Disponibilidad
   */
  static async verificarDisponibilidad(producto_id, cantidad) {
    const sql = 'SELECT stock FROM productos WHERE id = ? AND activo = 1';

    try {
      const rows = await query(sql, [producto_id]);
      
      if (rows.length === 0) {
        return false;
      }

      return rows[0].stock >= cantidad;
    } catch (error) {
      throw new Error(`Error al verificar disponibilidad: ${error.message}`);
    }
  }

  /**
   * Obtener productos por código de barras
   * @param {string} codigo_barras - Código de barras
   * @returns {Promise<Object|null>} Producto encontrado
   */
  static async obtenerPorCodigoBarras(codigo_barras) {
    const sql = `
      SELECT p.*, cp.nombre as categoria_nombre
      FROM productos p
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      WHERE p.codigo_barras = ? AND p.activo = 1
    `;

    try {
      const rows = await query(sql, [codigo_barras]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener producto por código de barras: ${error.message}`);
    }
  }
}

module.exports = Producto; 