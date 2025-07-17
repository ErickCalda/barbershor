const { query } = require('../config/database');

/**
 * Modelo para la gestión de tipos de multimedia
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de tipos
 */
class TipoMultimedia {
  /**
   * Crear un nuevo tipo de multimedia
   * @param {Object} tipo - Datos del tipo
   * @returns {Promise<Object>} Tipo creado
   */
  static async crear(tipo) {
    const {
      nombre,
      descripcion = null,
      extensiones_permitidas = null,
      tamano_maximo = null,
      activo = 1
    } = tipo;

    const query = `
      INSERT INTO tipos_multimedia (nombre, descripcion, extensiones_permitidas, tamano_maximo, activo)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [
        nombre, descripcion, extensiones_permitidas, tamano_maximo, activo
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear tipo de multimedia: ${error.message}`);
    }
  }

  /**
   * Obtener tipo por ID
   * @param {number} id - ID del tipo
   * @returns {Promise<Object|null>} Tipo encontrado
   */
  static async obtenerPorId(id) {
    const query = `
      SELECT tm.*,
             COUNT(m.id) as cantidad_multimedia
      FROM tipos_multimedia tm
      LEFT JOIN multimedia m ON tm.id = m.tipo_id
      WHERE tm.id = ?
      GROUP BY tm.id
    `;

    try {
      const rows = await query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener tipo de multimedia: ${error.message}`);
    }
  }

  /**
   * Obtener todos los tipos con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de tipos y metadatos
   */
  static async obtenerTodos(opciones = {}) {
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
      whereConditions.push('tm.activo = ?');
      params.push(activo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT tm.*,
             COUNT(m.id) as cantidad_multimedia
      FROM tipos_multimedia tm
      LEFT JOIN multimedia m ON tm.id = m.tipo_id
      ${whereClause}
      GROUP BY tm.id
      ORDER BY tm.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM tipos_multimedia tm
      ${whereClause}
    `;

    try {
      const rows = await query(query, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        tipos: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener tipos de multimedia: ${error.message}`);
    }
  }

  /**
   * Actualizar tipo
   * @param {number} id - ID del tipo
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Tipo actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['nombre', 'descripcion', 'extensiones_permitidas', 'tamano_maximo', 'activo'];
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
      UPDATE tipos_multimedia 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Tipo de multimedia no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar tipo de multimedia: ${error.message}`);
    }
  }

  /**
   * Eliminar tipo
   * @param {number} id - ID del tipo
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    // Verificar si hay multimedia asociada
    const multimediaAsociada = await this.verificarMultimediaAsociada(id);
    if (multimediaAsociada) {
      throw new Error('No se puede eliminar el tipo porque tiene multimedia asociada');
    }

    const query = 'DELETE FROM tipos_multimedia WHERE id = ?';

    try {
      const result = await query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar tipo de multimedia: ${error.message}`);
    }
  }

  /**
   * Verificar si hay multimedia asociada
   * @param {number} tipo_id - ID del tipo
   * @returns {Promise<boolean>} Tiene multimedia asociada
   */
  static async verificarMultimediaAsociada(tipo_id) {
    const query = 'SELECT COUNT(*) as total FROM multimedia WHERE tipo_id = ?';

    try {
      const rows = await query(query, [tipo_id]);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al verificar multimedia asociada: ${error.message}`);
    }
  }

  /**
   * Buscar tipos por nombre
   * @param {string} nombre - Nombre a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Tipos encontrados
   */
  static async buscarPorNombre(nombre, opciones = {}) {
    const { activo = null, limite = 20 } = opciones;

    let whereConditions = ['tm.nombre LIKE ?'];
    let params = [`%${nombre}%`];

    if (activo !== null) {
      whereConditions.push('tm.activo = ?');
      params.push(activo);
    }

    const query = `
      SELECT tm.*,
             COUNT(m.id) as cantidad_multimedia
      FROM tipos_multimedia tm
      LEFT JOIN multimedia m ON tm.id = m.tipo_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY tm.id
      ORDER BY tm.nombre ASC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar tipos por nombre: ${error.message}`);
    }
  }

  /**
   * Obtener tipos activos
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Tipos activos
   */
  static async obtenerActivos(opciones = {}) {
    const { orden = 'nombre ASC' } = opciones;

    const query = `
      SELECT tm.*,
             COUNT(m.id) as cantidad_multimedia
      FROM tipos_multimedia tm
      LEFT JOIN multimedia m ON tm.id = m.tipo_id
      WHERE tm.activo = 1
      GROUP BY tm.id
      ORDER BY tm.${orden}
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener tipos activos: ${error.message}`);
    }
  }

  /**
   * Obtener tipos por extensión
   * @param {string} extension - Extensión de archivo
   * @returns {Promise<Array>} Tipos compatibles
   */
  static async obtenerPorExtension(extension) {
    const query = `
      SELECT tm.*,
             COUNT(m.id) as cantidad_multimedia
      FROM tipos_multimedia tm
      LEFT JOIN multimedia m ON tm.id = m.tipo_id
      WHERE tm.activo = 1
        AND (tm.extensiones_permitidas LIKE ? OR tm.extensiones_permitidas IS NULL)
      GROUP BY tm.id
      ORDER BY tm.nombre ASC
    `;

    try {
      const rows = await query(query, [`%${extension}%`]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener tipos por extensión: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de tipos
   * @returns {Promise<Object>} Estadísticas de tipos
   */
  static async obtenerEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total_tipos,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as tipos_activos,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as tipos_inactivos,
        COUNT(CASE WHEN extensiones_permitidas IS NOT NULL THEN 1 END) as con_extensiones,
        COUNT(CASE WHEN tamano_maximo IS NOT NULL THEN 1 END) as con_tamano_maximo
      FROM tipos_multimedia
    `;

    try {
      const rows = await query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener tipos más utilizados
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Tipos más utilizados
   */
  static async obtenerMasUtilizados(limite = 10) {
    const query = `
      SELECT tm.*,
             COUNT(m.id) as cantidad_multimedia
      FROM tipos_multimedia tm
      LEFT JOIN multimedia m ON tm.id = m.tipo_id
      GROUP BY tm.id
      ORDER BY cantidad_multimedia DESC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener tipos más utilizados: ${error.message}`);
    }
  }

  /**
   * Activar/desactivar tipo
   * @param {number} id - ID del tipo
   * @param {boolean} activo - Estado activo
   * @returns {Promise<Object>} Tipo actualizado
   */
  static async cambiarEstado(id, activo) {
    const query = `
      UPDATE tipos_multimedia 
      SET activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, [activo ? 1 : 0, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Tipo de multimedia no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al cambiar estado del tipo: ${error.message}`);
    }
  }

  /**
   * Obtener tipos por tamaño máximo
   * @param {number} tamano - Tamaño en bytes
   * @returns {Promise<Array>} Tipos compatibles
   */
  static async obtenerPorTamanoMaximo(tamano) {
    const query = `
      SELECT tm.*,
             COUNT(m.id) as cantidad_multimedia
      FROM tipos_multimedia tm
      LEFT JOIN multimedia m ON tm.id = m.tipo_id
      WHERE tm.activo = 1
        AND (tm.tamano_maximo IS NULL OR tm.tamano_maximo >= ?)
      GROUP BY tm.id
      ORDER BY tm.nombre ASC
    `;

    try {
      const rows = await query(query, [tamano]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener tipos por tamaño: ${error.message}`);
    }
  }

  /**
   * Validar archivo por tipo
   * @param {number} tipo_id - ID del tipo
   * @param {string} extension - Extensión del archivo
   * @param {number} tamano - Tamaño del archivo en bytes
   * @returns {Promise<Object>} Resultado de validación
   */
  static async validarArchivo(tipo_id, extension, tamano) {
    const tipo = await this.obtenerPorId(tipo_id);
    
    if (!tipo) {
      return { valido: false, error: 'Tipo de multimedia no encontrado' };
    }

    if (!tipo.activo) {
      return { valido: false, error: 'Tipo de multimedia inactivo' };
    }

    // Validar extensión
    if (tipo.extensiones_permitidas) {
      const extensiones = tipo.extensiones_permitidas.split(',').map(ext => ext.trim().toLowerCase());
      if (!extensiones.includes(extension.toLowerCase())) {
        return { valido: false, error: 'Extensión no permitida' };
      }
    }

    // Validar tamaño
    if (tipo.tamano_maximo && tamano > tipo.tamano_maximo) {
      return { valido: false, error: 'Archivo demasiado grande' };
    }

    return { valido: true, tipo };
  }

  /**
   * Obtener tipos predefinidos comunes
   * @returns {Array} Tipos predefinidos
   */
  static obtenerTiposPredefinidos() {
    return [
      {
        nombre: 'Imagen',
        descripcion: 'Archivos de imagen (JPG, PNG, GIF, etc.)',
        extensiones_permitidas: 'jpg,jpeg,png,gif,bmp,webp',
        tamano_maximo: 5242880 // 5MB
      },
      {
        nombre: 'Video',
        descripcion: 'Archivos de video (MP4, AVI, MOV, etc.)',
        extensiones_permitidas: 'mp4,avi,mov,wmv,flv,webm',
        tamano_maximo: 52428800 // 50MB
      },
      {
        nombre: 'Documento',
        descripcion: 'Documentos (PDF, DOC, TXT, etc.)',
        extensiones_permitidas: 'pdf,doc,docx,txt,rtf',
        tamano_maximo: 10485760 // 10MB
      },
      {
        nombre: 'Audio',
        descripcion: 'Archivos de audio (MP3, WAV, etc.)',
        extensiones_permitidas: 'mp3,wav,aac,ogg,flac',
        tamano_maximo: 20971520 // 20MB
      }
    ];
  }

  /**
   * Crear tipos predefinidos
   * @returns {Promise<Array>} Tipos creados
   */
  static async crearTiposPredefinidos() {
    const tiposPredefinidos = this.obtenerTiposPredefinidos();
    const tiposCreados = [];

    for (const tipo of tiposPredefinidos) {
      try {
        const tipoCreado = await this.crear(tipo);
        tiposCreados.push(tipoCreado);
      } catch (error) {
        console.error(`Error al crear tipo predefinido ${tipo.nombre}:`, error);
      }
    }

    return tiposCreados;
  }
}

module.exports = TipoMultimedia; 