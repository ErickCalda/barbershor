const { query } = require('../config/database');

/**
 * Modelo para la gestión de configuraciones de Google
 * Maneja operaciones CRUD, búsquedas, filtros y configuración de integraciones con Google
 */
class ConfiguracionGoogle {
  /**
   * Crear una nueva configuración de Google
   * @param {Object} configuracion - Datos de la configuración
   * @returns {Promise<Object>} Configuración creada
   */
  static async crear(configuracion) {
    const {
      nombre,
      valor = null,
      descripcion = null,
      activo = 1
    } = configuracion;

    const query = `
      INSERT INTO configuraciones_google (nombre, valor, descripcion, activo)
      VALUES (?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [nombre, valor, descripcion, activo]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear configuración de Google: ${error.message}`);
    }
  }

  /**
   * Obtener configuración por ID
   * @param {number} id - ID de la configuración
   * @returns {Promise<Object|null>} Configuración encontrada
   */
  static async obtenerPorId(id) {
    const query = 'SELECT * FROM configuraciones_google WHERE id = ?';

    try {
      const rows = await query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener configuración de Google: ${error.message}`);
    }
  }

  /**
   * Obtener configuración por nombre
   * @param {string} nombre - Nombre de la configuración
   * @returns {Promise<Object|null>} Configuración encontrada
   */
  static async obtenerPorNombre(nombre) {
    const query = 'SELECT * FROM configuraciones_google WHERE nombre = ?';

    try {
      const rows = await query(query, [nombre]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener configuración por nombre: ${error.message}`);
    }
  }

  /**
   * Obtener todas las configuraciones con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de configuraciones y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      activo = null,
      orden = 'nombre',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (activo !== null) {
      whereConditions.push('activo = ?');
      params.push(activo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT * FROM configuraciones_google
      ${whereClause}
      ORDER BY ${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM configuraciones_google
      ${whereClause}
    `;

    try {
      const rows = await query(query, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        configuraciones: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener configuraciones de Google: ${error.message}`);
    }
  }

  /**
   * Actualizar configuración
   * @param {number} id - ID de la configuración
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Configuración actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['nombre', 'valor', 'descripcion', 'acto'];
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
      UPDATE configuraciones_google 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Configuración de Google no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar configuración de Google: ${error.message}`);
    }
  }

  /**
   * Eliminar configuración
   * @param {number} id - ID de la configuración
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const query = 'DELETE FROM configuraciones_google WHERE id = ?';

    try {
      const result = await query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar configuración de Google: ${error.message}`);
    }
  }

  /**
   * Buscar configuraciones por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Configuraciones encontradas
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 20 } = opciones;

    const query = `
      SELECT * FROM configuraciones_google
      WHERE nombre LIKE ? 
         OR descripcion LIKE ?
         OR valor LIKE ?
      ORDER BY nombre ASC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(query, [searchTerm, searchTerm, searchTerm, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar configuraciones: ${error.message}`);
    }
  }

  /**
   * Obtener configuraciones activas
   * @returns {Promise<Array>} Configuraciones activas
   */
  static async obtenerActivas() {
    const query = `
      SELECT * FROM configuraciones_google
      WHERE activo = 1
      ORDER BY nombre ASC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener configuraciones activas: ${error.message}`);
    }
  }

  /**
   * Activar/desactivar configuración
   * @param {number} id - ID de la configuración
   * @param {boolean} activo - Estado activo
   * @returns {Promise<Object>} Configuración actualizada
   */
  static async cambiarEstado(id, activo) {
    const query = `
      UPDATE configuraciones_google 
      SET activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, [activo ? 1 : 0, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Configuración de Google no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al cambiar estado de la configuración: ${error.message}`);
    }
  }

  /**
   * Obtener valor de configuración
   * @param {string} nombre - Nombre de la configuración
   * @returns {Promise<string|null>} Valor de la configuración
   */
  static async obtenerValor(nombre) {
    const configuracion = await this.obtenerPorNombre(nombre);
    return configuracion ? configuracion.valor : null;
  }

  /**
   * Establecer valor de configuración
   * @param {string} nombre - Nombre de la configuración
   * @param {string} valor - Valor de la configuración
   * @param {string} descripcion - Descripción opcional
   * @returns {Promise<Object>} Configuración actualizada o creada
   */
  static async establecerValor(nombre, valor, descripcion = null) {
    const configuracion = await this.obtenerPorNombre(nombre);
    
    if (configuracion) {
      return await this.actualizar(configuracion.id, { valor, descripcion });
    } else {
      return await this.crear({ nombre, valor, descripcion });
    }
  }

  /**
   * Obtener múltiples configuraciones por nombres
   * @param {Array} nombres - Array de nombres de configuraciones
   * @returns {Promise<Object>} Objeto con configuraciones
   */
  static async obtenerMultiples(nombres) {
    const placeholders = nombres.map(() => '?').join(',');
    const query = `
      SELECT * FROM configuraciones_google
      WHERE nombre IN (${placeholders})
      AND activo = 1
    `;

    try {
      const rows = await query(query, nombres);
      
      const configuraciones = {};
      rows.forEach(row => {
        configuraciones[row.nombre] = row.valor;
      });
      
      return configuraciones;
    } catch (error) {
      throw new Error(`Error al obtener múltiples configuraciones: ${error.message}`);
    }
  }

  /**
   * Establecer múltiples configuraciones
   * @param {Object} configuraciones - Objeto con configuraciones
   * @returns {Promise<Array>} Configuraciones actualizadas
   */
  static async establecerMultiples(configuraciones) {
    const resultados = [];

    for (const [nombre, valor] of Object.entries(configuraciones)) {
      try {
        const resultado = await this.establecerValor(nombre, valor);
        resultados.push(resultado);
      } catch (error) {
        console.error(`Error al establecer configuración ${nombre}:`, error);
      }
    }

    return resultados;
  }

  /**
   * Obtener configuraciones por tipo
   * @param {string} tipo - Tipo de configuración (calendar, auth, api, etc.)
   * @returns {Promise<Array>} Configuraciones del tipo
   */
  static async obtenerPorTipo(tipo) {
    const query = `
      SELECT * FROM configuraciones_google
      WHERE nombre LIKE ?
      AND activo = 1
      ORDER BY nombre ASC
    `;

    try {
      const rows = await query(query, [`${tipo}%`]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener configuraciones por tipo: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de configuraciones
   * @returns {Promise<Object>} Estadísticas de configuraciones
   */
  static async obtenerEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total_configuraciones,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as configuraciones_activas,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as configuraciones_inactivas,
        COUNT(CASE WHEN valor IS NOT NULL AND valor != '' THEN 1 END) as con_valor,
        COUNT(CASE WHEN descripcion IS NOT NULL AND descripcion != '' THEN 1 END) as con_descripcion
      FROM configuraciones_google
    `;

    try {
      const rows = await query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener configuraciones por tipo con estadísticas
   * @returns {Promise<Array>} Estadísticas por tipo
   */
  static async obtenerEstadisticasPorTipo() {
    const query = `
      SELECT 
        SUBSTRING_INDEX(nombre, '_', 1) as tipo,
        COUNT(*) as total_configuraciones,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as configuraciones_activas,
        COUNT(CASE WHEN valor IS NOT NULL AND valor != '' THEN 1 END) as con_valor
      FROM configuraciones_google
      GROUP BY SUBSTRING_INDEX(nombre, '_', 1)
      ORDER BY total_configuraciones DESC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por tipo: ${error.message}`);
    }
  }

  /**
   * Obtener configuraciones de autenticación
   * @returns {Promise<Object>} Configuraciones de autenticación
   */
  static async obtenerConfiguracionAuth() {
    const configuraciones = await this.obtenerMultiples([
      'google_client_id',
      'google_client_secret',
      'google_redirect_uri',
      'google_scope',
      'google_auth_url'
    ]);

    return configuraciones;
  }

  /**
   * Obtener configuraciones de Calendar
   * @returns {Promise<Object>} Configuraciones de Calendar
   */
  static async obtenerConfiguracionCalendar() {
    const configuraciones = await this.obtenerMultiples([
      'calendar_api_key',
      'calendar_timezone',
      'calendar_default_reminder',
      'calendar_sync_interval'
    ]);

    return configuraciones;
  }

  /**
   * Obtener configuraciones de API
   * @returns {Promise<Object>} Configuraciones de API
   */
  static async obtenerConfiguracionAPI() {
    const configuraciones = await this.obtenerMultiples([
      'api_base_url',
      'api_version',
      'api_timeout',
      'api_retry_attempts'
    ]);

    return configuraciones;
  }

  /**
   * Validar configuración requerida
   * @param {Array} configuracionesRequeridas - Array de configuraciones requeridas
   * @returns {Promise<Object>} Resultado de la validación
   */
  static async validarConfiguracionRequerida(configuracionesRequeridas) {
    const configuraciones = await this.obtenerMultiples(configuracionesRequeridas);
    
    const faltantes = configuracionesRequeridas.filter(nombre => !configuraciones[nombre]);
    const validas = configuracionesRequeridas.filter(nombre => configuraciones[nombre]);

    return {
      valida: faltantes.length === 0,
      configuraciones: configuraciones,
      faltantes: faltantes,
      validas: validas
    };
  }

  /**
   * Exportar configuraciones a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      activo = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (activo !== null) {
      whereConditions.push('activo = ?');
      params.push(activo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT id, nombre, valor, descripcion, activo, created_at, updated_at
      FROM configuraciones_google
      ${whereClause}
      ORDER BY nombre ASC
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar configuraciones: ${error.message}`);
    }
  }
}

module.exports = ConfiguracionGoogle; 