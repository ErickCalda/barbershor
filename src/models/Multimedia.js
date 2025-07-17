const { query } = require('../config/database');

/**
 * Modelo para la gestión de multimedia
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de archivos multimedia
 */
class Multimedia {
  /**
   * Crear un nuevo archivo multimedia
   * @param {Object} multimedia - Datos del archivo multimedia
   * @returns {Promise<Object>} Archivo multimedia creado
   */
  static async crear(multimedia) {
    const {
      tipo_id,
      titulo,
      descripcion,
      archivo,
      tipo_archivo,
      tamaño_archivo,
      formato,
      ancho,
      alto,
      duracion,
      palabras_clave,
      destacado = 0,
      fecha_creacion,
      autor,
      derechos,
      activo = 1
    } = multimedia;

    const query = `
      INSERT INTO multimedia (
        tipo_id, titulo, descripcion, archivo, tipo_archivo, tamaño_archivo,
        formato, ancho, alto, duracion, palabras_clave, destacado,
        fecha_creacion, autor, derechos, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [
        tipo_id, titulo, descripcion, archivo, tipo_archivo, tamaño_archivo,
        formato, ancho, alto, duracion, palabras_clave, destacado,
        fecha_creacion, autor, derechos, activo
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear multimedia: ${error.message}`);
    }
  }

  /**
   * Obtener archivo multimedia por ID
   * @param {number} id - ID del archivo multimedia
   * @returns {Promise<Object|null>} Archivo multimedia encontrado
   */
  static async obtenerPorId(id) {
    const query = `
      SELECT m.*, tm.nombre as tipo_nombre, tm.descripcion as tipo_descripcion
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE m.id = ?
    `;

    try {
      const rows = await query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener multimedia: ${error.message}`);
    }
  }

  /**
   * Obtener todos los archivos multimedia con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de archivos multimedia y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      tipo_id = null,
      tipo_archivo = null,
      formato = null,
      destacado = null,
      activo = null,
      busqueda = null,
      orden = 'created_at',
      direccion = 'DESC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (tipo_id) {
      whereConditions.push('m.tipo_id = ?');
      params.push(tipo_id);
    }

    if (tipo_archivo) {
      whereConditions.push('m.tipo_archivo = ?');
      params.push(tipo_archivo);
    }

    if (formato) {
      whereConditions.push('m.formato = ?');
      params.push(formato);
    }

    if (destacado !== null) {
      whereConditions.push('m.destacado = ?');
      params.push(destacado);
    }

    if (activo !== null) {
      whereConditions.push('m.activo = ?');
      params.push(activo);
    }

    if (busqueda) {
      whereConditions.push('(m.titulo LIKE ? OR m.descripcion LIKE ? OR m.palabras_clave LIKE ? OR m.autor LIKE ?)');
      const busquedaParam = `%${busqueda}%`;
      params.push(busquedaParam, busquedaParam, busquedaParam, busquedaParam);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT m.*, tm.nombre as tipo_nombre
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      ${whereClause}
      ORDER BY m.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM multimedia m
      ${whereClause}
    `;

    try {
      const rows = await query(query, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        multimedia: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener multimedia: ${error.message}`);
    }
  }

  /**
   * Actualizar archivo multimedia
   * @param {number} id - ID del archivo multimedia
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Archivo multimedia actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'tipo_id', 'titulo', 'descripcion', 'archivo', 'tipo_archivo',
      'tamaño_archivo', 'formato', 'ancho', 'alto', 'duracion',
      'palabras_clave', 'destacado', 'fecha_creacion', 'autor', 'derechos', 'activo'
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
      UPDATE multimedia 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Archivo multimedia no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar multimedia: ${error.message}`);
    }
  }

  /**
   * Eliminar archivo multimedia (marcar como inactivo)
   * @param {number} id - ID del archivo multimedia
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const query = 'UPDATE multimedia SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    try {
      const result = await query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar multimedia: ${error.message}`);
    }
  }

  /**
   * Buscar archivos multimedia
   * @param {string} termino - Término de búsqueda
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Archivos multimedia encontrados
   */
  static async buscar(termino, limite = 20) {
    const query = `
      SELECT m.*, tm.nombre as tipo_nombre
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE m.activo = 1 
        AND (m.titulo LIKE ? OR m.descripcion LIKE ? OR m.palabras_clave LIKE ? OR m.autor LIKE ?)
      ORDER BY m.destacado DESC, m.created_at DESC
      LIMIT ?
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(query, [busquedaParam, busquedaParam, busquedaParam, busquedaParam, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar multimedia: ${error.message}`);
    }
  }

  /**
   * Obtener archivos multimedia por tipo
   * @param {number} tipo_id - ID del tipo de multimedia
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Archivos multimedia del tipo
   */
  static async obtenerPorTipo(tipo_id, opciones = {}) {
    const { activo = 1, destacado = null, limite = 50, orden = 'created_at DESC' } = opciones;

    let whereConditions = ['m.tipo_id = ?', 'm.activo = ?'];
    let params = [tipo_id, activo];

    if (destacado !== null) {
      whereConditions.push('m.destacado = ?');
      params.push(destacado);
    }

    const query = `
      SELECT m.*, tm.nombre as tipo_nombre
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY m.${orden}
      LIMIT ?
    `;

    try {
      const rows = await query(query, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener multimedia por tipo: ${error.message}`);
    }
  }

  /**
   * Obtener archivos multimedia destacados
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Archivos multimedia destacados
   */
  static async obtenerDestacados(limite = 10) {
    const query = `
      SELECT m.*, tm.nombre as tipo_nombre
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE m.destacado = 1 AND m.activo = 1
      ORDER BY m.created_at DESC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener multimedia destacado: ${error.message}`);
    }
  }

  /**
   * Obtener archivos multimedia por formato
   * @param {string} formato - Formato del archivo
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Archivos multimedia del formato
   */
  static async obtenerPorFormato(formato, opciones = {}) {
    const { activo = 1, limite = 50 } = opciones;

    const query = `
      SELECT m.*, tm.nombre as tipo_nombre
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE m.formato = ? AND m.activo = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [formato, activo, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener multimedia por formato: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de multimedia
   * @returns {Promise<Object>} Estadísticas de multimedia
   */
  static async obtenerEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total_archivos,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as archivos_activos,
        COUNT(CASE WHEN tipo_archivo = 'imagen' THEN 1 END) as total_imagenes,
        COUNT(CASE WHEN tipo_archivo = 'video' THEN 1 END) as total_videos,
        COUNT(CASE WHEN destacado = 1 THEN 1 END) as archivos_destacados,
        SUM(tamaño_archivo) as tamaño_total_bytes,
        AVG(tamaño_archivo) as tamaño_promedio_bytes,
        COUNT(DISTINCT formato) as formatos_diferentes
      FROM multimedia
    `;

    try {
      const rows = await query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por tipo de multimedia
   * @returns {Promise<Array>} Estadísticas por tipo
   */
  static async obtenerEstadisticasPorTipo() {
    const query = `
      SELECT 
        tm.id,
        tm.nombre,
        tm.descripcion,
        COUNT(m.id) as total_archivos,
        COUNT(CASE WHEN m.tipo_archivo = 'imagen' THEN 1 END) as imagenes,
        COUNT(CASE WHEN m.tipo_archivo = 'video' THEN 1 END) as videos,
        COUNT(CASE WHEN m.destacado = 1 THEN 1 END) as destacados,
        SUM(m.tamaño_archivo) as tamaño_total_bytes
      FROM tipos_multimedia tm
      LEFT JOIN multimedia m ON tm.id = m.tipo_id
      GROUP BY tm.id
      ORDER BY total_archivos DESC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por tipo: ${error.message}`);
    }
  }

  /**
   * Obtener archivos multimedia recientes
   * @param {number} limite - Límite de resultados
   * @param {boolean} soloActivos - Solo archivos activos
   * @returns {Promise<Array>} Archivos multimedia recientes
   */
  static async obtenerRecientes(limite = 10, soloActivos = true) {
    const whereClause = soloActivos ? 'WHERE m.activo = 1' : '';

    const query = `
      SELECT m.*, tm.nombre as tipo_nombre
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      ${whereClause}
      ORDER BY m.created_at DESC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener multimedia reciente: ${error.message}`);
    }
  }

  /**
   * Obtener archivos multimedia por autor
   * @param {string} autor - Nombre del autor
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Archivos multimedia del autor
   */
  static async obtenerPorAutor(autor, opciones = {}) {
    const { activo = 1, limite = 50 } = opciones;

    const query = `
      SELECT m.*, tm.nombre as tipo_nombre
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE m.autor = ? AND m.activo = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [autor, activo, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener multimedia por autor: ${error.message}`);
    }
  }

  /**
   * Obtener archivos multimedia por palabras clave
   * @param {string} palabraClave - Palabra clave
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Archivos multimedia con la palabra clave
   */
  static async obtenerPorPalabraClave(palabraClave, opciones = {}) {
    const { activo = 1, limite = 50 } = opciones;

    const query = `
      SELECT m.*, tm.nombre as tipo_nombre
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE m.activo = ? AND m.palabras_clave LIKE ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `;

    const palabraClaveParam = `%${palabraClave}%`;

    try {
      const rows = await query(query, [activo, palabraClaveParam, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener multimedia por palabra clave: ${error.message}`);
    }
  }

  /**
   * Marcar archivo como destacado
   * @param {number} id - ID del archivo multimedia
   * @param {boolean} destacado - Estado destacado
   * @returns {Promise<Object>} Archivo multimedia actualizado
   */
  static async marcarDestacado(id, destacado) {
    const query = `
      UPDATE multimedia 
      SET destacado = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, [destacado ? 1 : 0, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Archivo multimedia no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al marcar destacado: ${error.message}`);
    }
  }

  /**
   * Obtener archivos multimedia por fecha de creación
   * @param {string} fecha - Fecha específica (YYYY-MM-DD)
   * @returns {Promise<Array>} Archivos multimedia de la fecha
   */
  static async obtenerPorFecha(fecha) {
    const query = `
      SELECT m.*, tm.nombre as tipo_nombre
      FROM multimedia m
      JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE DATE(m.fecha_creacion) = ? AND m.activo = 1
      ORDER BY m.created_at DESC
    `;

    try {
      const rows = await query(query, [fecha]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener multimedia por fecha: ${error.message}`);
    }
  }

  /**
   * Verificar si un archivo existe
   * @param {string} archivo - Ruta del archivo
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe el archivo
   */
  static async existeArchivo(archivo, excludeId = null) {
    let query = 'SELECT COUNT(*) as total FROM multimedia WHERE archivo = ?';
    let params = [archivo];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const rows = await query(query, params);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al verificar existencia: ${error.message}`);
    }
  }
}

module.exports = Multimedia; 