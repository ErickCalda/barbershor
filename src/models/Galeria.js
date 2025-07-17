const { query } = require('../config/database');

/**
 * Modelo para la gestión de galerías
 * Maneja operaciones CRUD, búsquedas, filtros y estadísticas de galerías
 */
class Galeria {
  /**
   * Crear una nueva galería
   * @param {Object} galeria - Datos de la galería
   * @returns {Promise<Object>} Galería creada
   */
  static async crear(galeria) {
    const {
      nombre,
      descripcion,
      tipo,
      slug,
      imagen_portada,
      empleado_id,
      servicio_id,
      activo = 1,
      destacado = 0,
      orden = 0
    } = galeria;

    const query = `
      INSERT INTO galerias (
        nombre, descripcion, tipo, slug, imagen_portada, empleado_id,
        servicio_id, activo, destacado, orden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [
        nombre, descripcion, tipo, slug, imagen_portada, empleado_id,
        servicio_id, activo, destacado, orden
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear galería: ${error.message}`);
    }
  }

  /**
   * Obtener galería por ID
   * @param {number} id - ID de la galería
   * @returns {Promise<Object|null>} Galería encontrada
   */
  static async obtenerPorId(id) {
    const query = `
      SELECT g.*,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             s.nombre as servicio_nombre,
             m.titulo as imagen_portada_titulo,
             m.archivo as imagen_portada_archivo,
             COUNT(gm.multimedia_id) as total_elementos
      FROM galerias g
      LEFT JOIN empleados e ON g.empleado_id = e.id
      LEFT JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN servicios s ON g.servicio_id = s.id
      LEFT JOIN multimedia m ON g.imagen_portada = m.id
      LEFT JOIN galeria_multimedia gm ON g.id = gm.galeria_id
      WHERE g.id = ?
      GROUP BY g.id
    `;

    try {
      const rows = await query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener galería: ${error.message}`);
    }
  }

  /**
   * Obtener galería por slug
   * @param {string} slug - Slug de la galería
   * @returns {Promise<Object|null>} Galería encontrada
   */
  static async obtenerPorSlug(slug) {
    const query = `
      SELECT g.*,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             s.nombre as servicio_nombre,
             m.titulo as imagen_portada_titulo,
             m.archivo as imagen_portada_archivo,
             COUNT(gm.multimedia_id) as total_elementos
      FROM galerias g
      LEFT JOIN empleados e ON g.empleado_id = e.id
      LEFT JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN servicios s ON g.servicio_id = s.id
      LEFT JOIN multimedia m ON g.imagen_portada = m.id
      LEFT JOIN galeria_multimedia gm ON g.id = gm.galeria_id
      WHERE g.slug = ? AND g.activo = 1
      GROUP BY g.id
    `;

    try {
      const rows = await query(query, [slug]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener galería por slug: ${error.message}`);
    }
  }

  /**
   * Obtener todas las galerías con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de galerías y metadatos
   */
  static async obtenerTodas(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      tipo = null,
      empleado_id = null,
      servicio_id = null,
      activo = null,
      destacado = null,
      busqueda = null,
      orden = 'orden',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (tipo) {
      whereConditions.push('g.tipo = ?');
      params.push(tipo);
    }

    if (empleado_id) {
      whereConditions.push('g.empleado_id = ?');
      params.push(empleado_id);
    }

    if (servicio_id) {
      whereConditions.push('g.servicio_id = ?');
      params.push(servicio_id);
    }

    if (activo !== null) {
      whereConditions.push('g.activo = ?');
      params.push(activo);
    }

    if (destacado !== null) {
      whereConditions.push('g.destacado = ?');
      params.push(destacado);
    }

    if (busqueda) {
      whereConditions.push('(g.nombre LIKE ? OR g.descripcion LIKE ?)');
      const busquedaParam = `%${busqueda}%`;
      params.push(busquedaParam, busquedaParam);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT g.*,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             s.nombre as servicio_nombre,
             m.titulo as imagen_portada_titulo,
             COUNT(gm.multimedia_id) as total_elementos
      FROM galerias g
      LEFT JOIN empleados e ON g.empleado_id = e.id
      LEFT JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN servicios s ON g.servicio_id = s.id
      LEFT JOIN multimedia m ON g.imagen_portada = m.id
      LEFT JOIN galeria_multimedia gm ON g.id = gm.galeria_id
      ${whereClause}
      GROUP BY g.id
      ORDER BY g.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT g.id) as total
      FROM galerias g
      ${whereClause}
    `;

    try {
      const rows = await query(query, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        galerias: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener galerías: ${error.message}`);
    }
  }

  /**
   * Actualizar galería
   * @param {number} id - ID de la galería
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Galería actualizada
   */
  static async actualizar(id, datos) {
    const camposPermitidos = [
      'nombre', 'descripcion', 'tipo', 'slug', 'imagen_portada',
      'empleado_id', 'servicio_id', 'activo', 'destacado', 'orden'
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
      UPDATE galerias 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Galería no encontrada');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar galería: ${error.message}`);
    }
  }

  /**
   * Eliminar galería (marcar como inactiva)
   * @param {number} id - ID de la galería
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const query = 'UPDATE galerias SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

    try {
      const result = await query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar galería: ${error.message}`);
    }
  }

  /**
   * Buscar galerías
   * @param {string} termino - Término de búsqueda
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Galerías encontradas
   */
  static async buscar(termino, limite = 20) {
    const query = `
      SELECT g.*,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             s.nombre as servicio_nombre,
             COUNT(gm.multimedia_id) as total_elementos
      FROM galerias g
      LEFT JOIN empleados e ON g.empleado_id = e.id
      LEFT JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN servicios s ON g.servicio_id = s.id
      LEFT JOIN galeria_multimedia gm ON g.id = gm.galeria_id
      WHERE g.activo = 1 
        AND (g.nombre LIKE ? OR g.descripcion LIKE ?)
      GROUP BY g.id
      ORDER BY g.destacado DESC, g.orden ASC
      LIMIT ?
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(query, [busquedaParam, busquedaParam, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar galerías: ${error.message}`);
    }
  }

  /**
   * Obtener galerías por tipo
   * @param {string} tipo - Tipo de galería
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Galerías del tipo
   */
  static async obtenerPorTipo(tipo, opciones = {}) {
    const { activo = 1, destacado = null, limite = 50 } = opciones;

    let whereConditions = ['g.tipo = ?', 'g.activo = ?'];
    let params = [tipo, activo];

    if (destacado !== null) {
      whereConditions.push('g.destacado = ?');
      params.push(destacado);
    }

    const query = `
      SELECT g.*,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             s.nombre as servicio_nombre,
             COUNT(gm.multimedia_id) as total_elementos
      FROM galerias g
      LEFT JOIN empleados e ON g.empleado_id = e.id
      LEFT JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN servicios s ON g.servicio_id = s.id
      LEFT JOIN galeria_multimedia gm ON g.id = gm.galeria_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY g.id
      ORDER BY g.orden ASC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [...params, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener galerías por tipo: ${error.message}`);
    }
  }

  /**
   * Obtener galerías por empleado
   * @param {number} empleado_id - ID del empleado
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Galerías del empleado
   */
  static async obtenerPorEmpleado(empleado_id, opciones = {}) {
    const { activo = 1, limite = 50 } = opciones;

    const query = `
      SELECT g.*,
             s.nombre as servicio_nombre,
             COUNT(gm.multimedia_id) as total_elementos
      FROM galerias g
      LEFT JOIN servicios s ON g.servicio_id = s.id
      LEFT JOIN galeria_multimedia gm ON g.id = gm.galeria_id
      WHERE g.empleado_id = ? AND g.activo = ?
      GROUP BY g.id
      ORDER BY g.orden ASC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [empleado_id, activo, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener galerías por empleado: ${error.message}`);
    }
  }

  /**
   * Obtener galerías por servicio
   * @param {number} servicio_id - ID del servicio
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Galerías del servicio
   */
  static async obtenerPorServicio(servicio_id, opciones = {}) {
    const { activo = 1, limite = 50 } = opciones;

    const query = `
      SELECT g.*,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             COUNT(gm.multimedia_id) as total_elementos
      FROM galerias g
      LEFT JOIN empleados e ON g.empleado_id = e.id
      LEFT JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN galeria_multimedia gm ON g.id = gm.galeria_id
      WHERE g.servicio_id = ? AND g.activo = ?
      GROUP BY g.id
      ORDER BY g.orden ASC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [servicio_id, activo, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener galerías por servicio: ${error.message}`);
    }
  }

  /**
   * Obtener galerías destacadas
   * @param {number} limite - Límite de resultados
   * @returns {Promise<Array>} Galerías destacadas
   */
  static async obtenerDestacadas(limite = 10) {
    const query = `
      SELECT g.*,
             CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
             s.nombre as servicio_nombre,
             m.titulo as imagen_portada_titulo,
             m.archivo as imagen_portada_archivo,
             COUNT(gm.multimedia_id) as total_elementos
      FROM galerias g
      LEFT JOIN empleados e ON g.empleado_id = e.id
      LEFT JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
      LEFT JOIN servicios s ON g.servicio_id = s.id
      LEFT JOIN multimedia m ON g.imagen_portada = m.id
      LEFT JOIN galeria_multimedia gm ON g.id = gm.galeria_id
      WHERE g.destacado = 1 AND g.activo = 1
      GROUP BY g.id
      ORDER BY g.orden ASC
      LIMIT ?
    `;

    try {
      const rows = await query(query, [limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener galerías destacadas: ${error.message}`);
    }
  }

  /**
   * Obtener elementos multimedia de una galería
   * @param {number} galeria_id - ID de la galería
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Elementos multimedia de la galería
   */
  static async obtenerElementos(galeria_id, opciones = {}) {
    const { orden = 'orden', direccion = 'ASC' } = opciones;

    const query = `
      SELECT m.*, gm.orden, gm.es_antes, gm.es_despues
      FROM multimedia m
      JOIN galeria_multimedia gm ON m.id = gm.multimedia_id
      WHERE gm.galeria_id = ? AND m.activo = 1
      ORDER BY gm.${orden} ${direccion}
    `;

    try {
      const rows = await query(query, [galeria_id]);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener elementos de galería: ${error.message}`);
    }
  }

  /**
   * Agregar elemento multimedia a galería
   * @param {number} galeria_id - ID de la galería
   * @param {number} multimedia_id - ID del archivo multimedia
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Object>} Elemento agregado
   */
  static async agregarElemento(galeria_id, multimedia_id, opciones = {}) {
    const { orden = 0, es_antes = 0, es_despues = 0 } = opciones;

    const query = `
      INSERT INTO galeria_multimedia (galeria_id, multimedia_id, orden, es_antes, es_despues)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE orden = ?, es_antes = ?, es_despues = ?
    `;

    try {
      const result = await query(query, [
        galeria_id, multimedia_id, orden, es_antes, es_despues,
        orden, es_antes, es_despues
      ]);

      return { galeria_id, multimedia_id, orden, es_antes, es_despues };
    } catch (error) {
      throw new Error(`Error al agregar elemento: ${error.message}`);
    }
  }

  /**
   * Remover elemento multimedia de galería
   * @param {number} galeria_id - ID de la galería
   * @param {number} multimedia_id - ID del archivo multimedia
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async removerElemento(galeria_id, multimedia_id) {
    const query = 'DELETE FROM galeria_multimedia WHERE galeria_id = ? AND multimedia_id = ?';

    try {
      const result = await query(query, [galeria_id, multimedia_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al remover elemento: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de galerías
   * @returns {Promise<Object>} Estadísticas de galerías
   */
  static async obtenerEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total_galerias,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as galerias_activas,
        COUNT(CASE WHEN destacado = 1 THEN 1 END) as galerias_destacadas,
        COUNT(DISTINCT tipo) as tipos_diferentes,
        COUNT(DISTINCT empleado_id) as empleados_con_galerias,
        COUNT(DISTINCT servicio_id) as servicios_con_galerias,
        AVG(total_elementos) as promedio_elementos_por_galeria
      FROM (
        SELECT g.*, COUNT(gm.multimedia_id) as total_elementos
        FROM galerias g
        LEFT JOIN galeria_multimedia gm ON g.id = gm.galeria_id
        GROUP BY g.id
      ) as stats
    `;

    try {
      const rows = await query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Verificar si un slug existe
   * @param {string} slug - Slug de la galería
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe el slug
   */
  static async existeSlug(slug, excludeId = null) {
    let query = 'SELECT COUNT(*) as total FROM galerias WHERE slug = ?';
    let params = [slug];

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

  /**
   * Generar slug único
   * @param {string} nombre - Nombre de la galería
   * @returns {Promise<string>} Slug único
   */
  static async generarSlug(nombre) {
    let slug = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    let slugFinal = slug;
    let contador = 1;

    while (await this.existeSlug(slugFinal)) {
      slugFinal = `${slug}-${contador}`;
      contador++;
    }

    return slugFinal;
  }
}

module.exports = Galeria; 