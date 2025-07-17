const { query } = require('../config/database');

/**
 * Modelo para la gestión de detalles de ventas de productos
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de detalles
 */
class DetalleVentaProducto {
  /**
   * Crear un nuevo detalle de venta
   * @param {Object} detalle - Datos del detalle
   * @returns {Promise<Object>} Detalle creado
   */
  static async crear(detalle) {
    const {
      venta_id,
      producto_id,
      cantidad,
      precio_unitario,
      descuento = 0.00
    } = detalle;

    // Calcular subtotal
    const subtotal = (precio_unitario * cantidad) - descuento;

    const sql = `
      INSERT INTO detalle_venta_producto (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal
      ]);
      return this.obtenerPorId(venta_id, producto_id);
    } catch (error) {
      throw new Error(`Error al crear detalle de venta: ${error.message}`);
    }
  }

  /**
   * Obtener detalle por IDs
   * @param {number} venta_id - ID de la venta
   * @param {number} producto_id - ID del producto
   * @returns {Promise<Object|null>} Detalle encontrado
   */
  static async obtenerPorId(venta_id, producto_id) {
    const sql = `
      SELECT dvp.*,
             p.nombre as producto_nombre,
             p.descripcion as producto_descripcion,
             p.marca as producto_marca,
             cp.nombre as categoria_producto,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             vp.fecha_venta,
             vp.total as venta_total
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      WHERE dvp.venta_id = ? AND dvp.producto_id = ?
    `;

    try {
      const rows = await query(sql, [venta_id, producto_id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener detalle de venta: ${error.message}`);
    }
  }

  /**
   * Obtener todos los detalles con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de detalles y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      venta_id = null,
      producto_id = null,
      fecha_inicio = null,
      fecha_fin = null,
      orden = 'venta_id',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (venta_id) {
      whereConditions.push('dvp.venta_id = ?');
      params.push(venta_id);
    }

    if (producto_id) {
      whereConditions.push('dvp.producto_id = ?');
      params.push(producto_id);
    }

    if (fecha_inicio) {
      whereConditions.push('vp.fecha_venta >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('vp.fecha_venta <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT dvp.*,
             p.nombre as producto_nombre,
             p.descripcion as producto_descripcion,
             p.marca as producto_marca,
             cp.nombre as categoria_producto,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             vp.fecha_venta,
             vp.total as venta_total
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      ${whereClause}
      ORDER BY dvp.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM detalle_venta_producto dvp
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        detalles: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener detalles de venta: ${error.message}`);
    }
  }

  /**
   * Actualizar detalle
   * @param {number} venta_id - ID de la venta
   * @param {number} producto_id - ID del producto
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Detalle actualizado
   */
  static async actualizar(venta_id, producto_id, datos) {
    const camposPermitidos = ['cantidad', 'precio_unitario', 'descuento'];
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

    // Recalcular subtotal si se actualizan campos relevantes
    if (datos.cantidad !== undefined || datos.precio_unitario !== undefined || datos.descuento !== undefined) {
      const detalleActual = await this.obtenerPorId(venta_id, producto_id);
      if (!detalleActual) {
        throw new Error('Detalle de venta no encontrado');
      }

      const cantidad = datos.cantidad !== undefined ? datos.cantidad : detalleActual.cantidad;
      const precio_unitario = datos.precio_unitario !== undefined ? datos.precio_unitario : detalleActual.precio_unitario;
      const descuento = datos.descuento !== undefined ? datos.descuento : detalleActual.descuento;
      
      const subtotal = (precio_unitario * cantidad) - descuento;
      camposActualizar.push('subtotal = ?');
      valores.push(subtotal);
    }

    valores.push(venta_id, producto_id);
    const sql = `
      UPDATE detalle_venta_producto 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE venta_id = ? AND producto_id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Detalle de venta no encontrado');
      }

      return this.obtenerPorId(venta_id, producto_id);
    } catch (error) {
      throw new Error(`Error al actualizar detalle: ${error.message}`);
    }
  }

  /**
   * Eliminar detalle
   * @param {number} venta_id - ID de la venta
   * @param {number} producto_id - ID del producto
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(venta_id, producto_id) {
    const sql = 'DELETE FROM detalle_venta_producto WHERE venta_id = ? AND producto_id = ?';

    try {
      const result = await query(sql, [venta_id, producto_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar detalle: ${error.message}`);
    }
  }

  /**
   * Obtener detalles por venta
   * @param {number} venta_id - ID de la venta
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Detalles de la venta
   */
  static async obtenerPorVenta(venta_id, opciones = {}) {
    const { orden = 'producto_nombre ASC' } = opciones;

    const sql = `
      SELECT dvp.*,
             p.nombre as producto_nombre,
             p.descripcion as producto_descripcion,
             p.marca as producto_marca,
             cp.nombre as categoria_producto,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             vp.fecha_venta,
             vp.total as venta_total
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      WHERE dvp.venta_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, [venta_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener detalles por venta: ${error.message}`);
    }
  }

  /**
   * Obtener detalles por producto
   * @param {number} producto_id - ID del producto
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Detalles del producto
   */
  static async obtenerPorProducto(producto_id, opciones = {}) {
    const { orden = 'fecha_venta DESC' } = opciones;

    const sql = `
      SELECT dvp.*,
             p.nombre as producto_nombre,
             p.descripcion as producto_descripcion,
             p.marca as producto_marca,
             cp.nombre as categoria_producto,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             vp.fecha_venta,
             vp.total as venta_total
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      WHERE dvp.producto_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, [producto_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener detalles por producto: ${error.message}`);
    }
  }

  /**
   * Obtener detalles por rango de fechas
   * @param {Date} fecha_inicio - Fecha de inicio
   * @param {Date} fecha_fin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Detalles del rango
   */
  static async obtenerPorRangoFechas(fecha_inicio, fecha_fin, opciones = {}) {
    const { orden = 'fecha_venta DESC' } = opciones;

    const sql = `
      SELECT dvp.*,
             p.nombre as producto_nombre,
             p.descripcion as producto_descripcion,
             p.marca as producto_marca,
             cp.nombre as categoria_producto,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             vp.fecha_venta,
             vp.total as venta_total
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      WHERE vp.fecha_venta >= ? AND vp.fecha_venta <= ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, [fecha_inicio, fecha_fin]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener detalles por rango de fechas: ${error.message}`);
    }
  }

  /**
   * Buscar detalles por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Detalles encontrados
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 50 } = opciones;

    const sql = `
      SELECT dvp.*,
             p.nombre as producto_nombre,
             p.descripcion as producto_descripcion,
             p.marca as producto_marca,
             cp.nombre as categoria_producto,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             vp.fecha_venta,
             vp.total as venta_total
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      WHERE p.nombre LIKE ? 
         OR p.descripcion LIKE ?
         OR p.marca LIKE ?
         OR cp.nombre LIKE ?
         OR CONCAT(cu.nombre, ' ', cu.apellido) LIKE ?
         OR CONCAT(eu.nombre, ' ', eu.apellido) LIKE ?
      ORDER BY vp.fecha_venta DESC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar detalles: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de detalles de venta
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Estadísticas de detalles
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('vp.fecha_venta >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('vp.fecha_venta <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total_detalles,
        COUNT(DISTINCT dvp.venta_id) as ventas_unicas,
        COUNT(DISTINCT dvp.producto_id) as productos_vendidos,
        SUM(dvp.cantidad) as total_unidades_vendidas,
        SUM(dvp.subtotal) as total_ventas,
        SUM(dvp.descuento) as total_descuentos,
        AVG(dvp.precio_unitario) as precio_promedio,
        AVG(dvp.cantidad) as cantidad_promedio_por_venta
      FROM detalle_venta_producto dvp
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
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
   * Obtener productos más vendidos
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Productos más vendidos
   */
  static async obtenerProductosMasVendidos(limite = 10) {
    const sql = `
      SELECT p.id,
             p.nombre as producto_nombre,
             p.marca as producto_marca,
             cp.nombre as categoria_producto,
             COUNT(dvp.venta_id) as veces_vendido,
             SUM(dvp.cantidad) as total_unidades_vendidas,
             SUM(dvp.subtotal) as total_ventas,
             AVG(dvp.precio_unitario) as precio_promedio
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      GROUP BY p.id
      ORDER BY total_unidades_vendidas DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener productos más vendidos: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por categoría de producto
   * @returns {Promise<Array>} Estadísticas por categoría
   */
  static async obtenerEstadisticasPorCategoria() {
    const sql = `
      SELECT cp.id,
             cp.nombre as categoria_nombre,
             COUNT(dvp.venta_id) as ventas_realizadas,
             SUM(dvp.cantidad) as total_unidades_vendidas,
             SUM(dvp.subtotal) as total_ventas,
             AVG(dvp.precio_unitario) as precio_promedio
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      GROUP BY cp.id
      ORDER BY total_ventas DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por categoría: ${error.message}`);
    }
  }

  /**
   * Crear múltiples detalles de venta
   * @param {number} venta_id - ID de la venta
   * @param {Array} detalles - Array de detalles
   * @returns {Promise<Array>} Detalles creados
   */
  static async crearMultiplesDetalles(venta_id, detalles) {
    const detallesCreados = [];

    for (const detalle of detalles) {
      try {
        const detalleCreado = await this.crear({
          venta_id,
          ...detalle
        });
        detallesCreados.push(detalleCreado);
      } catch (error) {
        console.error(`Error al crear detalle para producto ${detalle.producto_id}:`, error);
      }
    }

    return detallesCreados;
  }

  /**
   * Eliminar todos los detalles de una venta
   * @param {number} venta_id - ID de la venta
   * @returns {Promise<number>} Cantidad de detalles eliminados
   */
  static async eliminarDetallesVenta(venta_id) {
    const sql = 'DELETE FROM detalle_venta_producto WHERE venta_id = ?';

    try {
      const result = await query(sql, [venta_id]);
      return result.affectedRows;
    } catch (error) {
      throw new Error(`Error al eliminar detalles de la venta: ${error.message}`);
    }
  }

  /**
   * Exportar detalles a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      fecha_inicio = null, 
      fecha_fin = null,
      venta_id = null,
      producto_id = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('vp.fecha_venta >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('vp.fecha_venta <= ?');
      params.push(fecha_fin);
    }

    if (venta_id) {
      whereConditions.push('dvp.venta_id = ?');
      params.push(venta_id);
    }

    if (producto_id) {
      whereConditions.push('dvp.producto_id = ?');
      params.push(producto_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT dvp.venta_id, dvp.producto_id, dvp.cantidad, dvp.precio_unitario, 
             dvp.descuento, dvp.subtotal, vp.fecha_venta,
             p.nombre as producto_nombre, p.marca as producto_marca,
             cp.nombre as categoria_producto,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      LEFT JOIN categorias_productos cp ON p.categoria_id = cp.id
      JOIN ventas_productos vp ON dvp.venta_id = vp.id
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios cu ON c.usuario_id = cu.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios eu ON e.usuario_id = eu.id
      ${whereClause}
      ORDER BY vp.fecha_venta DESC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar detalles: ${error.message}`);
    }
  }
}

module.exports = DetalleVentaProducto; 