const { query } = require('../config/database');

/**
 * Modelo para la gestión de ventas de productos
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de ventas
 */
class VentaProducto {
  /**
   * Crear una nueva venta de productos
   * @param {Object} venta - Datos de la venta
   * @returns {Promise<Object>} Venta creada
   */
  static async crear(venta) {
    const {
      cliente_id,
      empleado_id,
      total,
      impuesto = 0.00,
      metodo_pago_id,
      estado_pago_id,
      referencia_pago,
      notas
    } = venta;

    const sql = `
      INSERT INTO ventas_productos (
        cliente_id, empleado_id, total, impuesto, metodo_pago_id,
        estado_pago_id, referencia_pago, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        cliente_id, empleado_id, total, impuesto, metodo_pago_id,
        estado_pago_id, referencia_pago, notas
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear venta: ${error.message}`);
    }
  }

  /**
   * Obtener venta por ID
   * @param {number} id - ID de la venta
   * @returns {Promise<Object|null>} Venta encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT vp.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.email as cliente_email,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre,
             COUNT(dvp.producto_id) as total_productos
      FROM ventas_productos vp
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios u_cliente ON c.usuario_id = u_cliente.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      JOIN metodos_pago mp ON vp.metodo_pago_id = mp.id
      JOIN estados_pago ep ON vp.estado_pago_id = ep.id
      LEFT JOIN detalle_venta_producto dvp ON vp.id = dvp.venta_id
      WHERE vp.id = ?
      GROUP BY vp.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener venta: ${error.message}`);
    }
  }

  /**
   * Obtener todas las ventas con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de ventas y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      cliente_id = null,
      empleado_id = null,
      metodo_pago_id = null,
      estado_pago_id = null,
      fecha_inicio = null,
      fecha_fin = null,
      orden = 'fecha_venta',
      direccion = 'DESC'
    } = opciones;

    // Validar y sanear parámetros de paginación
    const paginaNum = Math.max(1, parseInt(pagina) || 1);
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite) || 10));
    const offset = (paginaNum - 1) * limiteNum;

    let whereConditions = [];
    let params = [];

    if (cliente_id) {
      whereConditions.push('vp.cliente_id = ?');
      params.push(cliente_id);
    }

    if (empleado_id) {
      whereConditions.push('vp.empleado_id = ?');
      params.push(empleado_id);
    }

    if (metodo_pago_id) {
      whereConditions.push('vp.metodo_pago_id = ?');
      params.push(metodo_pago_id);
    }

    if (estado_pago_id) {
      whereConditions.push('vp.estado_pago_id = ?');
      params.push(estado_pago_id);
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

    const sql = `
      SELECT vp.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre,
             COUNT(dvp.producto_id) as total_productos
      FROM ventas_productos vp
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios u_cliente ON c.usuario_id = u_cliente.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      JOIN metodos_pago mp ON vp.metodo_pago_id = mp.id
      JOIN estados_pago ep ON vp.estado_pago_id = ep.id
      LEFT JOIN detalle_venta_producto dvp ON vp.id = dvp.venta_id
      ${whereClause}
      GROUP BY vp.id
      ORDER BY vp.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countSql = `
      SELECT COUNT(*) as total
      FROM ventas_productos vp
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limiteNum, offset]);
      const countResult = await query(countSql, params);

      return {
        ventas: rows,
        paginacion: {
          pagina: paginaNum,
          limite: limiteNum,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limiteNum)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener ventas: ${error.message}`);
    }
  }

  /**
   * Actualizar venta
   * @param {number} id - ID de la venta
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Venta actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'cliente_id', 'empleado_id', 'total', 'impuesto', 'metodo_pago_id',
      'estado_pago_id', 'referencia_pago', 'notas'
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
      UPDATE ventas_productos 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Venta no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar venta: ${error.message}`);
    }
  }

  /**
   * Actualizar estado de pago de una venta
   * @param {number} id - ID de la venta
   * @param {Object} datos - Datos del estado de pago
   * @returns {Promise<Object>} Venta actualizada
   */
  static async actualizarEstadoPago(id, datos) {
    const { estado_pago_id, referencia_pago, notas } = datos;

    const sql = `
      UPDATE ventas_productos 
      SET estado_pago_id = ?, referencia_pago = ?, notas = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [estado_pago_id, referencia_pago, notas, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Venta no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar estado de pago: ${error.message}`);
    }
  }

  /**
   * Cancelar venta
   * @param {number} id - ID de la venta
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async cancelar(id) {
    const sql = 'DELETE FROM ventas_productos WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al cancelar venta: ${error.message}`);
    }
  }

  /**
   * Obtener ventas por cliente
   * @param {number} cliente_id - ID del cliente
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Ventas del cliente
   */
  static async obtenerPorCliente(cliente_id, opciones = {}) {
    const { limite = 50, orden = 'fecha_venta DESC' } = opciones;

    const sql = `
      SELECT vp.*,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre,
             COUNT(dvp.producto_id) as total_productos
      FROM ventas_productos vp
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      JOIN metodos_pago mp ON vp.metodo_pago_id = mp.id
      JOIN estados_pago ep ON vp.estado_pago_id = ep.id
      LEFT JOIN detalle_venta_producto dvp ON vp.id = dvp.venta_id
      WHERE vp.cliente_id = ?
      GROUP BY vp.id
      ORDER BY vp.${orden}
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [cliente_id, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ventas por cliente: ${error.message}`);
    }
  }

  /**
   * Obtener ventas por empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Ventas del empleado
   */
  static async obtenerPorEmpleado(empleado_id, opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null, limite = 50 } = opciones;

    let whereConditions = ['vp.empleado_id = ?'];
    let params = [empleado_id];

    if (fecha_inicio) {
      whereConditions.push('vp.fecha_venta >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('vp.fecha_venta <= ?');
      params.push(fecha_fin);
    }

    const sql = `
      SELECT vp.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre,
             COUNT(dvp.producto_id) as total_productos
      FROM ventas_productos vp
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios u_cliente ON c.usuario_id = u_cliente.id
      JOIN metodos_pago mp ON vp.metodo_pago_id = mp.id
      JOIN estados_pago ep ON vp.estado_pago_id = ep.id
      LEFT JOIN detalle_venta_producto dvp ON vp.id = dvp.venta_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY vp.id
      ORDER BY vp.fecha_venta DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ventas por empleado: ${error.message}`);
    }
  }

  /**
   * Obtener detalles de una venta
   * @param {number} venta_id - ID de la venta
   * @returns {Promise<Array>} Detalles de la venta
   */
  static async obtenerDetalles(venta_id) {
    const sql = `
      SELECT dvp.*,
             p.nombre as producto_nombre,
             p.marca as producto_marca,
             p.imagen as producto_imagen
      FROM detalle_venta_producto dvp
      JOIN productos p ON dvp.producto_id = p.id
      WHERE dvp.venta_id = ?
      ORDER BY dvp.producto_id
    `;

    try {
      const rows = await query(sql, [venta_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener detalles de venta: ${error.message}`);
    }
  }

  /**
   * Agregar producto a venta
   * @param {number} venta_id - ID de la venta
   * @param {Object} producto - Datos del producto
   * @returns {Promise<Object>} Detalle agregado
   */
  static async agregarProducto(venta_id, producto) {
    const { producto_id, cantidad, precio_unitario, descuento = 0.00 } = producto;
    const subtotal = (precio_unitario - descuento) * cantidad;

    const sql = `
      INSERT INTO detalle_venta_producto (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        cantidad = cantidad + VALUES(cantidad),
        precio_unitario = VALUES(precio_unitario),
        descuento = VALUES(descuento),
        subtotal = (VALUES(precio_unitario) - VALUES(descuento)) * (cantidad + VALUES(cantidad))
    `;

    try {
      const result = await query(sql, [
        venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal
      ]);

      // Actualizar total de la venta
      await this.actualizarTotalVenta(venta_id);

      return { venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal };
    } catch (error) {
      throw new Error(`Error al agregar producto: ${error.message}`);
    }
  }

  /**
   * Remover producto de venta
   * @param {number} venta_id - ID de la venta
   * @param {number} producto_id - ID del producto
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async removerProducto(venta_id, producto_id) {
    const sql = 'DELETE FROM detalle_venta_producto WHERE venta_id = ? AND producto_id = ?';

    try {
      const result = await query(sql, [venta_id, producto_id]);
      
      if (result.affectedRows > 0) {
        // Actualizar total de la venta
        await this.actualizarTotalVenta(venta_id);
      }

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al remover producto: ${error.message}`);
    }
  }

  /**
   * Actualizar total de la venta
   * @param {number} venta_id - ID de la venta
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async actualizarTotalVenta(venta_id) {
    const sql = `
      UPDATE ventas_productos 
      SET total = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM detalle_venta_producto
        WHERE venta_id = ?
      ),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [venta_id, venta_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar total: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de ventas
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Object>} Estadísticas de ventas
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null, empleado_id = null } = opciones;

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

    if (empleado_id) {
      whereConditions.push('vp.empleado_id = ?');
      params.push(empleado_id);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(*) as total_ventas,
        SUM(vp.total) as monto_total,
        SUM(vp.impuesto) as impuesto_total,
        AVG(vp.total) as monto_promedio,
        MIN(vp.total) as monto_minimo,
        MAX(vp.total) as monto_maximo,
        COUNT(DISTINCT vp.cliente_id) as clientes_unicos,
        COUNT(DISTINCT vp.empleado_id) as empleados_activos
      FROM ventas_productos vp
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
   * Obtener ventas del día
   * @param {string} fecha - Fecha específica (YYYY-MM-DD)
   * @returns {Promise<Array>} Ventas del día
   */
  static async obtenerDelDia(fecha = null) {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    const sql = `
      SELECT vp.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre,
             COUNT(dvp.producto_id) as total_productos
      FROM ventas_productos vp
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios u_cliente ON c.usuario_id = u_cliente.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      JOIN metodos_pago mp ON vp.metodo_pago_id = mp.id
      JOIN estados_pago ep ON vp.estado_pago_id = ep.id
      LEFT JOIN detalle_venta_producto dvp ON vp.id = dvp.venta_id
      WHERE DATE(vp.fecha_venta) = ?
      GROUP BY vp.id
      ORDER BY vp.fecha_venta DESC
    `;

    try {
      const rows = await query(sql, [fechaConsulta]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ventas del día: ${error.message}`);
    }
  }

  /**
   * Obtener productos más vendidos
   * @param {number} limite - Límite de resultados
   * @param {number} periodo - Período en días
   * @returns {Promise<Array>} Productos más vendidos
   */
  static async obtenerProductosMasVendidos(limite = 10, periodo = 30) {
    const sql = `
      SELECT 
        p.id,
        p.nombre,
        p.marca,
        p.precio_venta,
        SUM(dvp.cantidad) as total_vendido,
        SUM(dvp.subtotal) as ingresos_totales,
        COUNT(DISTINCT vp.id) as ventas_unicas
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
   * Obtener ventas por método de pago
   * @param {number} metodo_pago_id - ID del método de pago
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Ventas por método de pago
   */
  static async obtenerPorMetodoPago(metodo_pago_id, opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null, limite = 50 } = opciones;

    let whereConditions = ['vp.metodo_pago_id = ?'];
    let params = [metodo_pago_id];

    if (fecha_inicio) {
      whereConditions.push('vp.fecha_venta >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('vp.fecha_venta <= ?');
      params.push(fecha_fin);
    }

    const sql = `
      SELECT vp.*,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre,
             COUNT(dvp.producto_id) as total_productos
      FROM ventas_productos vp
      LEFT JOIN clientes c ON vp.cliente_id = c.id
      LEFT JOIN usuarios u_cliente ON c.usuario_id = u_cliente.id
      JOIN empleados e ON vp.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      JOIN metodos_pago mp ON vp.metodo_pago_id = mp.id
      JOIN estados_pago ep ON vp.estado_pago_id = ep.id
      LEFT JOIN detalle_venta_producto dvp ON vp.id = dvp.venta_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY vp.id
      ORDER BY vp.fecha_venta DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener ventas por método de pago: ${error.message}`);
    }
  }
}

module.exports = VentaProducto; 