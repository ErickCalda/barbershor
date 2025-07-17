const { query } = require('../config/database');

/**
 * Modelo para la gestión de categorías de galería
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de categorías
 */
class CategoriaGaleria {
  /**
   * Crear una nueva categoría de galería
   * @param {Object} categoria - Datos de la categoría
   * @returns {Promise<Object>} Categoría creada
   */
  static async crear(categoria) {
    const {
      nombre,
      descripcion = null,
      slug = null,
      imagen_portada = null,
      activo = 1,
      orden = 0
    } = categoria;

    // Generar slug si no se proporciona
    const slugGenerado = slug || this.generarSlug(nombre);

    // Verificar que el slug sea único
    const slugExistente = await this.obtenerPorSlug(slugGenerado);
    if (slugExistente) {
      throw new Error('Ya existe una categoría con ese slug');
    }

    const sql = `
      INSERT INTO categorias_galeria (nombre, descripcion, slug, imagen_portada, activo, orden)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(sql, [
        nombre, descripcion, slugGenerado, imagen_portada, activo, orden
      ]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear categoría de galería: ${error.message}`);
    }
  }

  /**
   * Obtener categoría por ID
   * @param {number} id - ID de la categoría
   * @returns {Promise<Object|null>} Categoría encontrada
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT cg.*,
             m.titulo as imagen_portada_titulo,
             m.archivo as imagen_portada_archivo,
             COUNT(g.id) as total_galerias,
             COUNT(CASE WHEN g.activo = 1 THEN 1 END) as galerias_activas
      FROM categorias_galeria cg
      LEFT JOIN multimedia m ON cg.imagen_portada = m.id
      LEFT JOIN galerias g ON g.id IN (
        SELECT galeria_id FROM galeria_categoria WHERE categoria_id = cg.id
      )
      WHERE cg.id = ?
      GROUP BY cg.id
    `;

    try {
      const rows = await query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener categoría de galería: ${error.message}`);
    }
  }

  /**
   * Obtener categoría por slug
   * @param {string} slug - Slug de la categoría
   * @returns {Promise<Object|null>} Categoría encontrada
   */
  static async obtenerPorSlug(slug) {
    const sql = `
      SELECT cg.*,
             m.titulo as imagen_portada_titulo,
             m.archivo as imagen_portada_archivo,
             COUNT(g.id) as total_galerias,
             COUNT(CASE WHEN g.activo = 1 THEN 1 END) as galerias_activas
      FROM categorias_galeria cg
      LEFT JOIN multimedia m ON cg.imagen_portada = m.id
      LEFT JOIN galerias g ON g.id IN (
        SELECT galeria_id FROM galeria_categoria WHERE categoria_id = cg.id
      )
      WHERE cg.slug = ?
      GROUP BY cg.id
    `;

    try {
      const rows = await query(sql, [slug]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener categoría por slug: ${error.message}`);
    }
  }

  /**
   * Obtener todas las categorías con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de categorías y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      activo = null,
      orden = 'orden',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (activo !== null) {
      whereConditions.push('cg.activo = ?');
      params.push(activo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const sql = `
      SELECT cg.*,
             m.titulo as imagen_portada_titulo,
             m.archivo as imagen_portada_archivo,
             COUNT(g.id) as total_galerias,
             COUNT(CASE WHEN g.activo = 1 THEN 1 END) as galerias_activas
      FROM categorias_galeria cg
      LEFT JOIN multimedia m ON cg.imagen_portada = m.id
      LEFT JOIN galerias g ON g.id IN (
        SELECT galeria_id FROM galeria_categoria WHERE categoria_id = cg.id
      )
      ${whereClause}
      GROUP BY cg.id
      ORDER BY cg.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM categorias_galeria cg
      ${whereClause}
    `;

    try {
      const rows = await query(sql, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        categorias: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener categorías de galería: ${error.message}`);
    }
  }

  /**
   * Actualizar categoría
   * @param {number} id - ID de la categoría
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Categoría actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['nombre', 'descripcion', 'slug', 'imagen_portada', 'activo', 'orden'];
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

    // Verificar que el slug sea único si se está actualizando
    if (datos.slug) {
      const slugExistente = await this.obtenerPorSlug(datos.slug);
      if (slugExistente && slugExistente.id !== id) {
        throw new Error('Ya existe una categoría con ese slug');
      }
    }

    valores.push(id);
    const sql = `
      UPDATE categorias_galeria 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Categoría de galería no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar categoría: ${error.message}`);
    }
  }

  /**
   * Eliminar categoría
   * @param {number} id - ID de la categoría
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    // Verificar si hay galerías asociadas
    const galeriasAsociadas = await this.obtenerGaleriasPorCategoria(id);
    if (galeriasAsociadas.length > 0) {
      throw new Error('No se puede eliminar la categoría porque tiene galerías asociadas');
    }

    const sql = 'DELETE FROM categorias_galeria WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar categoría: ${error.message}`);
    }
  }

  /**
   * Buscar categorías por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Categorías encontradas
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 20 } = opciones;

    const sql = `
      SELECT cg.*,
             m.titulo as imagen_portada_titulo,
             m.archivo as imagen_portada_archivo,
             COUNT(g.id) as total_galerias,
             COUNT(CASE WHEN g.activo = 1 THEN 1 END) as galerias_activas
      FROM categorias_galeria cg
      LEFT JOIN multimedia m ON cg.imagen_portada = m.id
      LEFT JOIN galerias g ON g.id IN (
        SELECT galeria_id FROM galeria_categoria WHERE categoria_id = cg.id
      )
      WHERE cg.nombre LIKE ? 
         OR cg.descripcion LIKE ?
         OR cg.slug LIKE ?
      GROUP BY cg.id
      ORDER BY cg.nombre ASC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(sql, [searchTerm, searchTerm, searchTerm, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar categorías: ${error.message}`);
    }
  }

  /**
   * Obtener categorías activas
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Categorías activas
   */
  static async obtenerActivas(opciones = {}) {
    const { orden = 'orden ASC' } = opciones;

    const sql = `
      SELECT cg.*,
             m.titulo as imagen_portada_titulo,
             m.archivo as imagen_portada_archivo,
             COUNT(g.id) as total_galerias,
             COUNT(CASE WHEN g.activo = 1 THEN 1 END) as galerias_activas
      FROM categorias_galeria cg
      LEFT JOIN multimedia m ON cg.imagen_portada = m.id
      LEFT JOIN galerias g ON g.id IN (
        SELECT galeria_id FROM galeria_categoria WHERE categoria_id = cg.id
      )
      WHERE cg.activo = 1
      GROUP BY cg.id
      ORDER BY cg.${orden}
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener categorías activas: ${error.message}`);
    }
  }

  /**
   * Activar/desactivar categoría
   * @param {number} id - ID de la categoría
   * @param {boolean} activo - Estado activo
   * @returns {Promise<Object>} Categoría actualizada
   */
  static async cambiarEstado(id, activo) {
    const sql = `
      UPDATE categorias_galeria 
      SET activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, [activo ? 1 : 0, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Categoría de galería no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al cambiar estado de la categoría: ${error.message}`);
    }
  }

  /**
   * Obtener galerías por categoría
   * @param {number} categoria_id - ID de la categoría
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Galerías de la categoría
   */
  static async obtenerGaleriasPorCategoria(categoria_id, opciones = {}) {
    const { activo = null, orden = 'g.orden ASC' } = opciones;

    let whereConditions = ['gc.categoria_id = ?'];
    let params = [categoria_id];

    if (activo !== null) {
      whereConditions.push('g.activo = ?');
      params.push(activo);
    }

    const sql = `
      SELECT g.*,
             CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
             s.nombre as servicio_nombre,
             m.titulo as imagen_portada_titulo,
             m.archivo as imagen_portada_archivo
      FROM galerias g
      JOIN galeria_categoria gc ON g.id = gc.galeria_id
      LEFT JOIN empleados e ON g.empleado_id = e.id
      LEFT JOIN usuarios eu ON e.usuario_id = eu.id
      LEFT JOIN servicios s ON g.servicio_id = s.id
      LEFT JOIN multimedia m ON g.imagen_portada = m.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orden}
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener galerías por categoría: ${error.message}`);
    }
  }

  /**
   * Asignar galería a categoría
   * @param {number} categoria_id - ID de la categoría
   * @param {number} galeria_id - ID de la galería
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async asignarGaleria(categoria_id, galeria_id) {
    const sql = 'INSERT INTO galeria_categoria (galeria_id, categoria_id) VALUES (?, ?)';

    try {
      const result = await query(sql, [galeria_id, categoria_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al asignar galería a categoría: ${error.message}`);
    }
  }

  /**
   * Desasignar galería de categoría
   * @param {number} categoria_id - ID de la categoría
   * @param {number} galeria_id - ID de la galería
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async desasignarGaleria(categoria_id, galeria_id) {
    const sql = 'DELETE FROM galeria_categoria WHERE galeria_id = ? AND categoria_id = ?';

    try {
      const result = await query(sql, [galeria_id, categoria_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al desasignar galería de categoría: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de categorías
   * @returns {Promise<Object>} Estadísticas de categorías
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_categorias,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as categorias_activas,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as categorias_inactivas,
        COUNT(CASE WHEN imagen_portada IS NOT NULL THEN 1 END) as con_imagen_portada,
        AVG(orden) as orden_promedio
      FROM categorias_galeria
    `;

    try {
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por categoría
   * @returns {Promise<Array>} Estadísticas por categoría
   */
  static async obtenerEstadisticasPorCategoria() {
    const sql = `
      SELECT cg.id,
             cg.nombre as categoria_nombre,
             cg.activo,
             COUNT(gc.galeria_id) as total_galerias,
             COUNT(CASE WHEN g.activo = 1 THEN 1 END) as galerias_activas,
             COUNT(CASE WHEN g.destacado = 1 THEN 1 END) as galerias_destacadas
      FROM categorias_galeria cg
      LEFT JOIN galeria_categoria gc ON cg.id = gc.categoria_id
      LEFT JOIN galerias g ON gc.galeria_id = g.id
      GROUP BY cg.id
      ORDER BY total_galerias DESC
    `;

    try {
      const rows = await query(sql);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por categoría: ${error.message}`);
    }
  }

  /**
   * Generar slug a partir del nombre
   * @param {string} nombre - Nombre de la categoría
   * @returns {string} Slug generado
   */
  static generarSlug(nombre) {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  /**
   * Reordenar categorías
   * @param {Array} categorias - Array con IDs y nuevos órdenes
   * @returns {Promise<Array>} Categorías actualizadas
   */
  static async reordenar(categorias) {
    const categoriasActualizadas = [];

    for (const categoria of categorias) {
      try {
        const categoriaActualizada = await this.actualizar(categoria.id, {
          orden: categoria.orden
        });
        categoriasActualizadas.push(categoriaActualizada);
      } catch (error) {
        console.error(`Error al reordenar categoría ${categoria.id}:`, error);
      }
    }

    return categoriasActualizadas;
  }

  /**
   * Exportar categorías a formato CSV
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
      whereConditions.push('cg.activo = ?');
      params.push(activo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      SELECT cg.id, cg.nombre, cg.descripcion, cg.slug, cg.activo, cg.orden, cg.created_at,
             m.titulo as imagen_portada_titulo,
             COUNT(g.id) as total_galerias,
             COUNT(CASE WHEN g.activo = 1 THEN 1 END) as galerias_activas
      FROM categorias_galeria cg
      LEFT JOIN multimedia m ON cg.imagen_portada = m.id
      LEFT JOIN galerias g ON g.id IN (
        SELECT galeria_id FROM galeria_categoria WHERE categoria_id = cg.id
      )
      ${whereClause}
      GROUP BY cg.id
      ORDER BY cg.orden ASC
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar categorías: ${error.message}`);
    }
  }
}

module.exports = CategoriaGaleria; 