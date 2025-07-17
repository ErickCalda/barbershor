const { query } = require('../config/database');

/**
 * Modelo para la gestión de promociones
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de promociones
 */
class Promocion {
  /**
   * Crear una nueva promoción
   * @param {Object} promocion - Datos de la promoción
   * @returns {Promise<Object>} Promoción creada
   */
  static async crear(promocion) {
    const {
      nombre,
      descripcion,
      codigo,
      tipo,
      valor,
      fecha_inicio,
      fecha_fin,
      limite_usos,
      usos_actuales = 0,
      activo = 1,
      aplicable_a = 'Todos'
    } = promocion;

    const sql = `
      INSERT INTO promociones (
        nombre, descripcion, codigo, tipo, valor, fecha_inicio,
        fecha_fin, limite_usos, usos_actuales, activo, aplicable_a
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        nombre, descripcion, codigo, tipo, valor, fecha_inicio,
        fecha_fin, limite_usos, usos_actuales, activo, aplicable_a
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear promoción: ${error.message}`);
    }
  }

  /**
   * Obtener promoción por ID
   * @param {number} id - ID de la promoción
   * @returns {Promise<Object|null>} Promoción encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT p.*,
             COUNT(ps.servicio_id) as servicios_asociados,
             COUNT(pp.producto_id) as productos_asociados
      FROM promociones p
      LEFT JOIN promocion_servicio ps ON p.id = ps.promocion_id
      LEFT JOIN promocion_producto pp ON p.id = pp.promocion_id
      WHERE p.id = ?
      GROUP BY p.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener promoción: ${error.message}`);
    }
  }

  /**
   * Obtener promoción por código
   * @param {string} codigo - Código de la promoción
   * @returns {Promise<Object|null>} Promoción encontrada
   */
  static async obtenerPorCodigo(codigo) {
    const sql = `
      SELECT p.*,
             COUNT(ps.servicio_id) as servicios_asociados,
             COUNT(pp.producto_id) as productos_asociados
      FROM promociones p
      LEFT JOIN promocion_servicio ps ON p.id = ps.promocion_id
      LEFT JOIN promocion_producto pp ON p.id = pp.promocion_id
      WHERE p.codigo = ? AND p.activo = 1
      GROUP BY p.id
    `;

    try {
      const rows = await query(sql, [codigo]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener promoción por código: ${error.message}`);
    }
  }

  /**
   * Obtener todas las promociones con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de promociones y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      tipo = null,
      aplicable_a = null,
      activo = null,
      fecha_inicio = null,
      fecha_fin = null,
      busqueda = null,
      orden = 'created_at',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (tipo) {
      whereConditions.push('p.tipo = ?');
      params.push(tipo);
    }

    if (aplicable_a) {
      whereConditions.push('p.aplicable_a = ?');
      params.push(aplicable_a);
    }

    if (activo !== null) {
      whereConditions.push('p.activo = ?');
      params.push(activo);
    }

    if (fecha_inicio) {
      whereConditions.push('p.fecha_inicio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('p.fecha_fin <= ?');
      params.push(fecha_fin);
    }

    if (busqueda) {
      whereConditions.push('(p.nombre LIKE ? OR p.descripcion LIKE ? OR p.codigo LIKE ?)');
      const busquedaParam = `%${busqueda}%`;
      params.push(busquedaParam, busquedaParam, busquedaParam);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT p.*,
             COUNT(ps.servicio_id) as servicios_asociados,
             COUNT(pp.producto_id) as productos_asociados
      FROM promociones p
      LEFT JOIN promocion_servicio ps ON p.id = ps.promocion_id
      LEFT JOIN promocion_producto pp ON p.id = pp.promocion_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM promociones p
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        promociones: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener promociones: ${error.message}`);
    }
  }

  /**
   * Actualizar promoción
   * @param {number} id - ID de la promoción
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Promoción actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'nombre', 'descripcion', 'codigo', 'tipo', 'valor', 'fecha_inicio',
      'fecha_fin', 'limite_usos', 'usos_actuales', 'activo', 'aplicable_a'
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
      UPDATE promociones 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Promoción no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar promoción: ${error.message}`);
    }
  }

  /**
   * Eliminar promoción
   * @param {number} id - ID de la promoción
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM promociones WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar promoción: ${error.message}`);
    }
  }

  /**
   * Buscar promociones
   * @param {string} termino - Término de búsqueda
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Promociones encontradas
   */
  static async buscar(termino, limite = 20) {
    const sql = `
      SELECT p.*,
             COUNT(ps.servicio_id) as servicios_asociados,
             COUNT(pp.producto_id) as productos_asociados
      FROM promociones p
      LEFT JOIN promocion_servicio ps ON p.id = ps.promocion_id
      LEFT JOIN promocion_producto pp ON p.id = pp.promocion_id
      WHERE p.activo = 1 
        AND (p.nombre LIKE ? OR p.descripcion LIKE ? OR p.codigo LIKE ?)
      GROUP BY p.id
      ORDER BY p.fecha_inicio DESC
      LIMIT ?
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(sql, [busquedaParam, busquedaParam, busquedaParam, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar promociones: ${error.message}`);
    }
  }

  /**
   * Obtener promociones activas
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Promociones activas
   */
  static async obtenerActivas(opciones = {}) {
    const { fecha_actual = null, limite = 50 } = opciones;

    const fecha = fecha_actual || new Date().toISOString().split('T')[0];

    const sql = `
      SELECT p.*,
             COUNT(ps.servicio_id) as servicios_asociados,
             COUNT(pp.producto_id) as productos_asociados
      FROM promociones p
      LEFT JOIN promocion_servicio ps ON p.id = ps.promocion_id
      LEFT JOIN promocion_producto pp ON p.id = pp.promocion_id
      WHERE p.activo = 1 
        AND p.fecha_inicio <= ? 
        AND p.fecha_fin >= ?
        AND (p.limite_usos IS NULL OR p.usos_actuales < p.limite_usos)
      GROUP BY p.id
      ORDER BY p.fecha_inicio ASC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [fecha, fecha, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener promociones activas: ${error.message}`);
    }
  }

  /**
   * Obtener promociones por tipo
   * @param {string} tipo - Tipo de promoción
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Promociones del tipo
   */
  static async obtenerPorTipo(tipo, opciones = {}) {
    const { activo = null, limite = 50 } = opciones;

    let whereConditions = ['p.tipo = ?'];
    let params = [tipo];

    if (activo !== null) {
      whereConditions.push('p.activo = ?');
      params.push(activo);
    }

    const sql = `
      SELECT p.*,
             COUNT(ps.servicio_id) as servicios_asociados,
             COUNT(pp.producto_id) as productos_asociados
      FROM promociones p
      LEFT JOIN promocion_servicio ps ON p.id = ps.promocion_id
      LEFT JOIN promocion_producto pp ON p.id = pp.promocion_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY p.id
      ORDER BY p.fecha_inicio DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener promociones por tipo: ${error.message}`);
    }
  }

  /**
   * Obtener promociones por aplicable a
   * @param {string} aplicable_a - Tipo de aplicación
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Promociones aplicables
   */
  static async obtenerPorAplicableA(aplicable_a, opciones = {}) {
    const { activo = null, limite = 50 } = opciones;

    let whereConditions = ['p.aplicable_a = ?'];
    let params = [aplicable_a];

    if (activo !== null) {
      whereConditions.push('p.activo = ?');
      params.push(activo);
    }

    const sql = `
      SELECT p.*,
             COUNT(ps.servicio_id) as servicios_asociados,
             COUNT(pp.producto_id) as productos_asociados
      FROM promociones p
      LEFT JOIN promocion_servicio ps ON p.id = ps.promocion_id
      LEFT JOIN promocion_producto pp ON p.id = pp.promocion_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY p.id
      ORDER BY p.fecha_inicio DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener promociones por aplicable: ${error.message}`);
    }
  }

  /**
   * Obtener servicios asociados a una promoción
   * @param {number} promocion_id - ID de la promoción
   * @returns {Promise<Array>} Servicios asociados
   */
  static async obtenerServiciosAsociados(promocion_id) {
    const sql = `
      SELECT s.*
      FROM servicios s
      JOIN promocion_servicio ps ON s.id = ps.servicio_id
      WHERE ps.promocion_id = ?
      ORDER BY s.nombre
    `;

    try {
      const rows = await query(sql, [promocion_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener servicios asociados: ${error.message}`);
    }
  }

  /**
   * Obtener productos asociados a una promoción
   * @param {number} promocion_id - ID de la promoción
   * @returns {Promise<Array>} Productos asociados
   */
  static async obtenerProductosAsociados(promocion_id) {
    const sql = `
      SELECT p.*
      FROM productos p
      JOIN promocion_producto pp ON p.id = pp.producto_id
      WHERE pp.promocion_id = ?
      ORDER BY p.nombre
    `;

    try {
      const rows = await query(sql, [promocion_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener productos asociados: ${error.message}`);
    }
  }

  /**
   * Asociar servicio a promoción
   * @param {number} promocion_id - ID de la promoción
   * @param {number} servicio_id - ID del servicio
   * @returns {Promise<Object>} Asociación creada
   */
  static async asociarServicio(promocion_id, servicio_id) {
    const sql = `
      INSERT INTO promocion_servicio (promocion_id, servicio_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE promocion_id = promocion_id
    `;

    try {
      const result = await query(sql, [promocion_id, servicio_id]);
      return { promocion_id, servicio_id };
    } catch (error) {
      throw new Error(`Error al asociar servicio: ${error.message}`);
    }
  }

  /**
   * Asociar producto a promoción
   * @param {number} promocion_id - ID de la promoción
   * @param {number} producto_id - ID del producto
   * @returns {Promise<Object>} Asociación creada
   */
  static async asociarProducto(promocion_id, producto_id) {
    const sql = `
      INSERT INTO promocion_producto (promocion_id, producto_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE promocion_id = promocion_id
    `;

    try {
      const result = await query(sql, [promocion_id, producto_id]);
      return { promocion_id, producto_id };
    } catch (error) {
      throw new Error(`Error al asociar producto: ${error.message}`);
    }
  }

  /**
   * Desasociar servicio de promoción
   * @param {number} promocion_id - ID de la promoción
   * @param {number} servicio_id - ID del servicio
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async desasociarServicio(promocion_id, servicio_id) {
    const sql = 'DELETE FROM promocion_servicio WHERE promocion_id = ? AND servicio_id = ?';

    try {
      const result = await query(sql, [promocion_id, servicio_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al desasociar servicio: ${error.message}`);
    }
  }

  /**
   * Desasociar producto de promoción
   * @param {number} promocion_id - ID de la promoción
   * @param {number} producto_id - ID del producto
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async desasociarProducto(promocion_id, producto_id) {
    const sql = 'DELETE FROM promocion_producto WHERE promocion_id = ? AND producto_id = ?';

    try {
      const result = await query(sql, [promocion_id, producto_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al desasociar producto: ${error.message}`);
    }
  }

  /**
   * Incrementar uso de promoción
   * @param {number} id - ID de la promoción
   * @returns {Promise<Object>} Promoción actualizada
   */
  static async incrementarUso(id) {
    const sql = `
      UPDATE promociones 
      SET usos_actuales = usos_actuales + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND (limite_usos IS NULL OR usos_actuales < limite_usos)
    `;

    try {
      const result = await query(sql, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Promoción no encontrada o límite de usos alcanzado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al incrementar uso: ${error.message}`);
    }
  }

  /**
   * Validar promoción
   * @param {string} codigo - Código de la promoción
   * @param {string} fecha_actual - Fecha actual
   * @returns {Promise<Object|null>} Promoción válida
   */
  static async validarPromocion(codigo, fecha_actual = null) {
    const fecha = fecha_actual || new Date().toISOString().split('T')[0];

    const sql = `
      SELECT p.*
      FROM promociones p
      WHERE p.codigo = ? 
        AND p.activo = 1
        AND p.fecha_inicio <= ?
        AND p.fecha_fin >= ?
        AND (p.limite_usos IS NULL OR p.usos_actuales < p.limite_usos)
    `;

    try {
      const rows = await query(sql, [codigo, fecha, fecha]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al validar promoción: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de promociones
   * @returns {Promise<Object>} Estadísticas de promociones
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_promociones,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as promociones_activas,
        COUNT(CASE WHEN fecha_inicio <= CURDATE() AND fecha_fin >= CURDATE() THEN 1 END) as promociones_vigentes,
        COUNT(CASE WHEN tipo = 'Porcentaje' THEN 1 END) as promociones_porcentaje,
        COUNT(CASE WHEN tipo = 'Monto Fijo' THEN 1 END) as promociones_monto_fijo,
        COUNT(CASE WHEN tipo = 'Servicio Gratis' THEN 1 END) as promociones_servicio_gratis,
        SUM(usos_actuales) as total_usos,
        AVG(valor) as valor_promedio
      FROM promociones
    `;

    try {
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Verificar si un código existe
   * @param {string} codigo - Código de la promoción
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe el código
   */
  static async existeCodigo(codigo, excludeId = null) {
    let sql = 'SELECT COUNT(*) as total FROM promociones WHERE codigo = ?';
    let params = [codigo];

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
}

module.exports = Promocion; 