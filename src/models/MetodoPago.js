const { query } = require('../config/database');

/**
 * Modelo para la gestión de métodos de pago
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de métodos de pago
 */
class MetodoPago {
  /**
   * Crear un nuevo método de pago
   * @param {Object} metodoPago - Datos del método de pago
   * @returns {Promise<Object>} Método de pago creado
   */
  static async crear(metodoPago) {
    const { nombre, descripcion, activo = true } = metodoPago;

    const sql = `
      INSERT INTO metodos_pago (nombre, descripcion, activo)
      VALUES (?, ?, ?)
    `;

    try {
      const result = await query(sql, [nombre, descripcion, activo]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear método de pago: ${error.message}`);
    }
  }

  /**
   * Obtener método de pago por ID
   * @param {number} id - ID del método de pago
   * @returns {Promise<Object|null>} Método de pago encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT mp.*, 
             COUNT(p.id) as total_pagos,
             SUM(p.monto_total) as monto_total_procesado,
             AVG(p.monto_total) as monto_promedio
      FROM metodos_pago mp
      LEFT JOIN pagos p ON mp.id = p.metodo_pago_id
      WHERE mp.id = ?
      GROUP BY mp.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener método de pago: ${error.message}`);
    }
  }

  /**
   * Obtener todos los métodos de pago
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Array>} Lista de métodos de pago
   */
  static async obtenerTodos(opciones = {}) {
    const { soloActivos = false, incluirEstadisticas = false } = opciones;

    let sql = `
      SELECT mp.*, 
             COUNT(p.id) as total_pagos,
             SUM(p.monto_total) as monto_total_procesado,
             AVG(p.monto_total) as monto_promedio
      FROM metodos_pago mp
      LEFT JOIN pagos p ON mp.id = p.metodo_pago_id
    `;

    if (soloActivos) {
      sql += ' WHERE mp.activo = true';
    }

    sql += `
      GROUP BY mp.id
      ORDER BY mp.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener métodos de pago: ${error.message}`);
    }
  }

  /**
   * Actualizar método de pago
   * @param {number} id - ID del método de pago
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Método de pago actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['nombre', 'descripcion', 'activo'];
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
      UPDATE metodos_pago 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Método de pago no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar método de pago: ${error.message}`);
    }
  }

  /**
   * Eliminar método de pago
   * @param {number} id - ID del método de pago
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    // Verificar si tiene pagos asociados
    const pagos = await this.obtenerPagosPorMetodo(id);
    if (pagos.length > 0) {
      throw new Error('No se puede eliminar un método de pago que tiene pagos asociados');
    }

    const sql = 'DELETE FROM metodos_pago WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar método de pago: ${error.message}`);
    }
  }

  /**
   * Buscar métodos de pago por nombre
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Métodos de pago encontrados
   */
  static async buscar(termino) {
    const sql = `
      SELECT mp.*, 
             COUNT(p.id) as total_pagos
      FROM metodos_pago mp
      LEFT JOIN pagos p ON mp.id = p.metodo_pago_id
      WHERE mp.nombre LIKE ? OR mp.descripcion LIKE ?
      GROUP BY mp.id
      ORDER BY mp.nombre
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(sql, [busquedaParam, busquedaParam]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar métodos de pago: ${error.message}`);
    }
  }

  /**
   * Obtener pagos por método
   * @param {number} metodo_pago_id - ID del método de pago
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Pagos del método
   */
  static async obtenerPagosPorMetodo(metodo_pago_id, opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null, limite = 50 } = opciones;

    let whereConditions = ['p.metodo_pago_id = ?'];
    let params = [metodo_pago_id];

    if (fecha_inicio) {
      whereConditions.push('p.fecha_pago >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('p.fecha_pago <= ?');
      params.push(fecha_fin);
    }

    const sql = `
      SELECT p.*, 
             ep.nombre as estado_pago_nombre,
             c.fecha_hora_inicio,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre
      FROM pagos p
      JOIN citas c ON p.cita_id = c.id
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      JOIN empleados e ON c.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      JOIN estados_pago ep ON p.estado_pago_id = ep.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY p.fecha_pago DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener pagos por método: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de métodos de pago
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Object>} Estadísticas de métodos de pago
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('p.fecha_pago >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('p.fecha_pago <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        COUNT(DISTINCT mp.id) as total_metodos,
        COUNT(DISTINCT CASE WHEN mp.activo = true THEN mp.id END) as metodos_activos,
        COUNT(DISTINCT CASE WHEN mp.activo = false THEN mp.id END) as metodos_inactivos,
        COUNT(p.id) as total_pagos,
        SUM(p.monto_total) as monto_total_procesado,
        AVG(p.monto_total) as monto_promedio
      FROM metodos_pago mp
      LEFT JOIN pagos p ON mp.id = p.metodo_pago_id ${whereClause}
    `;

    try {
      const rows = await query(sql, params);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener métodos de pago por período
   * @param {string} fecha_inicio - Fecha de inicio
   * @param {string} fecha_fin - Fecha de fin
   * @returns {Promise<Array>} Métodos de pago del período
   */
  static async obtenerPorPeriodo(fecha_inicio, fecha_fin) {
    const sql = `
      SELECT 
        mp.id,
        mp.nombre,
        mp.descripcion,
        mp.activo,
        COUNT(p.id) as total_pagos,
        SUM(p.monto_total) as monto_total_procesado,
        AVG(p.monto_total) as monto_promedio
      FROM metodos_pago mp
      LEFT JOIN pagos p ON mp.id = p.metodo_pago_id 
        AND p.fecha_pago BETWEEN ? AND ?
      GROUP BY mp.id
      ORDER BY monto_total_procesado DESC
    `;

    try {
      const rows = await query(sql, [fecha_inicio, fecha_fin]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener métodos por período: ${error.message}`);
    }
  }

  /**
   * Verificar si un método de pago existe
   * @param {string} nombre - Nombre del método de pago
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe el método de pago
   */
  static async existe(nombre, excludeId = null) {
    let sql = 'SELECT COUNT(*) as total FROM metodos_pago WHERE nombre = ?';
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
   * Obtener métodos de pago sin uso
   * @returns {Promise<Array>} Métodos de pago sin uso
   */
  static async obtenerSinUso() {
    const sql = `
      SELECT mp.*, 
             COUNT(p.id) as total_pagos
      FROM metodos_pago mp
      LEFT JOIN pagos p ON mp.id = p.metodo_pago_id
      GROUP BY mp.id
      HAVING total_pagos = 0
      ORDER BY mp.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener métodos sin uso: ${error.message}`);
    }
  }

  /**
   * Obtener método de pago por nombre
   * @param {string} nombre - Nombre del método de pago
   * @returns {Promise<Object|null>} Método de pago encontrado
   */
  static async obtenerPorNombre(nombre) {
    const sql = `
      SELECT mp.*, 
             COUNT(p.id) as total_pagos
      FROM metodos_pago mp
      LEFT JOIN pagos p ON mp.id = p.metodo_pago_id
      WHERE mp.nombre = ?
      GROUP BY mp.id
    `;

    try {
      const rows = await query(sql, [nombre]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener método por nombre: ${error.message}`);
    }
  }

  /**
   * Obtener resumen de métodos de pago
   * @returns {Promise<Array>} Resumen de métodos de pago
   */
  static async obtenerResumen() {
    const sql = `
      SELECT 
        mp.id,
        mp.nombre,
        mp.descripcion,
        mp.activo,
        COUNT(p.id) as total_pagos,
        COUNT(CASE WHEN p.fecha_pago >= CURDATE() THEN 1 END) as pagos_hoy,
        COUNT(CASE WHEN p.fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as pagos_semana,
        COUNT(CASE WHEN p.fecha_pago >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as pagos_mes,
        SUM(p.monto_total) as monto_total_procesado
      FROM metodos_pago mp
      LEFT JOIN pagos p ON mp.id = p.metodo_pago_id
      GROUP BY mp.id
      ORDER BY monto_total_procesado DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener resumen: ${error.message}`);
    }
  }

  /**
   * Crear métodos de pago por defecto
   * @returns {Promise<Array>} Métodos de pago creados
   */
  static async crearMetodosPorDefecto() {
    const metodosPorDefecto = [
      { nombre: 'Efectivo', descripcion: 'Pago en efectivo' },
      { nombre: 'Tarjeta de Crédito', descripcion: 'Pago con tarjeta de crédito' },
      { nombre: 'Tarjeta de Débito', descripcion: 'Pago con tarjeta de débito' },
      { nombre: 'Transferencia Bancaria', descripcion: 'Transferencia bancaria' },
      { nombre: 'PayPal', descripcion: 'Pago a través de PayPal' }
    ];

    const metodosCreados = [];

    for (const metodo of metodosPorDefecto) {
      try {
        const existe = await this.existe(metodo.nombre);
        if (!existe) {
          const metodoCreado = await this.crear(metodo);
          metodosCreados.push(metodoCreado);
        }
      } catch (error) {
        console.error(`Error creando método ${metodo.nombre}:`, error);
      }
    }

    return metodosCreados;
  }
}

module.exports = MetodoPago; 