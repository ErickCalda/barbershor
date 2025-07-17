const { query } = require('../config/database');

/**
 * Modelo para la gestión de fichas de clientes
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de fichas
 */
class FichaCliente {
  /**
   * Crear una nueva ficha de cliente
   * @param {Object} ficha - Datos de la ficha
   * @returns {Promise<Object>} Ficha creada
   */
  static async crear(ficha) {
    const {
      cliente_id,
      tipo_piel = null,
      alergias = null,
      condiciones_medicas = null,
      preferencias = null,
      notas = null,
      fecha_creacion = new Date()
    } = ficha;

    const sql = `
      INSERT INTO fichas_clientes (cliente_id, tipo_piel, alergias, condiciones_medicas, preferencias, notas, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        cliente_id, tipo_piel, alergias, condiciones_medicas, preferencias, notas, fecha_creacion
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear ficha: ${error.message}`);
    }
  }

  /**
   * Obtener ficha por ID
   * @param {number} id - ID de la ficha
   * @returns {Promise<Object|null>} Ficha encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT fc.*,
             CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
             c.email as cliente_email,
             c.telefono as cliente_telefono,
             c.fecha_nacimiento as cliente_fecha_nacimiento
      FROM fichas_clientes fc
      JOIN clientes c ON fc.cliente_id = c.id
      WHERE fc.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener ficha: ${error.message}`);
    }
  }

  /**
   * Obtener ficha por cliente
   * @param {number} cliente_id - ID del cliente
   * @returns {Promise<Object|null>} Ficha del cliente
   */
  static async obtenerPorCliente(cliente_id) {
    const sql = `
      SELECT fc.*,
             CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
             c.email as cliente_email,
             c.telefono as cliente_telefono,
             c.fecha_nacimiento as cliente_fecha_nacimiento
      FROM fichas_clientes fc
      JOIN clientes c ON fc.cliente_id = c.id
      WHERE fc.cliente_id = ?
    `;

    try {
      const rows = await query(sql, [cliente_id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener ficha del cliente: ${error.message}`);
    }
  }

  /**
   * Obtener todas las fichas con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de fichas y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      tipo_piel = null,
      tiene_alergias = null,
      tiene_condiciones = null,
      orden = 'fecha_creacion',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (tipo_piel) {
      whereConditions.push('fc.tipo_piel = ?');
      params.push(tipo_piel);
    }

    if (tiene_alergias !== null) {
      if (tiene_alergias) {
        whereConditions.push('fc.alergias IS NOT NULL AND fc.alergias != ""');
      } else {
        whereConditions.push('(fc.alergias IS NULL OR fc.alergias = "")');
      }
    }

    if (tiene_condiciones !== null) {
      if (tiene_condiciones) {
        whereConditions.push('fc.condiciones_medicas IS NOT NULL AND fc.condiciones_medicas != ""');
      } else {
        whereConditions.push('(fc.condiciones_medicas IS NULL OR fc.condiciones_medicas = "")');
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT fc.*,
             CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
             c.email as cliente_email,
             c.telefono as cliente_telefono
      FROM fichas_clientes fc
      JOIN clientes c ON fc.cliente_id = c.id
      ${whereClause}
      ORDER BY fc.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM fichas_clientes fc
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        fichas: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener fichas: ${error.message}`);
    }
  }

  /**
   * Actualizar ficha
   * @param {number} id - ID de la ficha
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Ficha actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['tipo_piel', 'alergias', 'condiciones_medicas', 'preferencias', 'notas'];
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
      UPDATE fichas_clientes 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Ficha no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar ficha: ${error.message}`);
    }
  }

  /**
   * Eliminar ficha
   * @param {number} id - ID de la ficha
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM fichas_clientes WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar ficha: ${error.message}`);
    }
  }

  /**
   * Buscar fichas por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Fichas encontradas
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 20 } = opciones;

    const sql = `
      SELECT fc.*,
             CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
             c.email as cliente_email,
             c.telefono as cliente_telefono
      FROM fichas_clientes fc
      JOIN clientes c ON fc.cliente_id = c.id
      WHERE fc.alergias LIKE ? 
         OR fc.condiciones_medicas LIKE ? 
         OR fc.preferencias LIKE ? 
         OR fc.notas LIKE ?
         OR CONCAT(c.nombre, ' ', c.apellido) LIKE ?
      ORDER BY fc.fecha_creacion DESC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(sql, [
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limite
      ]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar fichas: ${error.message}`);
    }
  }

  /**
   * Obtener fichas por tipo de piel
   * @param {string} tipo_piel - Tipo de piel
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Fichas encontradas
   */
  static async obtenerPorTipoPiel(tipo_piel, opciones = {}) {
    const { orden = 'fecha_creacion DESC' } = opciones;

    const sql = `
      SELECT fc.*,
             CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
             c.email as cliente_email,
             c.telefono as cliente_telefono
      FROM fichas_clientes fc
      JOIN clientes c ON fc.cliente_id = c.id
      WHERE fc.tipo_piel = ?
      ORDER BY fc.${orden}
    `;

    try {
      const rows = await query(sql, [tipo_piel]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener fichas por tipo de piel: ${error.message}`);
    }
  }

  /**
   * Obtener clientes con alergias
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Clientes con alergias
   */
  static async obtenerConAlergias(opciones = {}) {
    const { orden = 'fecha_creacion DESC' } = opciones;

    const sql = `
      SELECT fc.*,
             CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
             c.email as cliente_email,
             c.telefono as cliente_telefono
      FROM fichas_clientes fc
      JOIN clientes c ON fc.cliente_id = c.id
      WHERE fc.alergias IS NOT NULL AND fc.alergias != ""
      ORDER BY fc.${orden}
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener clientes con alergias: ${error.message}`);
    }
  }

  /**
   * Obtener clientes con condiciones médicas
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Clientes con condiciones médicas
   */
  static async obtenerConCondicionesMedicas(opciones = {}) {
    const { orden = 'fecha_creacion DESC' } = opciones;

    const sql = `
      SELECT fc.*,
             CONCAT(c.nombre, ' ', c.apellido) as cliente_nombre,
             c.email as cliente_email,
             c.telefono as cliente_telefono
      FROM fichas_clientes fc
      JOIN clientes c ON fc.cliente_id = c.id
      WHERE fc.condiciones_medicas IS NOT NULL AND fc.condiciones_medicas != ""
      ORDER BY fc.${orden}
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener clientes con condiciones médicas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de fichas
   * @returns {Promise<Object>} Estadísticas de fichas
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_fichas,
        COUNT(DISTINCT cliente_id) as clientes_con_ficha,
        COUNT(CASE WHEN alergias IS NOT NULL AND alergias != "" THEN 1 END) as con_alergias,
        COUNT(CASE WHEN condiciones_medicas IS NOT NULL AND condiciones_medicas != "" THEN 1 END) as con_condiciones,
        COUNT(CASE WHEN tipo_piel IS NOT NULL THEN 1 END) as con_tipo_piel,
        COUNT(CASE WHEN preferencias IS NOT NULL AND preferencias != "" THEN 1 END) as con_preferencias
      FROM fichas_clientes
    `;

    try {
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por tipo de piel
   * @returns {Promise<Array>} Estadísticas por tipo de piel
   */
  static async obtenerEstadisticasTipoPiel() {
    const sql = `
      SELECT 
        tipo_piel,
        COUNT(*) as cantidad
      FROM fichas_clientes
      WHERE tipo_piel IS NOT NULL
      GROUP BY tipo_piel
      ORDER BY cantidad DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por tipo de piel: ${error.message}`);
    }
  }

  /**
   * Obtener alergias más comunes
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Alergias más comunes
   */
  static async obtenerAlergiasComunes(limite = 10) {
    const sql = `
      SELECT 
        alergia,
        COUNT(*) as cantidad
      FROM (
        SELECT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fc.alergias, ',', n.n), ',', -1)) as alergia
        FROM fichas_clientes fc
        CROSS JOIN (
          SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
        ) n
        WHERE fc.alergias IS NOT NULL 
          AND fc.alergias != ""
          AND CHAR_LENGTH(fc.alergias) - CHAR_LENGTH(REPLACE(fc.alergias, ',', '')) >= n.n - 1
      ) alergias_separadas
      WHERE alergia != ""
      GROUP BY alergia
      ORDER BY cantidad DESC
      LIMIT ?
    `;

    try {
      const rows = await query(sql, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener alergias comunes: ${error.message}`);
    }
  }

  /**
   * Crear o actualizar ficha de cliente
   * @param {number} cliente_id - ID del cliente
   * @param {Object} datos - Datos de la ficha
   * @returns {Promise<Object>} Ficha creada o actualizada
   */
  static async crearOActualizar(cliente_id, datos) {
    try {
      // Intentar obtener ficha existente
      const fichaExistente = await this.obtenerPorCliente(cliente_id);
      
      if (fichaExistente) {
        // Actualizar ficha existente
        return await this.actualizar(fichaExistente.id, datos);
      } else {
        // Crear nueva ficha
        return await this.crear({
          cliente_id,
          ...datos
        });
      }
    } catch (error) {
      throw new Error(`Error al crear o actualizar ficha: ${error.message}`);
    }
  }

  /**
   * Obtener tipos de piel disponibles
   * @returns {Array} Tipos de piel
   */
  static obtenerTiposPiel() {
    return [
      'Normal',
      'Seco',
      'Graso',
      'Mixto',
      'Sensible',
      'Maduro',
      'Con tendencia acneica',
      'Con manchas',
      'Con rosácea'
    ];
  }

  /**
   * Exportar fichas a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { incluir_datos_cliente = true } = opciones;

    let sql = `
      SELECT fc.*
    `;

    if (incluir_datos_cliente) {
      sql = `
        SELECT fc.*,
               c.nombre as cliente_nombre,
               c.apellido as cliente_apellido,
               c.email as cliente_email,
               c.telefono as cliente_telefono,
               c.fecha_nacimiento as cliente_fecha_nacimiento
      `;
    }

    sql += `
      FROM fichas_clientes fc
      JOIN clientes c ON fc.cliente_id = c.id
      ORDER BY fc.fecha_creacion DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar fichas: ${error.message}`);
    }
  }
}

module.exports = FichaCliente; 