const { query } = require('../config/database');

/**
 * Modelo para la gestión de eventos de Google Calendar
 * Maneja operaciones CRUD, búsquedas, filtros y sincronización con Google Calendar
 */
class EventoGoogleCalendar {
  /**
   * Crear un nuevo evento de Google Calendar
   * @param {Object} evento - Datos del evento
   * @returns {Promise<Object>} Evento creado
   */
  static async crear(evento) {
    const {
      cita_id = null,
      calendario_id,
      event_id,
      evento_creado = 0,
      evento_modificado = 0,
      evento_eliminado = 0
    } = evento;

    const query = `
      INSERT INTO eventos_google_calendar 
      (cita_id, calendario_id, event_id, evento_creado, evento_modificado, evento_eliminado)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [
        cita_id, calendario_id, event_id, evento_creado, evento_modificado, evento_eliminado
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear evento de Google Calendar: ${error.message}`);
    }
  }

  /**
   * Obtener evento por ID
   * @param {number} id - ID del evento
   * @returns {Promise<Object|null>} Evento encontrado
   */
  static async obtenerPorId(id) {
    const query = `
      SELECT egc.*,
             c.fecha_hora_inicio as cita_fecha_inicio,
             c.fecha_hora_fin as cita_fecha_fin,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita,
             cg.calendar_id as google_calendar_id,
             cg.nombre_calendario,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario
      FROM eventos_google_calendar egc
      LEFT JOIN citas c ON egc.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      JOIN calendarios_google cg ON egc.calendario_id = cg.id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      WHERE egc.id = ?
    `;

    try {
      const rows = await query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener evento: ${error.message}`);
    }
  }

  /**
   * Obtener todos los eventos con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de eventos y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      cita_id = null,
      calendario_id = null,
      event_id = null,
      evento_creado = null,
      evento_modificado = null,
      evento_eliminado = null,
      orden = 'created_at',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (cita_id) {
      whereConditions.push('egc.cita_id = ?');
      params.push(cita_id);
    }

    if (calendario_id) {
      whereConditions.push('egc.calendario_id = ?');
      params.push(calendario_id);
    }

    if (event_id) {
      whereConditions.push('egc.event_id = ?');
      params.push(event_id);
    }

    if (evento_creado !== null) {
      whereConditions.push('egc.evento_creado = ?');
      params.push(evento_creado);
    }

    if (evento_modificado !== null) {
      whereConditions.push('egc.evento_modificado = ?');
      params.push(evento_modificado);
    }

    if (evento_eliminado !== null) {
      whereConditions.push('egc.evento_eliminado = ?');
      params.push(evento_eliminado);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT egc.*,
             c.fecha_hora_inicio as cita_fecha_inicio,
             c.fecha_hora_fin as cita_fecha_fin,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita,
             cg.calendar_id as google_calendar_id,
             cg.nombre_calendario,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario
      FROM eventos_google_calendar egc
      LEFT JOIN citas c ON egc.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      JOIN calendarios_google cg ON egc.calendario_id = cg.id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      ${whereClause}
      ORDER BY egc.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM eventos_google_calendar egc
      ${whereClause}
    `;

    try {
      const rows = await query(query, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        eventos: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener eventos: ${error.message}`);
    }
  }

  /**
   * Actualizar evento
   * @param {number} id - ID del evento
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Evento actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'cita_id', 'calendario_id', 'event_id', 'evento_creado', 
      'evento_modificado', 'evento_eliminado', 'ultima_sincronizacion'
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
    const query = `
      UPDATE eventos_google_calendar 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Evento no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar evento: ${error.message}`);
    }
  }

  /**
   * Eliminar evento
   * @param {number} id - ID del evento
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const query = 'DELETE FROM eventos_google_calendar WHERE id = ?';

    try {
      const result = await query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar evento: ${error.message}`);
    }
  }

  /**
   * Obtener evento por event_id de Google
   * @param {string} event_id - ID del evento en Google Calendar
   * @returns {Promise<Object|null>} Evento encontrado
   */
  static async obtenerPorEventId(event_id) {
    const query = `
      SELECT egc.*,
             c.fecha_hora_inicio as cita_fecha_inicio,
             c.fecha_hora_fin as cita_fecha_fin,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita,
             cg.calendar_id as google_calendar_id,
             cg.nombre_calendario,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario
      FROM eventos_google_calendar egc
      LEFT JOIN citas c ON egc.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      JOIN calendarios_google cg ON egc.calendario_id = cg.id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      WHERE egc.event_id = ?
    `;

    try {
      const rows = await query(query, [event_id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener evento por event_id: ${error.message}`);
    }
  }

  /**
   * Obtener eventos por cita
   * @param {number} cita_id - ID de la cita
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Eventos de la cita
   */
  static async obtenerPorCita(cita_id, opciones = {}) {
    const { orden = 'created_at DESC' } = opciones;

    const query = `
      SELECT egc.*,
             c.fecha_hora_inicio as cita_fecha_inicio,
             c.fecha_hora_fin as cita_fecha_fin,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita,
             cg.calendar_id as google_calendar_id,
             cg.nombre_calendario,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario
      FROM eventos_google_calendar egc
      LEFT JOIN citas c ON egc.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      JOIN calendarios_google cg ON egc.calendario_id = cg.id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      WHERE egc.cita_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, [cita_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener eventos por cita: ${error.message}`);
    }
  }

  /**
   * Obtener eventos por calendario
   * @param {number} calendario_id - ID del calendario
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Eventos del calendario
   */
  static async obtenerPorCalendario(calendario_id, opciones = {}) {
    const { orden = 'created_at DESC' } = opciones;

    const query = `
      SELECT egc.*,
             c.fecha_hora_inicio as cita_fecha_inicio,
             c.fecha_hora_fin as cita_fecha_fin,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita,
             cg.calendar_id as google_calendar_id,
             cg.nombre_calendario,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario
      FROM eventos_google_calendar egc
      LEFT JOIN citas c ON egc.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      JOIN calendarios_google cg ON egc.calendario_id = cg.id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      WHERE egc.calendario_id = ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, [calendario_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener eventos por calendario: ${error.message}`);
    }
  }

  /**
   * Buscar eventos por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Eventos encontrados
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 50 } = opciones;

    const query = `
      SELECT egc.*,
             c.fecha_hora_inicio as cita_fecha_inicio,
             c.fecha_hora_fin as cita_fecha_fin,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita,
             cg.calendar_id as google_calendar_id,
             cg.nombre_calendario,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario
      FROM eventos_google_calendar egc
      LEFT JOIN citas c ON egc.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      JOIN calendarios_google cg ON egc.calendario_id = cg.id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      WHERE egc.event_id LIKE ? 
         OR cg.nombre_calendario LIKE ?
         OR CONCAT(cu.nombre, ' ', cu.apellido) LIKE ?
         OR CONCAT(eu.nombre, ' ', eu.apellido) LIKE ?
         OR CONCAT(gu.nombre, ' ', gu.apellido) LIKE ?
      ORDER BY egc.created_at DESC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(query, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar eventos: ${error.message}`);
    }
  }

  /**
   * Obtener eventos pendientes de sincronización
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Eventos pendientes
   */
  static async obtenerPendientesSincronizacion(opciones = {}) {
    const { limite = 100 } = opciones;

    const query = `
      SELECT egc.*,
             c.fecha_hora_inicio as cita_fecha_inicio,
             c.fecha_hora_fin as cita_fecha_fin,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita,
             cg.calendar_id as google_calendar_id,
             cg.nombre_calendario,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario
      FROM eventos_google_calendar egc
      LEFT JOIN citas c ON egc.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      JOIN calendarios_google cg ON egc.calendario_id = cg.id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      WHERE (egc.evento_creado = 0 OR egc.evento_modificado = 1 OR egc.evento_eliminado = 1)
        AND cg.sincronizacion_activa = 1
      ORDER BY egc.created_at ASC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener eventos pendientes: ${error.message}`);
    }
  }

  /**
   * Marcar evento como creado
   * @param {number} id - ID del evento
   * @returns {Promise<Object>} Evento actualizado
   */
  static async marcarComoCreado(id) {
    return await this.actualizar(id, {
      evento_creado: 1,
      evento_modificado: 0,
      evento_eliminado: 0,
      ultima_sincronizacion: new Date()
    });
  }

  /**
   * Marcar evento como modificado
   * @param {number} id - ID del evento
   * @returns {Promise<Object>} Evento actualizado
   */
  static async marcarComoModificado(id) {
    return await this.actualizar(id, {
      evento_modificado: 1,
      ultima_sincronizacion: new Date()
    });
  }

  /**
   * Marcar evento como eliminado
   * @param {number} id - ID del evento
   * @returns {Promise<Object>} Evento actualizado
   */
  static async marcarComoEliminado(id) {
    return await this.actualizar(id, {
      evento_eliminado: 1,
      ultima_sincronizacion: new Date()
    });
  }

  /**
   * Actualizar última sincronización
   * @param {number} id - ID del evento
   * @param {Date} fecha - Fecha de sincronización
   * @returns {Promise<Object>} Evento actualizado
   */
  static async actualizarUltimaSincronizacion(id, fecha = null) {
    return await this.actualizar(id, {
      ultima_sincronizacion: fecha || new Date()
    });
  }

  /**
   * Obtener estadísticas de eventos
   * @returns {Promise<Object>} Estadísticas de eventos
   */
  static async obtenerEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(CASE WHEN evento_creado = 1 THEN 1 END) as eventos_creados,
        COUNT(CASE WHEN evento_modificado = 1 THEN 1 END) as eventos_modificados,
        COUNT(CASE WHEN evento_eliminado = 1 THEN 1 END) as eventos_eliminados,
        COUNT(CASE WHEN cita_id IS NOT NULL THEN 1 END) as eventos_con_cita,
        COUNT(DISTINCT calendario_id) as calendarios_utilizados,
        COUNT(DISTINCT cita_id) as citas_sincronizadas,
        AVG(TIMESTAMPDIFF(MINUTE, created_at, ultima_sincronizacion)) as tiempo_promedio_sincronizacion
      FROM eventos_google_calendar
    `;

    try {
      const rows = await query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por calendario
   * @returns {Promise<Array>} Estadísticas por calendario
   */
  static async obtenerEstadisticasPorCalendario() {
    const query = `
      SELECT cg.id,
             cg.nombre_calendario,
             cg.calendar_id as google_calendar_id,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario,
             COUNT(egc.id) as total_eventos,
             COUNT(CASE WHEN egc.evento_creado = 1 THEN 1 END) as eventos_creados,
             COUNT(CASE WHEN egc.evento_modificado = 1 THEN 1 END) as eventos_modificados,
             COUNT(CASE WHEN egc.evento_eliminado = 1 THEN 1 END) as eventos_eliminados,
             MAX(egc.ultima_sincronizacion) as ultima_sincronizacion
      FROM calendarios_google cg
      LEFT JOIN eventos_google_calendar egc ON cg.id = egc.calendario_id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      GROUP BY cg.id
      ORDER BY total_eventos DESC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por calendario: ${error.message}`);
    }
  }

  /**
   * Obtener eventos por rango de fechas
   * @param {Date} fecha_inicio - Fecha de inicio
   * @param {Date} fecha_fin - Fecha de fin
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Eventos del rango
   */
  static async obtenerPorRangoFechas(fecha_inicio, fecha_fin, opciones = {}) {
    const { orden = 'created_at DESC' } = opciones;

    const query = `
      SELECT egc.*,
             c.fecha_hora_inicio as cita_fecha_inicio,
             c.fecha_hora_fin as cita_fecha_fin,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita,
             cg.calendar_id as google_calendar_id,
             cg.nombre_calendario,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario
      FROM eventos_google_calendar egc
      LEFT JOIN citas c ON egc.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      JOIN calendarios_google cg ON egc.calendario_id = cg.id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      WHERE egc.created_at >= ? AND egc.created_at <= ?
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, [fecha_inicio, fecha_fin]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener eventos por rango de fechas: ${error.message}`);
    }
  }

  /**
   * Exportar eventos a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      cita_id = null,
      calendario_id = null,
      evento_creado = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (cita_id) {
      whereConditions.push('egc.cita_id = ?');
      params.push(cita_id);
    }

    if (calendario_id) {
      whereConditions.push('egc.calendario_id = ?');
      params.push(calendario_id);
    }

    if (evento_creado !== null) {
      whereConditions.push('egc.evento_creado = ?');
      params.push(evento_creado);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT egc.id, egc.cita_id, egc.calendario_id, egc.event_id, egc.evento_creado,
             egc.evento_modificado, egc.evento_eliminado, egc.ultima_sincronizacion, egc.created_at,
             c.fecha_hora_inicio as cita_fecha_inicio,
             c.fecha_hora_fin as cita_fecha_fin,
             CONCAT(cu.nombre, ' ', cu.apellido) as cliente_nombre,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             ec.nombre as estado_cita,
             cg.calendar_id as google_calendar_id,
             cg.nombre_calendario,
             CONCAT(gu.nombre, ' ', gu.apellido) as propietario_calendario
      FROM eventos_google_calendar egc
      LEFT JOIN citas c ON egc.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN usuarios cu ON cl.usuario_id = cu.id
      LEFT JOIN empleados e ON c.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN estados_citas ec ON c.estado_id = ec.id
      JOIN calendarios_google cg ON egc.calendario_id = cg.id
      JOIN usuarios gu ON cg.usuario_id = gu.id
      ${whereClause}
      ORDER BY egc.created_at DESC
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar eventos: ${error.message}`);
    }
  }
}

module.exports = EventoGoogleCalendar; 