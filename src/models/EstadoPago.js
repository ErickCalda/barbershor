const { query } = require('../config/database');

/**
 * Modelo para la gestión de estados de pago
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de estados de pago
 */
class EstadoPago {
  /**
   * Crear un nuevo estado de pago
   * @param {Object} estadoPago - Datos del estado de pago
   * @returns {Promise<Object>} Estado de pago creado
   */
  static async crear(estadoPago) {
    const { nombre, descripcion } = estadoPago;

    const sql = `
      INSERT INTO estados_pago (nombre, descripcion)
      VALUES (?, ?)
    `;

    try {
      const result = await query(sql, [nombre, descripcion]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear estado de pago: ${error.message}`);
    }
  }

  /**
   * Obtener estado de pago por ID
   * @param {number} id - ID del estado de pago
   * @returns {Promise<Object|null>} Estado de pago encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT ep.*, 
             COUNT(p.id) as total_pagos,
             SUM(p.monto_total) as monto_total_procesado,
             AVG(p.monto_total) as monto_promedio
      FROM estados_pago ep
      LEFT JOIN pagos p ON ep.id = p.estado_pago_id
      WHERE ep.id = ?
      GROUP BY ep.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener estado de pago: ${error.message}`);
    }
  }

  /**
   * Obtener todos los estados de pago
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Array>} Lista de estados de pago
   */
  static async obtenerTodos(opciones = {}) {
    const { incluirEstadisticas = false } = opciones;

    const sql = `
      SELECT ep.*, 
             COUNT(p.id) as total_pagos,
             SUM(p.monto_total) as monto_total_procesado,
             AVG(p.monto_total) as monto_promedio
      FROM estados_pago ep
      LEFT JOIN pagos p ON ep.id = p.estado_pago_id
      GROUP BY ep.id
      ORDER BY ep.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estados de pago: ${error.message}`);
    }
  }

  /**
   * Actualizar estado de pago
   * @param {number} id - ID del estado de pago
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Estado de pago actualizado
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
      UPDATE estados_pago 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Estado de pago no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar estado de pago: ${error.message}`);
    }
  }

  /**
   * Eliminar estado de pago
   * @param {number} id - ID del estado de pago
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    // Verificar si tiene pagos asociados
    const pagos = await this.obtenerPagosPorEstado(id);
    if (pagos.length > 0) {
      throw new Error('No se puede eliminar un estado de pago que tiene pagos asociados');
    }

    const sql = 'DELETE FROM estados_pago WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar estado de pago: ${error.message}`);
    }
  }

  /**
   * Buscar estados de pago por nombre
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Estados de pago encontrados
   */
  static async buscar(termino) {
    const sql = `
      SELECT ep.*, 
             COUNT(p.id) as total_pagos
      FROM estados_pago ep
      LEFT JOIN pagos p ON ep.id = p.estado_pago_id
      WHERE ep.nombre LIKE ? OR ep.descripcion LIKE ?
      GROUP BY ep.id
      ORDER BY ep.nombre
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(sql, [busquedaParam, busquedaParam]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar estados de pago: ${error.message}`);
    }
  }

  /**
   * Obtener pagos por estado
   * @param {number} estado_pago_id - ID del estado de pago
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Pagos del estado
   */
  static async obtenerPagosPorEstado(estado_pago_id, opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null, limite = 50 } = opciones;

    // Validar y sanear parámetro limite
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite) || 50));

    let whereConditions = ['p.estado_pago_id = ?'];
    let params = [estado_pago_id];

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
             mp.nombre as metodo_pago_nombre,
             c.fecha_hora_inicio,
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre
      FROM pagos p
      JOIN citas c ON p.cita_id = c.id
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      JOIN empleados e ON c.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY p.fecha_pago DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limiteNum]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener pagos por estado: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de estados de pago
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Object>} Estadísticas de estados de pago
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
        ep.id,
        ep.nombre,
        ep.descripcion,
        COUNT(p.id) as total_pagos,
        SUM(p.monto_total) as monto_total_procesado,
        AVG(p.monto_total) as monto_promedio,
        MIN(p.monto_total) as monto_minimo,
        MAX(p.monto_total) as monto_maximo
      FROM estados_pago ep
      LEFT JOIN pagos p ON ep.id = p.estado_pago_id
      ${whereClause}
      GROUP BY ep.id
      ORDER BY total_pagos DESC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estados de pago por período
   * @param {string} fecha_inicio - Fecha de inicio
   * @param {string} fecha_fin - Fecha de fin
   * @returns {Promise<Array>} Estados de pago por período
   */
  static async obtenerPorPeriodo(fecha_inicio, fecha_fin) {
    const sql = `
      SELECT 
        ep.id,
        ep.nombre,
        ep.descripcion,
        COUNT(p.id) as total_pagos,
        SUM(p.monto_total) as monto_total_procesado,
        AVG(p.monto_total) as monto_promedio
      FROM estados_pago ep
      LEFT JOIN pagos p ON ep.id = p.estado_pago_id
      WHERE p.fecha_pago BETWEEN ? AND ?
      GROUP BY ep.id
      ORDER BY monto_total_procesado DESC
    `;

    try {
      const rows = await query(sql, [fecha_inicio, fecha_fin]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estados por período: ${error.message}`);
    }
  }

  /**
   * Verificar si un estado de pago existe
   * @param {string} nombre - Nombre del estado de pago
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe el estado de pago
   */
  static async existe(nombre, excludeId = null) {
    let sql = 'SELECT COUNT(*) as total FROM estados_pago WHERE nombre = ?';
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
   * Obtener estados de pago sin uso
   * @returns {Promise<Array>} Estados de pago sin uso
   */
  static async obtenerSinUso() {
    const sql = `
      SELECT ep.*, 
             COUNT(p.id) as total_pagos
      FROM estados_pago ep
      LEFT JOIN pagos p ON ep.id = p.estado_pago_id
      GROUP BY ep.id
      HAVING total_pagos = 0
      ORDER BY ep.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estados sin uso: ${error.message}`);
    }
  }

  /**
   * Obtener estado de pago por nombre
   * @param {string} nombre - Nombre del estado
   * @returns {Promise<Object|null>} Estado de pago encontrado
   */
  static async obtenerPorNombre(nombre) {
    const sql = `
      SELECT ep.*, 
             COUNT(p.id) as total_pagos,
             SUM(p.monto_total) as monto_total_procesado
      FROM estados_pago ep
      LEFT JOIN pagos p ON ep.id = p.estado_pago_id
      WHERE ep.nombre = ?
      GROUP BY ep.id
    `;

    try {
      const rows = await query(sql, [nombre]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener estado por nombre: ${error.message}`);
    }
  }

  /**
   * Obtener resumen de estados de pago
   * @returns {Promise<Array>} Resumen de estados de pago
   */
  static async obtenerResumen() {
    const sql = `
      SELECT 
        ep.id,
        ep.nombre,
        ep.descripcion,
        COUNT(p.id) as total_pagos,
        SUM(p.monto_total) as monto_total_procesado,
        AVG(p.monto_total) as monto_promedio,
        MIN(p.fecha_pago) as primer_pago,
        MAX(p.fecha_pago) as ultimo_pago
      FROM estados_pago ep
      LEFT JOIN pagos p ON ep.id = p.estado_pago_id
      GROUP BY ep.id
      ORDER BY total_pagos DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener resumen: ${error.message}`);
    }
  }

  /**
   * Crear estados de pago por defecto
   * @returns {Promise<Array>} Estados de pago creados
   */
  static async crearEstadosPorDefecto() {
    const estadosPorDefecto = [
      { nombre: 'Pendiente', descripcion: 'Pago pendiente de procesar' },
      { nombre: 'Procesando', descripcion: 'Pago en proceso de verificación' },
      { nombre: 'Completado', descripcion: 'Pago completado exitosamente' },
      { nombre: 'Fallido', descripcion: 'Pago falló en el procesamiento' },
      { nombre: 'Cancelado', descripcion: 'Pago cancelado por el usuario' },
      { nombre: 'Reembolsado', descripcion: 'Pago reembolsado al cliente' }
    ];

    const estadosCreados = [];

    for (const estado of estadosPorDefecto) {
      try {
        const existe = await this.existe(estado.nombre);
        if (!existe) {
          const estadoCreado = await this.crear(estado);
          estadosCreados.push(estadoCreado);
        }
      } catch (error) {
        console.error(`Error al crear estado ${estado.nombre}:`, error);
      }
    }

    return estadosCreados;
  }
}

module.exports = EstadoPago; 