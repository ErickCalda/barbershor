const { query } = require('../config/database');

/**
 * Modelo para la gestión de pagos
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de pagos
 */
class Pago {
  /**
   * Crear un nuevo pago
   * @param {Object} pagoData - Datos del pago
   * @returns {Promise<Object>} Pago creado
   */
  static async crear(pagoData) {
    const {
      cita_id,
      cliente_id,
      empleado_id,
      metodo_pago_id,
      estado_pago_id,
      monto_total,
      monto_pagado = 0,
      monto_pendiente,
      fecha_pago = new Date(),
      referencia_pago = null,
      notas = null
    } = pagoData;

    const sql = `
      INSERT INTO pagos (
        cita_id, cliente_id, empleado_id, metodo_pago_id, estado_pago_id,
        monto_total, monto_pagado, monto_pendiente, fecha_pago, referencia_pago, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      cita_id, cliente_id, empleado_id, metodo_pago_id, estado_pago_id,
      monto_total, monto_pagado, monto_pendiente, fecha_pago, referencia_pago, notas
    ];

    try {
      const result = await query(sql, params);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear pago: ${error.message}`);
    }
  }

  /**
   * Obtener pago por ID
   * @param {number} id - ID del pago
   * @returns {Promise<Object|null>} Pago encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT p.*,
             c.fecha_hora_inicio, c.fecha_hora_fin, c.duracion_minutos,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre
      FROM pagos p
      INNER JOIN citas c ON p.cita_id = c.id
      INNER JOIN clientes cl ON p.cliente_id = cl.id
      INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      INNER JOIN empleados e ON p.empleado_id = e.id
      INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      INNER JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      INNER JOIN estados_pago ep ON p.estado_pago_id = ep.id
      WHERE p.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener pago: ${error.message}`);
    }
  }

  /**
   * Obtener todos los pagos
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Object>} Lista de pagos y total
   */
  static async obtenerTodos(filtros = {}) {
    const {
      limite = 10,
      offset = 0,
      fecha_inicio = null,
      fecha_fin = null,
      cliente_id = null,
      empleado_id = null,
      metodo_pago_id = null,
      estado_pago_id = null,
      monto_min = null,
      monto_max = null
    } = filtros;

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

    if (cliente_id) {
      whereConditions.push('p.cliente_id = ?');
      params.push(cliente_id);
    }

    if (empleado_id) {
      whereConditions.push('p.empleado_id = ?');
      params.push(empleado_id);
    }

    if (metodo_pago_id) {
      whereConditions.push('p.metodo_pago_id = ?');
      params.push(metodo_pago_id);
    }

    if (estado_pago_id) {
      whereConditions.push('p.estado_pago_id = ?');
      params.push(estado_pago_id);
    }

    if (monto_min) {
      whereConditions.push('p.monto_total >= ?');
      params.push(monto_min);
    }

    if (monto_max) {
      whereConditions.push('p.monto_total <= ?');
      params.push(monto_max);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT p.*,
             c.fecha_hora_inicio, c.fecha_hora_fin,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre
      FROM pagos p
      INNER JOIN citas c ON p.cita_id = c.id
      INNER JOIN clientes cl ON p.cliente_id = cl.id
      INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      INNER JOIN empleados e ON p.empleado_id = e.id
      INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      INNER JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      INNER JOIN estados_pago ep ON p.estado_pago_id = ep.id
      ${whereClause}
      ORDER BY p.fecha_pago DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM pagos p
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);
      
      return {
        pagos: rows,
        total: countResult[0].total,
        pagina: Math.floor(offset / limite) + 1,
        totalPaginas: Math.ceil(countResult[0].total / limite)
      };
    } catch (error) {
      throw new Error(`Error al obtener pagos: ${error.message}`);
    }
  }

  /**
   * Actualizar pago
   * @param {number} id - ID del pago
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Pago actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'metodo_pago_id', 'estado_pago_id', 'monto_pagado', 'monto_pendiente',
      'fecha_pago', 'referencia_pago', 'notas'
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
      UPDATE pagos 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Pago no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar pago: ${error.message}`);
    }
  }

  /**
   * Eliminar pago
   * @param {number} id - ID del pago
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM pagos WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar pago: ${error.message}`);
    }
  }

  /**
   * Obtener pagos por cita
   * @param {number} cita_id - ID de la cita
   * @returns {Promise<Array>} Pagos de la cita
   */
  static async obtenerPorCita(cita_id) {
    const sql = `
      SELECT p.*,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre
      FROM pagos p
      INNER JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      INNER JOIN estados_pago ep ON p.estado_pago_id = ep.id
      WHERE p.cita_id = ?
      ORDER BY p.fecha_pago DESC
    `;

    try {
      const rows = await query(sql, [cita_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener pagos por cita: ${error.message}`);
    }
  }

  /**
   * Obtener pagos por cliente
   * @param {number} cliente_id - ID del cliente
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Pagos del cliente
   */
  static async obtenerPorCliente(cliente_id, limite = 50) {
    const sql = `
      SELECT p.*,
             c.fecha_hora_inicio, c.fecha_hora_fin,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre
      FROM pagos p
      INNER JOIN citas c ON p.cita_id = c.id
      INNER JOIN empleados e ON p.empleado_id = e.id
      INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      INNER JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      INNER JOIN estados_pago ep ON p.estado_pago_id = ep.id
      WHERE p.cliente_id = ?
      ORDER BY p.fecha_pago DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [cliente_id, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener pagos por cliente: ${error.message}`);
    }
  }

  /**
   * Obtener pagos por período
   * @param {string} fecha_inicio - Fecha de inicio
   * @param {string} fecha_fin - Fecha de fin
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Pagos del período
   */
  static async obtenerPorPeriodo(fecha_inicio, fecha_fin, limite = 100) {
    const sql = `
      SELECT p.*,
             c.fecha_hora_inicio, c.fecha_hora_fin,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre
      FROM pagos p
      INNER JOIN citas c ON p.cita_id = c.id
      INNER JOIN clientes cl ON p.cliente_id = cl.id
      INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      INNER JOIN empleados e ON p.empleado_id = e.id
      INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      INNER JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      INNER JOIN estados_pago ep ON p.estado_pago_id = ep.id
      WHERE p.fecha_pago BETWEEN ? AND ?
      ORDER BY p.fecha_pago DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [fecha_inicio, fecha_fin, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener pagos por período: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de pagos
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Object>} Estadísticas de pagos
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
        COUNT(*) as total_pagos,
        SUM(p.monto_total) as monto_total_procesado,
        SUM(p.monto_pagado) as monto_total_pagado,
        SUM(p.monto_pendiente) as monto_total_pendiente,
        AVG(p.monto_total) as monto_promedio,
        MIN(p.monto_total) as monto_minimo,
        MAX(p.monto_total) as monto_maximo
      FROM pagos p
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
   * Obtener pagos pendientes
   * @param {Object} filtros - Filtros opcionales
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Pagos pendientes
   */
  static async obtenerPendientes(filtros = {}, limite = 50) {
    const { cliente_id = null, empleado_id = null } = filtros;

    let whereConditions = ['p.monto_pendiente > 0'];
    let params = [];

    if (cliente_id) {
      whereConditions.push('p.cliente_id = ?');
      params.push(cliente_id);
    }

    if (empleado_id) {
      whereConditions.push('p.empleado_id = ?');
      params.push(empleado_id);
    }

    const sql = `
      SELECT p.*,
             c.fecha_hora_inicio, c.fecha_hora_fin,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre
      FROM pagos p
      INNER JOIN citas c ON p.cita_id = c.id
      INNER JOIN clientes cl ON p.cliente_id = cl.id
      INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      INNER JOIN empleados e ON p.empleado_id = e.id
      INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      INNER JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      INNER JOIN estados_pago ep ON p.estado_pago_id = ep.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY p.fecha_pago ASC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener pagos pendientes: ${error.message}`);
    }
  }

  /**
   * Obtener pagos más recientes
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Pagos más recientes
   */
  static async obtenerMasRecientes(limite = 10) {
    const sql = `
      SELECT p.*,
             c.fecha_hora_inicio, c.fecha_hora_fin,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre
      FROM pagos p
      INNER JOIN citas c ON p.cita_id = c.id
      INNER JOIN clientes cl ON p.cliente_id = cl.id
      INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      INNER JOIN empleados e ON p.empleado_id = e.id
      INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      INNER JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      INNER JOIN estados_pago ep ON p.estado_pago_id = ep.id
      ORDER BY p.fecha_pago DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener pagos más recientes: ${error.message}`);
    }
  }

  /**
   * Obtener pagos del día
   * @param {string} fecha - Fecha a consultar (YYYY-MM-DD)
   * @returns {Promise<Array>} Pagos del día
   */
  static async obtenerDelDia(fecha = null) {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    const sql = `
      SELECT p.*,
             c.fecha_hora_inicio, c.fecha_hora_fin,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             mp.nombre as metodo_pago_nombre,
             ep.nombre as estado_pago_nombre
      FROM pagos p
      INNER JOIN citas c ON p.cita_id = c.id
      INNER JOIN clientes cl ON p.cliente_id = cl.id
      INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      INNER JOIN empleados e ON p.empleado_id = e.id
      INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      INNER JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      INNER JOIN estados_pago ep ON p.estado_pago_id = ep.id
      WHERE DATE(p.fecha_pago) = ?
      ORDER BY p.fecha_pago DESC
    `;

    try {
      const rows = await query(sql, [fechaConsulta]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener pagos del día: ${error.message}`);
    }
  }

  /**
   * Verificar si existe pago para una cita
   * @param {number} cita_id - ID de la cita
   * @returns {Promise<boolean>} Existe pago para la cita
   */
  static async existePorCita(cita_id) {
    const sql = 'SELECT COUNT(*) as total FROM pagos WHERE cita_id = ?';

    try {
      const rows = await query(sql, [cita_id]);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al verificar pago por cita: ${error.message}`);
    }
  }

  /**
   * Obtener total de pagos por cita
   * @param {number} cita_id - ID de la cita
   * @returns {Promise<Object>} Total de pagos
   */
  static async obtenerTotalPorCita(cita_id) {
    const sql = `
      SELECT 
        SUM(monto_total) as monto_total,
        SUM(monto_pagado) as monto_pagado,
        SUM(monto_pendiente) as monto_pendiente
      FROM pagos 
      WHERE cita_id = ?
    `;

    try {
      const rows = await query(sql, [cita_id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener total por cita: ${error.message}`);
    }
  }
}

module.exports = Pago; 