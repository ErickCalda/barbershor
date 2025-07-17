const { query } = require('../config/database');

/**
 * Modelo para la gestión de configuraciones del sistema
 * Maneja operaciones CRUD, búsquedas, filtros y gestión de configuraciones
 */
class Configuracion {
  /**
   * Crear una nueva configuración
   * @param {Object} configuracion - Datos de la configuración
   * @returns {Promise<Object>} Configuración creada
   */
  static async crear(configuracion) {
    const {
      clave,
      valor,
      descripcion = null,
      tipo = 'string',
      categoria = 'general',
      editable = 1,
      visible = 1
    } = configuracion;

    // Verificar si la clave ya existe
    const existente = await this.obtenerPorClave(clave);
    if (existente) {
      throw new Error('Ya existe una configuración con esa clave');
    }

    const query = `
      INSERT INTO configuraciones (clave, valor, descripcion, tipo, categoria, editable, visible)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [
        clave, valor, descripcion, tipo, categoria, editable, visible
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear configuración: ${error.message}`);
    }
  }

  /**
   * Obtener configuración por ID
   * @param {number} id - ID de la configuración
   * @returns {Promise<Object|null>} Configuración encontrada
   */
  static async obtenerPorId(id) {
    const query = 'SELECT * FROM configuraciones WHERE id = ?';

    try {
      const rows = await query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener configuración: ${error.message}`);
    }
  }

  /**
   * Obtener configuración por clave
   * @param {string} clave - Clave de la configuración
   * @returns {Promise<Object|null>} Configuración encontrada
   */
  static async obtenerPorClave(clave) {
    const query = 'SELECT * FROM configuraciones WHERE clave = ?';

    try {
      const rows = await query(query, [clave]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener configuración por clave: ${error.message}`);
    }
  }

  /**
   * Obtener valor de configuración por clave
   * @param {string} clave - Clave de la configuración
   * @param {*} valor_por_defecto - Valor por defecto si no existe
   * @returns {Promise<*>} Valor de la configuración
   */
  static async obtenerValor(clave, valor_por_defecto = null) {
    const configuracion = await this.obtenerPorClave(clave);
    
    if (!configuracion) {
      return valor_por_defecto;
    }

    // Convertir valor según el tipo
    return this.convertirValor(configuracion.valor, configuracion.tipo);
  }

  /**
   * Convertir valor según el tipo
   * @param {string} valor - Valor como string
   * @param {string} tipo - Tipo de dato
   * @returns {*} Valor convertido
   */
  static convertirValor(valor, tipo) {
    switch (tipo) {
      case 'boolean':
        return valor === 'true' || valor === '1';
      case 'number':
        return parseFloat(valor) || 0;
      case 'integer':
        return parseInt(valor) || 0;
      case 'json':
        try {
          return JSON.parse(valor);
        } catch {
          return null;
        }
      default:
        return valor;
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
      categoria = null,
      tipo = null,
      editable = null,
      visible = null,
      orden = 'categoria',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (categoria) {
      whereConditions.push('categoria = ?');
      params.push(categoria);
    }

    if (tipo) {
      whereConditions.push('tipo = ?');
      params.push(tipo);
    }

    if (editable !== null) {
      whereConditions.push('editable = ?');
      params.push(editable);
    }

    if (visible !== null) {
      whereConditions.push('visible = ?');
      params.push(visible);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT * FROM configuraciones
      ${whereClause}
      ORDER BY ${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM configuraciones
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
      throw new Error(`Error al obtener configuraciones: ${error.message}`);
    }
  }

  /**
   * Actualizar configuración
   * @param {number} id - ID de la configuración
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Configuración actualizada
   */
  static async actualizar(id, datos) {
    const configuracion = await this.obtenerPorId(id);
    if (!configuracion) {
      throw new Error('Configuración no encontrada');
    }

    if (!configuracion.editable) {
      throw new Error('Esta configuración no es editable');
    }

    const camposPermitidos = ['valor', 'descripcion', 'categoria', 'visible'];
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
      UPDATE configuraciones 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Configuración no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar configuración: ${error.message}`);
    }
  }

  /**
   * Actualizar configuración por clave
   * @param {string} clave - Clave de la configuración
   * @param {*} valor - Nuevo valor
   * @returns {Promise<Object>} Configuración actualizada
   */
  static async actualizarPorClave(clave, valor) {
    const configuracion = await this.obtenerPorClave(clave);
    if (!configuracion) {
      throw new Error('Configuración no encontrada');
    }

    return await this.actualizar(configuracion.id, { valor: String(valor) });
  }

  /**
   * Eliminar configuración
   * @param {number} id - ID de la configuración
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const configuracion = await this.obtenerPorId(id);
    if (!configuracion) {
      throw new Error('Configuración no encontrada');
    }

    if (!configuracion.editable) {
      throw new Error('Esta configuración no se puede eliminar');
    }

    const query = 'DELETE FROM configuraciones WHERE id = ?';

    try {
      const result = await query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar configuración: ${error.message}`);
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
      SELECT * FROM configuraciones
      WHERE clave LIKE ? OR descripcion LIKE ? OR valor LIKE ?
      ORDER BY categoria ASC, clave ASC
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
   * Obtener configuraciones por categoría
   * @param {string} categoria - Categoría
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Configuraciones de la categoría
   */
  static async obtenerPorCategoria(categoria, opciones = {}) {
    const { visible = null, orden = 'clave ASC' } = opciones;

    let whereConditions = ['categoria = ?'];
    let params = [categoria];

    if (visible !== null) {
      whereConditions.push('visible = ?');
      params.push(visible);
    }

    const query = `
      SELECT * FROM configuraciones
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener configuraciones por categoría: ${error.message}`);
    }
  }

  /**
   * Obtener configuraciones editables
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Configuraciones editables
   */
  static async obtenerEditables(opciones = {}) {
    const { categoria = null, orden = 'categoria ASC, clave ASC' } = opciones;

    let whereConditions = ['editable = 1'];
    let params = [];

    if (categoria) {
      whereConditions.push('categoria = ?');
      params.push(categoria);
    }

    const query = `
      SELECT * FROM configuraciones
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener configuraciones editables: ${error.message}`);
    }
  }

  /**
   * Obtener configuraciones visibles
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Configuraciones visibles
   */
  static async obtenerVisibles(opciones = {}) {
    const { categoria = null, orden = 'categoria ASC, clave ASC' } = opciones;

    let whereConditions = ['visible = 1'];
    let params = [];

    if (categoria) {
      whereConditions.push('categoria = ?');
      params.push(categoria);
    }

    const query = `
      SELECT * FROM configuraciones
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener configuraciones visibles: ${error.message}`);
    }
  }

  /**
   * Obtener todas las configuraciones como objeto
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Configuraciones como objeto
   */
  static async obtenerComoObjeto(opciones = {}) {
    const { categoria = null, convertir_valores = true } = opciones;

    let whereConditions = [];
    let params = [];

    if (categoria) {
      whereConditions.push('categoria = ?');
      params.push(categoria);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT * FROM configuraciones
      ${whereClause}
      ORDER BY categoria ASC, clave ASC
    `;

    try {
      const rows = await query(query, params);
      
      const configuraciones = {};
      rows.forEach(row => {
        if (convertir_valores) {
          configuraciones[row.clave] = this.convertirValor(row.valor, row.tipo);
        } else {
          configuraciones[row.clave] = row.valor;
        }
      });

      return configuraciones;
    } catch (error) {
      throw new Error(`Error al obtener configuraciones como objeto: ${error.message}`);
    }
  }

  /**
   * Obtener categorías disponibles
   * @returns {Promise<Array>} Categorías disponibles
   */
  static async obtenerCategorias() {
    const query = `
      SELECT DISTINCT categoria, COUNT(*) as cantidad
      FROM configuraciones
      GROUP BY categoria
      ORDER BY categoria ASC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }

  /**
   * Obtener tipos disponibles
   * @returns {Promise<Array>} Tipos disponibles
   */
  static async obtenerTipos() {
    const query = `
      SELECT DISTINCT tipo, COUNT(*) as cantidad
      FROM configuraciones
      GROUP BY tipo
      ORDER BY tipo ASC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener tipos: ${error.message}`);
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
        COUNT(CASE WHEN editable = 1 THEN 1 END) as editables,
        COUNT(CASE WHEN editable = 0 THEN 1 END) as no_editables,
        COUNT(CASE WHEN visible = 1 THEN 1 END) as visibles,
        COUNT(CASE WHEN visible = 0 THEN 1 END) as no_visibles,
        COUNT(DISTINCT categoria) as categorias,
        COUNT(DISTINCT tipo) as tipos
      FROM configuraciones
    `;

    try {
      const rows = await query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Crear o actualizar configuración
   * @param {string} clave - Clave de la configuración
   * @param {Object} datos - Datos de la configuración
   * @returns {Promise<Object>} Configuración creada o actualizada
   */
  static async crearOActualizar(clave, datos) {
    try {
      const existente = await this.obtenerPorClave(clave);
      
      if (existente) {
        return await this.actualizar(existente.id, datos);
      } else {
        return await this.crear({
          clave,
          ...datos
        });
      }
    } catch (error) {
      throw new Error(`Error al crear o actualizar configuración: ${error.message}`);
    }
  }

  /**
   * Obtener configuraciones predefinidas
   * @returns {Array} Configuraciones predefinidas
   */
  static obtenerConfiguracionesPredefinidas() {
    return [
      {
        clave: 'app_nombre',
        valor: 'Peluquería API',
        descripcion: 'Nombre de la aplicación',
        tipo: 'string',
        categoria: 'general'
      },
      {
        clave: 'app_version',
        valor: '1.0.0',
        descripcion: 'Versión de la aplicación',
        tipo: 'string',
        categoria: 'general'
      },
      {
        clave: 'app_modo',
        valor: 'development',
        descripcion: 'Modo de la aplicación (development/production)',
        tipo: 'string',
        categoria: 'general'
      },
      {
        clave: 'db_timezone',
        valor: 'America/Mexico_City',
        descripcion: 'Zona horaria de la base de datos',
        tipo: 'string',
        categoria: 'database'
      },
      {
        clave: 'upload_max_size',
        valor: '5242880',
        descripcion: 'Tamaño máximo de archivos (bytes)',
        tipo: 'integer',
        categoria: 'upload'
      },
      {
        clave: 'upload_allowed_types',
        valor: 'jpg,jpeg,png,gif,pdf,doc,docx',
        descripcion: 'Tipos de archivo permitidos',
        tipo: 'string',
        categoria: 'upload'
      },
      {
        clave: 'email_enabled',
        valor: 'false',
        descripcion: 'Habilitar envío de emails',
        tipo: 'boolean',
        categoria: 'email'
      },
      {
        clave: 'email_from',
        valor: 'noreply@peluqueria.com',
        descripcion: 'Email remitente por defecto',
        tipo: 'string',
        categoria: 'email'
      },
      {
        clave: 'pagination_default_limit',
        valor: '10',
        descripcion: 'Límite por defecto para paginación',
        tipo: 'integer',
        categoria: 'pagination'
      },
      {
        clave: 'pagination_max_limit',
        valor: '100',
        descripcion: 'Límite máximo para paginación',
        tipo: 'integer',
        categoria: 'pagination'
      }
    ];
  }

  /**
   * Crear configuraciones predefinidas
   * @returns {Promise<Array>} Configuraciones creadas
   */
  static async crearConfiguracionesPredefinidas() {
    const configuracionesPredefinidas = this.obtenerConfiguracionesPredefinidas();
    const configuracionesCreadas = [];

    for (const config of configuracionesPredefinidas) {
      try {
        const configCreada = await this.crearOActualizar(config.clave, config);
        configuracionesCreadas.push(configCreada);
      } catch (error) {
        console.error(`Error al crear configuración predefinida ${config.clave}:`, error);
      }
    }

    return configuracionesCreadas;
  }
}

module.exports = Configuracion; 