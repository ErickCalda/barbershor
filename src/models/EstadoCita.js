const { query } = require('../config/database');

/**
 * Modelo para la gestión de estados de citas
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de estados de citas
 */
class EstadoCita {
  /**
   * Crear un nuevo estado de cita
   * @param {Object} estadoCita - Datos del estado de cita
   * @returns {Promise<Object>} Estado de cita creado
   */
  static async crear(estadoCita) {
    const { nombre, descripcion, color } = estadoCita;

    const sql = `
      INSERT INTO estados_citas (nombre, descripcion, color)
      VALUES (?, ?, ?)
    `;

    try {
      const result = await query(sql, [nombre, descripcion, color]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear estado de cita: ${error.message}`);
    }
  }

  /**
   * Obtener estado de cita por ID
   * @param {number} id - ID del estado de cita
   * @returns {Promise<Object|null>} Estado de cita encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT ec.*, 
             COUNT(c.id) as total_citas,
             COUNT(CASE WHEN c.fecha_hora_inicio >= NOW() THEN 1 END) as citas_futuras,
             COUNT(CASE WHEN c.fecha_hora_inicio < NOW() THEN 1 END) as citas_pasadas
      FROM estados_citas ec
      LEFT JOIN citas c ON ec.id = c.estado_id
      WHERE ec.id = ?
      GROUP BY ec.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener estado de cita: ${error.message}`);
    }
  }

  /**
   * Obtener todos los estados de cita
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Array>} Lista de estados de cita
   */
  static async obtenerTodos(opciones = {}) {
    const { incluirEstadisticas = false } = opciones;

    const sql = `
      SELECT ec.*, 
             COUNT(c.id) as total_citas,
             COUNT(CASE WHEN c.fecha_hora_inicio >= NOW() THEN 1 END) as citas_futuras,
             COUNT(CASE WHEN c.fecha_hora_inicio < NOW() THEN 1 END) as citas_pasadas
      FROM estados_citas ec
      LEFT JOIN citas c ON ec.id = c.estado_id
      GROUP BY ec.id
      ORDER BY ec.nombre
    `;

    try {
      const rows = await query(sql);
      
      if (incluirEstadisticas) {
        // Obtener estadísticas para cada estado
        for (let estado of rows) {
          estado.estadisticas = await this.obtenerEstadisticas({
            fecha_inicio: null,
            fecha_fin: null
          });
        }
      }

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estados de cita: ${error.message}`);
    }
  }

  /**
   * Actualizar estado de cita
   * @param {number} id - ID del estado de cita
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Estado de cita actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['nombre', 'descripcion', 'color'];
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
      UPDATE estados_citas 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Estado de cita no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar estado de cita: ${error.message}`);
    }
  }

  /**
   * Eliminar estado de cita
   * @param {number} id - ID del estado de cita
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    // Verificar si tiene citas asociadas
    const citas = await this.obtenerCitasPorEstado(id);
    if (citas.length > 0) {
      throw new Error('No se puede eliminar un estado de cita que tiene citas asociadas');
    }

    const sql = 'DELETE FROM estados_citas WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar estado de cita: ${error.message}`);
    }
  }

  /**
   * Buscar estados de cita por nombre
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Estados de cita encontrados
   */
  static async buscar(termino) {
    const sql = `
      SELECT ec.*, 
             COUNT(c.id) as total_citas
      FROM estados_citas ec
      LEFT JOIN citas c ON ec.id = c.estado_id
      WHERE ec.nombre LIKE ? OR ec.descripcion LIKE ?
      GROUP BY ec.id
      ORDER BY ec.nombre
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(sql, [busquedaParam, busquedaParam]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar estados de cita: ${error.message}`);
    }
  }

  /**
   * Obtener citas por estado
   * @param {number} estado_id - ID del estado de cita
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Citas del estado
   */
  static async obtenerCitasPorEstado(estado_id, opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null, limite = 50 } = opciones;

    // Validar y sanear parámetro limite
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite) || 50));

    let whereConditions = ['c.estado_id = ?'];
    let params = [estado_id];

    if (fecha_inicio) {
      whereConditions.push('c.fecha_hora_inicio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('c.fecha_hora_inicio <= ?');
      params.push(fecha_fin);
    }

    const sql = `
      SELECT c.*, 
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
      FROM citas c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      JOIN empleados e ON c.empleado_id = e.id
      JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN cita_servicio cs ON c.id = cs.cita_id
      LEFT JOIN servicios s ON cs.servicio_id = s.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY c.id
      ORDER BY c.fecha_hora_inicio DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [...params, limiteNum]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener citas por estado: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de estados de cita
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Object>} Estadísticas de estados de cita
   */
  static async obtenerEstadisticas(opciones = {}) {
    const { fecha_inicio = null, fecha_fin = null } = opciones;

    let whereConditions = [];
    let params = [];

    if (fecha_inicio) {
      whereConditions.push('c.fecha_hora_inicio >= ?');
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereConditions.push('c.fecha_hora_inicio <= ?');
      params.push(fecha_fin);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        ec.id,
        ec.nombre,
        ec.descripcion,
        ec.color,
        COUNT(c.id) as total_citas,
        COUNT(CASE WHEN c.fecha_hora_inicio >= NOW() THEN 1 END) as citas_futuras,
        COUNT(CASE WHEN c.fecha_hora_inicio < NOW() THEN 1 END) as citas_pasadas,
        COUNT(CASE WHEN c.fecha_hora_inicio >= CURDATE() AND c.fecha_hora_inicio < DATE_ADD(CURDATE(), INTERVAL 1 DAY) THEN 1 END) as citas_hoy
      FROM estados_citas ec
      LEFT JOIN citas c ON ec.id = c.estado_id
      ${whereClause}
      GROUP BY ec.id
      ORDER BY total_citas DESC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estados de cita por período
   * @param {string} fecha_inicio - Fecha de inicio
   * @param {string} fecha_fin - Fecha de fin
   * @returns {Promise<Array>} Estados de cita por período
   */
  static async obtenerPorPeriodo(fecha_inicio, fecha_fin) {
    const sql = `
      SELECT 
        ec.id,
        ec.nombre,
        ec.descripcion,
        ec.color,
        COUNT(c.id) as total_citas,
        COUNT(CASE WHEN c.fecha_hora_inicio >= NOW() THEN 1 END) as citas_futuras,
        COUNT(CASE WHEN c.fecha_hora_inicio < NOW() THEN 1 END) as citas_pasadas
      FROM estados_citas ec
      LEFT JOIN citas c ON ec.id = c.estado_id
      WHERE c.fecha_hora_inicio BETWEEN ? AND ?
      GROUP BY ec.id
      ORDER BY total_citas DESC
    `;

    try {
      const rows = await query(sql, [fecha_inicio, fecha_fin]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estados por período: ${error.message}`);
    }
  }

  /**
   * Verificar si un estado de cita existe
   * @param {string} nombre - Nombre del estado de cita
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe el estado de cita
   */
  static async existe(nombre, excludeId = null) {
    let sql = 'SELECT COUNT(*) as total FROM estados_citas WHERE nombre = ?';
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
   * Obtener estados de cita sin uso
   * @returns {Promise<Array>} Estados de cita sin uso
   */
  static async obtenerSinUso() {
    const sql = `
      SELECT ec.*, 
             COUNT(c.id) as total_citas
      FROM estados_citas ec
      LEFT JOIN citas c ON ec.id = c.estado_id
      GROUP BY ec.id
      HAVING total_citas = 0
      ORDER BY ec.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estados sin uso: ${error.message}`);
    }
  }

  /**
   * Obtener estado de cita por nombre
   * @param {string} nombre - Nombre del estado
   * @returns {Promise<Object|null>} Estado de cita encontrado
   */
  static async obtenerPorNombre(nombre) {
    const sql = `
      SELECT ec.*, 
             COUNT(c.id) as total_citas
      FROM estados_citas ec
      LEFT JOIN citas c ON ec.id = c.estado_id
      WHERE ec.nombre = ?
      GROUP BY ec.id
    `;

    try {
      const rows = await query(sql, [nombre]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener estado por nombre: ${error.message}`);
    }
  }

  /**
   * Obtener resumen de estados de cita
   * @returns {Promise<Array>} Resumen de estados de cita
   */
  static async obtenerResumen() {
    const sql = `
      SELECT 
        ec.id,
        ec.nombre,
        ec.descripcion,
        ec.color,
        COUNT(c.id) as total_citas,
        COUNT(CASE WHEN c.fecha_hora_inicio >= NOW() THEN 1 END) as citas_futuras,
        COUNT(CASE WHEN c.fecha_hora_inicio < NOW() THEN 1 END) as citas_pasadas,
        MIN(c.fecha_hora_inicio) as primera_cita,
        MAX(c.fecha_hora_inicio) as ultima_cita
      FROM estados_citas ec
      LEFT JOIN citas c ON ec.id = c.estado_id
      GROUP BY ec.id
      ORDER BY total_citas DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener resumen: ${error.message}`);
    }
  }

  /**
   * Crear estados de cita por defecto
   * @returns {Promise<Array>} Estados de cita creados
   */
  static async crearEstadosPorDefecto() {
    const estadosPorDefecto = [
      { nombre: 'Programada', descripcion: 'Cita programada y confirmada', color: '#007bff' },
      { nombre: 'En Proceso', descripcion: 'Cita en curso', color: '#ffc107' },
      { nombre: 'Completada', descripcion: 'Cita finalizada exitosamente', color: '#28a745' },
      { nombre: 'Cancelada', descripcion: 'Cita cancelada por el cliente', color: '#dc3545' },
      { nombre: 'No Asistió', descripcion: 'Cliente no asistió a la cita', color: '#6c757d' },
      { nombre: 'Reprogramada', descripcion: 'Cita reprogramada para otra fecha', color: '#17a2b8' }
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

  /**
   * Obtener estados de cita para el calendario
   * @returns {Promise<Array>} Estados de cita con información para calendario
   */
  static async obtenerParaCalendario() {
    const sql = `
      SELECT 
        ec.id,
        ec.nombre,
        ec.descripcion,
        ec.color,
        COUNT(c.id) as total_citas
      FROM estados_citas ec
      LEFT JOIN citas c ON ec.id = c.estado_id
      GROUP BY ec.id
      ORDER BY ec.nombre
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estados para calendario: ${error.message}`);
    }
  }
}

module.exports = EstadoCita; 