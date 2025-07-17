const { query } = require('../config/database');

/**
 * Modelo para la gestión de plantillas de correo
 * Maneja operaciones CRUD, búsquedas, filtros y gestión de plantillas
 */
class PlantillaCorreo {
  /**
   * Crear una nueva plantilla de correo
   * @param {Object} plantilla - Datos de la plantilla
   * @returns {Promise<Object>} Plantilla creada
   */
  static async crear(plantilla) {
    const {
      nombre,
      asunto,
      contenido_html,
      contenido_texto = null,
      tipo,
      activo = 1,
      variables = null
    } = plantilla;

    const sql = `
      INSERT INTO plantillas_correo (nombre, asunto, contenido_html, contenido_texto, tipo, activo, variables)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        nombre, asunto, contenido_html, contenido_texto, tipo, activo, variables
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear plantilla: ${error.message}`);
    }
  }

  /**
   * Obtener plantilla por ID
   * @param {number} id - ID de la plantilla
   * @returns {Promise<Object|null>} Plantilla encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT pc.*,
             COUNT(ce.id) as total_correos_enviados,
             COUNT(cp.id) as total_correos_programados
      FROM plantillas_correo pc
      LEFT JOIN correos_enviados ce ON pc.id = ce.plantilla_id
      LEFT JOIN correos_programados cp ON pc.id = cp.plantilla_id
      WHERE pc.id = ?
      GROUP BY pc.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener plantilla: ${error.message}`);
    }
  }

  /**
   * Obtener plantilla por tipo
   * @param {string} tipo - Tipo de plantilla
   * @returns {Promise<Object|null>} Plantilla encontrada
   */
  static async obtenerPorTipo(tipo) {
    const sql = `
      SELECT pc.*,
             COUNT(ce.id) as total_correos_enviados,
             COUNT(cp.id) as total_correos_programados
      FROM plantillas_correo pc
      LEFT JOIN correos_enviados ce ON pc.id = ce.plantilla_id
      LEFT JOIN correos_programados cp ON pc.id = cp.plantilla_id
      WHERE pc.tipo = ? AND pc.activo = 1
      GROUP BY pc.id
      ORDER BY pc.id DESC
      LIMIT 1
    `;

    try {
      const rows = await query(sql, [tipo]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener plantilla por tipo: ${error.message}`);
    }
  }

  /**
   * Obtener todas las plantillas con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de plantillas y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      tipo = null,
      activo = null,
      orden = 'nombre',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (tipo) {
      whereConditions.push('pc.tipo = ?');
      params.push(tipo);
    }

    if (activo !== null) {
      whereConditions.push('pc.activo = ?');
      params.push(activo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT pc.*,
             COUNT(ce.id) as total_correos_enviados,
             COUNT(cp.id) as total_correos_programados
      FROM plantillas_correo pc
      LEFT JOIN correos_enviados ce ON pc.id = ce.plantilla_id
      LEFT JOIN correos_programados cp ON pc.id = cp.plantilla_id
      ${whereClause}
      GROUP BY pc.id
      ORDER BY pc.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM plantillas_correo pc
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        plantillas: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener plantillas: ${error.message}`);
    }
  }

  /**
   * Actualizar plantilla
   * @param {number} id - ID de la plantilla
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Plantilla actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['nombre', 'asunto', 'contenido_html', 'contenido_texto', 'tipo', 'activo', 'variables'];
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
      UPDATE plantillas_correo 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Plantilla no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar plantilla: ${error.message}`);
    }
  }

  /**
   * Eliminar plantilla
   * @param {number} id - ID de la plantilla
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    // Verificar si hay correos asociados
    const correosAsociados = await this.verificarCorreosAsociados(id);
    if (correosAsociados) {
      throw new Error('No se puede eliminar la plantilla porque tiene correos asociados');
    }

    const sql = 'DELETE FROM plantillas_correo WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar plantilla: ${error.message}`);
    }
  }

  /**
   * Verificar si hay correos asociados
   * @param {number} plantilla_id - ID de la plantilla
   * @returns {Promise<boolean>} Tiene correos asociados
   */
  static async verificarCorreosAsociados(plantilla_id) {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM correos_enviados WHERE plantilla_id = ?) +
        (SELECT COUNT(*) FROM correos_programados WHERE plantilla_id = ?) as total
    `;

    try {
      const rows = await query(sql, [plantilla_id, plantilla_id]);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al verificar correos asociados: ${error.message}`);
    }
  }

  /**
   * Buscar plantillas por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Plantillas encontradas
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 20 } = opciones;

    const sql = `
      SELECT pc.*,
             COUNT(ce.id) as total_correos_enviados,
             COUNT(cp.id) as total_correos_programados
      FROM plantillas_correo pc
      LEFT JOIN correos_enviados ce ON pc.id = ce.plantilla_id
      LEFT JOIN correos_programados cp ON pc.id = cp.plantilla_id
      WHERE pc.nombre LIKE ? 
         OR pc.asunto LIKE ? 
         OR pc.contenido_html LIKE ?
         OR pc.contenido_texto LIKE ?
      GROUP BY pc.id
      ORDER BY pc.nombre ASC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar plantillas: ${error.message}`);
    }
  }

  /**
   * Obtener plantillas por tipo
   * @param {string} tipo - Tipo de plantilla
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Plantillas del tipo
   */
  static async obtenerPorTipo(tipo, opciones = {}) {
    const { activo = null, orden = 'nombre ASC' } = opciones;

    let whereConditions = ['pc.tipo = ?'];
    let params = [tipo];

    if (activo !== null) {
      whereConditions.push('pc.activo = ?');
      params.push(activo);
    }

    const sql = `
      SELECT pc.*,
             COUNT(ce.id) as total_correos_enviados,
             COUNT(cp.id) as total_correos_programados
      FROM plantillas_correo pc
      LEFT JOIN correos_enviados ce ON pc.id = ce.plantilla_id
      LEFT JOIN correos_programados cp ON pc.id = cp.plantilla_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY pc.id
      ORDER BY pc.${orden}
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener plantillas por tipo: ${error.message}`);
    }
  }

  /**
   * Obtener plantillas activas
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Plantillas activas
   */
  static async obtenerActivas(opciones = {}) {
    const { orden = 'nombre ASC' } = opciones;

    const sql = `
      SELECT pc.*,
             COUNT(ce.id) as total_correos_enviados,
             COUNT(cp.id) as total_correos_programados
      FROM plantillas_correo pc
      LEFT JOIN correos_enviados ce ON pc.id = ce.plantilla_id
      LEFT JOIN correos_programados cp ON pc.id = cp.plantilla_id
      WHERE pc.activo = 1
      GROUP BY pc.id
      ORDER BY pc.${orden}
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener plantillas activas: ${error.message}`);
    }
  }

  /**
   * Activar/desactivar plantilla
   * @param {number} id - ID de la plantilla
   * @param {boolean} activo - Estado activo
   * @returns {Promise<Object>} Plantilla actualizada
   */
  static async cambiarEstado(id, activo) {
    const sql = `
      UPDATE plantillas_correo 
      SET activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [activo ? 1 : 0, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Plantilla no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al cambiar estado de la plantilla: ${error.message}`);
    }
  }

  /**
   * Procesar plantilla con variables
   * @param {number} plantilla_id - ID de la plantilla
   * @param {Object} variables - Variables para reemplazar
   * @returns {Promise<Object>} Plantilla procesada
   */
  static async procesarPlantilla(plantilla_id, variables) {
    const plantilla = await this.obtenerPorId(plantilla_id);
    
    if (!plantilla) {
      throw new Error('Plantilla no encontrada');
    }

    if (!plantilla.activo) {
      throw new Error('Plantilla inactiva');
    }

    let contenido_html = plantilla.contenido_html;
    let contenido_texto = plantilla.contenido_texto;
    let asunto = plantilla.asunto;

    // Reemplazar variables en el contenido
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      contenido_html = contenido_html.replace(regex, variables[key]);
      if (contenido_texto) {
        contenido_texto = contenido_texto.replace(regex, variables[key]);
      }
      asunto = asunto.replace(regex, variables[key]);
    });

    return {
      ...plantilla,
      contenido_html_procesado: contenido_html,
      contenido_texto_procesado: contenido_texto,
      asunto_procesado: asunto
    };
  }

  /**
   * Obtener tipos disponibles
   * @returns {Promise<Array>} Tipos disponibles
   */
  static async obtenerTipos() {
    const sql = `
      SELECT DISTINCT tipo, COUNT(*) as cantidad
      FROM plantillas_correo
      GROUP BY tipo
      ORDER BY tipo ASC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener tipos: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de plantillas
   * @returns {Promise<Object>} Estadísticas de plantillas
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_plantillas,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as plantillas_activas,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as plantillas_inactivas,
        COUNT(DISTINCT tipo) as tipos_diferentes,
        AVG(LENGTH(contenido_html)) as promedio_longitud_html,
        AVG(LENGTH(contenido_texto)) as promedio_longitud_texto
      FROM plantillas_correo
    `;

    try {
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener plantillas más utilizadas
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Plantillas más utilizadas
   */
  static async obtenerMasUtilizadas(limite = 10) {
    const sql = `
      SELECT pc.*,
             COUNT(ce.id) as total_correos_enviados,
             COUNT(cp.id) as total_correos_programados,
             (COUNT(ce.id) + COUNT(cp.id)) as total_uso
      FROM plantillas_correo pc
      LEFT JOIN correos_enviados ce ON pc.id = ce.plantilla_id
      LEFT JOIN correos_programados cp ON pc.id = cp.plantilla_id
      GROUP BY pc.id
      ORDER BY total_uso DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener plantillas más utilizadas: ${error.message}`);
    }
  }

  /**
   * Obtener tipos predefinidos comunes
   * @returns {Array} Tipos predefinidos
   */
  static obtenerTiposPredefinidos() {
    return [
      'confirmacion_cita',
      'recordatorio_cita',
      'cancelacion_cita',
      'bienvenida_cliente',
      'recordatorio_pago',
      'confirmacion_pago',
      'notificacion_general',
      'promocion',
      'cumpleanos',
      'feedback'
    ];
  }

  /**
   * Crear plantillas predefinidas
   * @returns {Promise<Array>} Plantillas creadas
   */
  static async crearPlantillasPredefinidas() {
    const plantillasPredefinidas = [
      {
        nombre: 'Confirmación de Cita',
        asunto: 'Confirmación de tu cita - {{fecha}}',
        contenido_html: `
          <h2>¡Hola {{nombre_cliente}}!</h2>
          <p>Tu cita ha sido confirmada para el {{fecha}} a las {{hora}}.</p>
          <p><strong>Servicios:</strong> {{servicios}}</p>
          <p><strong>Empleado:</strong> {{empleado}}</p>
          <p>Te esperamos en nuestro local.</p>
        `,
        contenido_texto: 'Tu cita ha sido confirmada para el {{fecha}} a las {{hora}}. Servicios: {{servicios}}. Empleado: {{empleado}}.',
        tipo: 'confirmacion_cita',
        variables: 'nombre_cliente,fecha,hora,servicios,empleado'
      },
      {
        nombre: 'Recordatorio de Cita',
        asunto: 'Recordatorio: Tu cita es mañana - {{fecha}}',
        contenido_html: `
          <h2>Recordatorio de cita</h2>
          <p>Hola {{nombre_cliente}},</p>
          <p>Te recordamos que tienes una cita mañana {{fecha}} a las {{hora}}.</p>
          <p><strong>Servicios:</strong> {{servicios}}</p>
          <p><strong>Empleado:</strong> {{empleado}}</p>
          <p>Si necesitas cambiar o cancelar, contáctanos.</p>
        `,
        contenido_texto: 'Recordatorio: Tu cita es mañana {{fecha}} a las {{hora}}. Servicios: {{servicios}}. Empleado: {{empleado}}.',
        tipo: 'recordatorio_cita',
        variables: 'nombre_cliente,fecha,hora,servicios,empleado'
      },
      {
        nombre: 'Bienvenida Cliente',
        asunto: '¡Bienvenido a nuestra peluquería!',
        contenido_html: `
          <h2>¡Bienvenido {{nombre_cliente}}!</h2>
          <p>Gracias por registrarte en nuestra peluquería.</p>
          <p>Estamos emocionados de tenerte como cliente.</p>
          <p>Puedes agendar tu primera cita desde nuestra aplicación.</p>
        `,
        contenido_texto: '¡Bienvenido {{nombre_cliente}}! Gracias por registrarte en nuestra peluquería.',
        tipo: 'bienvenida_cliente',
        variables: 'nombre_cliente'
      }
    ];

    const plantillasCreadas = [];

    for (const plantilla of plantillasPredefinidas) {
      try {
        const plantillaCreada = await this.crear(plantilla);
        plantillasCreadas.push(plantillaCreada);
      } catch (error) {
        console.error(`Error al crear plantilla predefinida ${plantilla.nombre}:`, error);
      }
    }

    return plantillasCreadas;
  }
}

module.exports = PlantillaCorreo; 