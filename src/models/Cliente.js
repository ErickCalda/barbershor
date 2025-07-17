const { query } = require('../config/database');

/**
 * Modelo para la tabla clientes
 * Maneja todas las operaciones CRUD y consultas relacionadas con clientes
 */
class Cliente {
  /**
   * Crear un nuevo cliente
   * @param {Object} clienteData - Datos del cliente
   * @returns {Object} - Cliente creado
   */
  static async crear(clienteData) {
    try {
      const {
        usuario_id,
        fecha_nacimiento,
        genero,
        notas_preferencias,
        ultima_visita
      } = clienteData;

      const sql = `
        INSERT INTO clientes (
          usuario_id, fecha_nacimiento, genero, notas_preferencias, ultima_visita
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const params = [usuario_id, fecha_nacimiento, genero, notas_preferencias, ultima_visita];

      const result = await query(sql, params);
      return { id: result.insertId, ...clienteData };
    } catch (error) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener cliente por ID
   * @param {number} id - ID del cliente
   * @returns {Object|null} - Cliente encontrado o null
   */
  static async obtenerPorId(id) {
    try {
      const sql = `
        SELECT c.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil,
               u.activo, u.fecha_registro, u.ultimo_acceso,
               r.nombre as rol_nombre
        FROM clientes c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE c.id = ?
      `;
      
      const clientes = await query(sql, [id]);
      return clientes.length > 0 ? clientes[0] : null;
    } catch (error) {
      console.error('Error obteniendo cliente por ID:', error);
      throw error;
    }
  }

  /**
   * Obtener cliente por usuario_id
   * @param {number} usuario_id - ID del usuario
   * @returns {Object|null} - Cliente encontrado o null
   */
  static async obtenerPorUsuarioId(usuario_id) {
    try {
      const sql = `
        SELECT c.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil,
               u.activo, u.fecha_registro, u.ultimo_acceso,
               r.nombre as rol_nombre
        FROM clientes c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE c.usuario_id = ?
      `;
      
      const clientes = await query(sql, [usuario_id]);
      return clientes.length > 0 ? clientes[0] : null;
    } catch (error) {
      console.error('Error obteniendo cliente por usuario_id:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los clientes con filtros opcionales
   * @param {Object} filtros - Filtros opcionales
   * @returns {Array} - Lista de clientes
   */
  static async obtenerTodos(filtros = {}) {
    try {
      let sql = `
        SELECT c.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil,
               u.activo, u.fecha_registro, u.ultimo_acceso,
               r.nombre as rol_nombre
        FROM clientes c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        INNER JOIN roles r ON u.rol_id = r.id
      `;
      
      const params = [];
      const condiciones = [];

      // Aplicar filtros
      if (filtros.activo !== undefined) {
        condiciones.push('u.activo = ?');
        params.push(filtros.activo);
      }

      if (filtros.genero) {
        condiciones.push('c.genero = ?');
        params.push(filtros.genero);
      }

      if (filtros.busqueda) {
        condiciones.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)');
        const busqueda = `%${filtros.busqueda}%`;
        params.push(busqueda, busqueda, busqueda);
      }

      if (filtros.fecha_desde) {
        condiciones.push('c.fecha_nacimiento >= ?');
        params.push(filtros.fecha_desde);
      }

      if (filtros.fecha_hasta) {
        condiciones.push('c.fecha_nacimiento <= ?');
        params.push(filtros.fecha_hasta);
      }

      if (condiciones.length > 0) {
        sql += ' WHERE ' + condiciones.join(' AND ');
      }

      // Ordenamiento
      sql += ' ORDER BY u.nombre, u.apellido';

      // Paginación con validación
      if (filtros.limite) {
        const limiteNum = Math.max(1, Math.min(100, parseInt(filtros.limite) || 10));
        sql += ' LIMIT ?';
        params.push(limiteNum);
        
        if (filtros.offset) {
          const offsetNum = Math.max(0, parseInt(filtros.offset) || 0);
          sql += ' OFFSET ?';
          params.push(offsetNum);
        }
      }

      const clientes = await query(sql, params);
      return clientes;
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      throw error;
    }
  }

  /**
   * Actualizar cliente
   * @param {number} id - ID del cliente
   * @param {Object} clienteData - Datos a actualizar
   * @returns {boolean} - True si se actualizó correctamente
   */
  static async actualizar(id, clienteData) {
    try {
      const camposPermitidos = [
        'fecha_nacimiento', 'genero', 'notas_preferencias', 'ultima_visita'
      ];

      const camposActualizar = [];
      const valores = [];

      // Filtrar solo campos permitidos
      for (const campo of camposPermitidos) {
        if (clienteData[campo] !== undefined) {
          camposActualizar.push(`${campo} = ?`);
          valores.push(clienteData[campo]);
        }
      }

      if (camposActualizar.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
      }

      valores.push(id);
      const sql = `UPDATE clientes SET ${camposActualizar.join(', ')} WHERE id = ?`;
      
      const result = await query(sql, valores);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando cliente:', error);
      throw error;
    }
  }

  /**
   * Actualizar última visita
   * @param {number} id - ID del cliente
   * @param {Date} fecha - Fecha de la visita
   * @returns {boolean} - True si se actualizó correctamente
   */
  static async actualizarUltimaVisita(id, fecha = new Date()) {
    try {
      const sql = 'UPDATE clientes SET ultima_visita = ? WHERE id = ?';
      const result = await query(sql, [fecha, id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error actualizando última visita:', error);
      throw error;
    }
  }

  /**
   * Eliminar cliente
   * @param {number} id - ID del cliente
   * @returns {boolean} - True si se eliminó correctamente
   */
  static async eliminar(id) {
    try {
      const sql = 'DELETE FROM clientes WHERE id = ?';
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      throw error;
    }
  }

  /**
   * Verificar si existe un cliente por usuario_id
   * @param {number} usuario_id - ID del usuario a verificar
   * @returns {boolean} - True si existe
   */
  static async existePorUsuarioId(usuario_id) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM clientes WHERE usuario_id = ?';
      const result = await query(sql, [usuario_id]);
      return result[0].count > 0;
    } catch (error) {
      console.error('Error verificando existencia por usuario_id:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de clientes
   * @returns {Object} - Estadísticas
   */
  static async obtenerEstadisticas() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_clientes,
          COUNT(CASE WHEN c.ultima_visita >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as clientes_activos_30dias,
          COUNT(CASE WHEN c.ultima_visita >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 1 END) as clientes_activos_90dias,
          COUNT(CASE WHEN c.ultima_visita IS NULL THEN 1 END) as clientes_sin_visitas,
          COUNT(CASE WHEN c.genero = 'Masculino' THEN 1 END) as clientes_masculinos,
          COUNT(CASE WHEN c.genero = 'Femenino' THEN 1 END) as clientes_femeninos,
          AVG(YEAR(NOW()) - YEAR(c.fecha_nacimiento)) as edad_promedio
        FROM clientes c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        WHERE u.activo = 1
      `;

      const result = await query(sql);
      return result[0];
    } catch (error) {
      console.error('Error obteniendo estadísticas de clientes:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes por rango de edad
   * @param {number} edadMin - Edad mínima
   * @param {number} edadMax - Edad máxima
   * @returns {Array} - Lista de clientes en el rango
   */
  static async obtenerPorRangoEdad(edadMin, edadMax) {
    try {
      const sql = `
        SELECT c.*, u.nombre, u.apellido, u.email, u.telefono,
               YEAR(NOW()) - YEAR(c.fecha_nacimiento) as edad
        FROM clientes c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        WHERE u.activo = 1 
        AND YEAR(NOW()) - YEAR(c.fecha_nacimiento) BETWEEN ? AND ?
        ORDER BY edad
      `;

      const clientes = await query(sql, [edadMin, edadMax]);
      return clientes;
    } catch (error) {
      console.error('Error obteniendo clientes por rango de edad:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes inactivos (sin visitas recientes)
   * @param {number} dias - Número de días para considerar inactivo
   * @returns {Array} - Lista de clientes inactivos
   */
  static async obtenerInactivos(dias = 90) {
    try {
      const sql = `
        SELECT c.*, u.nombre, u.apellido, u.email, u.telefono,
               c.ultima_visita, DATEDIFF(NOW(), c.ultima_visita) as dias_inactivo
        FROM clientes c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        WHERE u.activo = 1 
        AND (c.ultima_visita IS NULL OR c.ultima_visita < DATE_SUB(NOW(), INTERVAL ? DAY))
        ORDER BY c.ultima_visita ASC
      `;

      const clientes = await query(sql, [dias]);
      return clientes;
    } catch (error) {
      console.error('Error obteniendo clientes inactivos:', error);
      throw error;
    }
  }

  /**
   * Obtener clientes frecuentes
   * @param {number} limite - Número de clientes a retornar
   * @returns {Array} - Lista de clientes frecuentes
   */
  static async obtenerFrecuentes(limite = 10) {
    try {
      const sql = `
        SELECT c.*, u.nombre, u.apellido, u.email, u.telefono,
               COUNT(citas.id) as total_citas,
               MAX(citas.fecha_hora_inicio) as ultima_cita
        FROM clientes c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        LEFT JOIN citas ON c.id = citas.cliente_id
        WHERE u.activo = 1
        GROUP BY c.id
        HAVING total_citas > 0
        ORDER BY total_citas DESC
        LIMIT ?
      `;

      const clientes = await query(sql, [limite]);
      return clientes;
    } catch (error) {
      console.error('Error obteniendo clientes frecuentes:', error);
      throw error;
    }
  }

  /**
   * Buscar clientes
   * @param {string} termino - Término de búsqueda
   * @returns {Array} - Lista de clientes que coinciden
   */
  static async buscar(termino) {
    try {
      const sql = `
        SELECT c.*, u.nombre, u.apellido, u.email, u.telefono, u.foto_perfil
        FROM clientes c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        WHERE u.activo = 1 AND (
          u.nombre LIKE ? OR 
          u.apellido LIKE ? OR 
          u.email LIKE ? OR
          u.telefono LIKE ? OR
          CONCAT(u.nombre, ' ', u.apellido) LIKE ?
        )
        ORDER BY u.nombre, u.apellido
        LIMIT 20
      `;

      const busqueda = `%${termino}%`;
      const clientes = await query(sql, [busqueda, busqueda, busqueda, busqueda, busqueda]);
      return clientes;
    } catch (error) {
      console.error('Error buscando clientes:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de citas de un cliente
   * @param {number} clienteId - ID del cliente
   * @returns {Array} - Historial de citas
   */
  static async obtenerHistorialCitas(clienteId) {
    try {
      const sql = `
        SELECT c.*, citas.fecha_hora_inicio, citas.fecha_hora_fin, citas.notas,
               ec.nombre as estado_cita,
               CONCAT(u_emp.nombre, ' ', u_emp.apellido) as empleado_nombre,
               GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
        FROM clientes c
        INNER JOIN citas ON c.id = citas.cliente_id
        INNER JOIN estados_citas ec ON citas.estado_id = ec.id
        INNER JOIN empleados e ON citas.empleado_id = e.id
        INNER JOIN usuarios u_emp ON e.usuario_id = u_emp.id
        LEFT JOIN cita_servicio cs ON citas.id = cs.cita_id
        LEFT JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.id = ?
        GROUP BY citas.id
        ORDER BY citas.fecha_hora_inicio DESC
      `;

      const historial = await query(sql, [clienteId]);
      return historial;
    } catch (error) {
      console.error('Error obteniendo historial de citas:', error);
      throw error;
    }
  }
}

module.exports = Cliente; 