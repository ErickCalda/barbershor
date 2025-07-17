const { query } = require('../config/database');

/**
 * Modelo para la gestión de carruseles
 * Maneja operaciones CRUD, búsquedas, filtros y gestión de carruseles multimedia
 */
class Carrusel {
  /**
   * Crear un nuevo carrusel
   * @param {Object} carrusel - Datos del carrusel
   * @returns {Promise<Object>} Carrusel creado
   */
  static async crear(carrusel) {
    const {
      nombre,
      descripcion = null,
      velocidad_transicion = 5000,
      tipo_transicion = 'fade',
      activo = 1,
      ubicacion = null,
      orden = 0
    } = carrusel;

    const query = `
      INSERT INTO carruseles (nombre, descripcion, velocidad_transicion, tipo_transicion, activo, ubicacion, orden)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [
        nombre, descripcion, velocidad_transicion, tipo_transicion, activo, ubicacion, orden
      ]);

      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear carrusel: ${error.message}`);
    }
  }

  /**
   * Obtener carrusel por ID
   * @param {number} id - ID del carrusel
   * @returns {Promise<Object|null>} Carrusel encontrado
   */
  static async obtenerPorId(id) {
    const query = `
      SELECT c.*,
             COUNT(cm.multimedia_id) as total_elementos,
             COUNT(CASE WHEN cm.activo = 1 THEN 1 END) as elementos_activos
      FROM carruseles c
      LEFT JOIN carrusel_multimedia cm ON c.id = cm.carrusel_id
      WHERE c.id = ?
      GROUP BY c.id
    `;

    try {
      const rows = await query(query, [id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener carrusel: ${error.message}`);
    }
  }

  /**
   * Obtener todos los carruseles con paginación
   * @param {Object} opciones - Opciones de paginación y filtros
   * @returns {Promise<Object>} Lista de carruseles y metadatos
   */
  static async obtenerTodos(opciones = {}) {
    const {
      pagina = 1,
      limite = 10,
      activo = null,
      ubicacion = null,
      orden = 'orden',
      direccion = 'ASC'
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (activo !== null) {
      whereConditions.push('c.activo = ?');
      params.push(activo);
    }

    if (ubicacion) {
      whereConditions.push('c.ubicacion = ?');
      params.push(ubicacion);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const offset = (pagina - 1) * limite;
    const query = `
      SELECT c.*,
             COUNT(cm.multimedia_id) as total_elementos,
             COUNT(CASE WHEN cm.activo = 1 THEN 1 END) as elementos_activos
      FROM carruseles c
      LEFT JOIN carrusel_multimedia cm ON c.id = cm.carrusel_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.${orden} ${direccion}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM carruseles c
      ${whereClause}
    `;

    try {
      const rows = await query(query, [...params, limite, offset]);
      const countResult = await query(countQuery, params);

      return {
        carruseles: rows,
        paginacion: {
          pagina,
          limite,
          total: countResult[0].total,
          totalPaginas: Math.ceil(countResult[0].total / limite)
        }
      };
    } catch (error) {
      throw new Error(`Error al obtener carruseles: ${error.message}`);
    }
  }

  /**
   * Actualizar carrusel
   * @param {number} id - ID del carrusel
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Carrusel actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['nombre', 'descripcion', 'velocidad_transicion', 'tipo_transicion', 'activo', 'ubicacion', 'orden'];
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
      UPDATE carruseles 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Carrusel no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar carrusel: ${error.message}`);
    }
  }

  /**
   * Eliminar carrusel
   * @param {number} id - ID del carrusel
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const query = 'DELETE FROM carruseles WHERE id = ?';

    try {
      const result = await query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar carrusel: ${error.message}`);
    }
  }

  /**
   * Buscar carruseles por texto
   * @param {string} texto - Texto a buscar
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Carruseles encontrados
   */
  static async buscarPorTexto(texto, opciones = {}) {
    const { limite = 20 } = opciones;

    const query = `
      SELECT c.*,
             COUNT(cm.multimedia_id) as total_elementos,
             COUNT(CASE WHEN cm.activo = 1 THEN 1 END) as elementos_activos
      FROM carruseles c
      LEFT JOIN carrusel_multimedia cm ON c.id = cm.carrusel_id
      WHERE c.nombre LIKE ? 
         OR c.descripcion LIKE ?
         OR c.ubicacion LIKE ?
      GROUP BY c.id
      ORDER BY c.nombre ASC
      LIMIT ?
    `;

    const searchTerm = `%${texto}%`;

    try {
      const rows = await query(query, [searchTerm, searchTerm, searchTerm, limite]);
      return rows;
    } catch (error) {
      throw new Error(`Error al buscar carruseles: ${error.message}`);
    }
  }

  /**
   * Obtener carruseles activos
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Carruseles activos
   */
  static async obtenerActivos(opciones = {}) {
    const { ubicacion = null, orden = 'orden ASC' } = opciones;

    let whereConditions = ['c.activo = 1'];
    let params = [];

    if (ubicacion) {
      whereConditions.push('c.ubicacion = ?');
      params.push(ubicacion);
    }

    const query = `
      SELECT c.*,
             COUNT(cm.multimedia_id) as total_elementos,
             COUNT(CASE WHEN cm.activo = 1 THEN 1 END) as elementos_activos
      FROM carruseles c
      LEFT JOIN carrusel_multimedia cm ON c.id = cm.carrusel_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY c.id
      ORDER BY c.${orden}
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener carruseles activos: ${error.message}`);
    }
  }

  /**
   * Obtener carruseles por ubicación
   * @param {string} ubicacion - Ubicación del carrusel
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Carruseles de la ubicación
   */
  static async obtenerPorUbicacion(ubicacion, opciones = {}) {
    const { activo = null, orden = 'orden ASC' } = opciones;

    let whereConditions = ['c.ubicacion = ?'];
    let params = [ubicacion];

    if (activo !== null) {
      whereConditions.push('c.activo = ?');
      params.push(activo);
    }

    const query = `
      SELECT c.*,
             COUNT(cm.multimedia_id) as total_elementos,
             COUNT(CASE WHEN cm.activo = 1 THEN 1 END) as elementos_activos
      FROM carruseles c
      LEFT JOIN carrusel_multimedia cm ON c.id = cm.carrusel_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY c.id
      ORDER BY c.${orden}
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener carruseles por ubicación: ${error.message}`);
    }
  }

  /**
   * Activar/desactivar carrusel
   * @param {number} id - ID del carrusel
   * @param {boolean} activo - Estado activo
   * @returns {Promise<Object>} Carrusel actualizado
   */
  static async cambiarEstado(id, activo) {
    const query = `
      UPDATE carruseles 
      SET activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(query, [activo ? 1 : 0, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Carrusel no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al cambiar estado del carrusel: ${error.message}`);
    }
  }

  /**
   * Obtener elementos del carrusel
   * @param {number} carrusel_id - ID del carrusel
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Elementos del carrusel
   */
  static async obtenerElementos(carrusel_id, opciones = {}) {
    const { activo = null, orden = 'orden ASC' } = opciones;

    let whereConditions = ['cm.carrusel_id = ?'];
    let params = [carrusel_id];

    if (activo !== null) {
      whereConditions.push('cm.activo = ?');
      params.push(activo);
    }

    const query = `
      SELECT cm.*,
             m.titulo as multimedia_titulo,
             m.descripcion as multimedia_descripcion,
             m.archivo as multimedia_archivo,
             m.tipo_archivo as multimedia_tipo,
             tm.nombre as tipo_multimedia
      FROM carrusel_multimedia cm
      JOIN multimedia m ON cm.multimedia_id = m.id
      LEFT JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY cm.${orden}
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener elementos del carrusel: ${error.message}`);
    }
  }

  /**
   * Agregar elemento al carrusel
   * @param {number} carrusel_id - ID del carrusel
   * @param {Object} elemento - Datos del elemento
   * @returns {Promise<Object>} Elemento agregado
   */
  static async agregarElemento(carrusel_id, elemento) {
    const {
      multimedia_id,
      orden = 0,
      titulo_overlay = null,
      descripcion_overlay = null,
      boton_texto = null,
      boton_enlace = null,
      activo = 1
    } = elemento;

    const query = `
      INSERT INTO carrusel_multimedia 
      (carrusel_id, multimedia_id, orden, titulo_overlay, descripcion_overlay, boton_texto, boton_enlace, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await query(query, [
        carrusel_id, multimedia_id, orden, titulo_overlay, descripcion_overlay, 
        boton_texto, boton_enlace, activo
      ]);

      return this.obtenerElemento(carrusel_id, multimedia_id);
    } catch (error) {
      throw new Error(`Error al agregar elemento al carrusel: ${error.message}`);
    }
  }

  /**
   * Obtener elemento específico del carrusel
   * @param {number} carrusel_id - ID del carrusel
   * @param {number} multimedia_id - ID del multimedia
   * @returns {Promise<Object|null>} Elemento encontrado
   */
  static async obtenerElemento(carrusel_id, multimedia_id) {
    const query = `
      SELECT cm.*,
             m.titulo as multimedia_titulo,
             m.descripcion as multimedia_descripcion,
             m.archivo as multimedia_archivo,
             m.tipo_archivo as multimedia_tipo,
             tm.nombre as tipo_multimedia
      FROM carrusel_multimedia cm
      JOIN multimedia m ON cm.multimedia_id = m.id
      LEFT JOIN tipos_multimedia tm ON m.tipo_id = tm.id
      WHERE cm.carrusel_id = ? AND cm.multimedia_id = ?
    `;

    try {
      const rows = await query(query, [carrusel_id, multimedia_id]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener elemento del carrusel: ${error.message}`);
    }
  }

  /**
   * Actualizar elemento del carrusel
   * @param {number} carrusel_id - ID del carrusel
   * @param {number} multimedia_id - ID del multimedia
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Elemento actualizado
   */
  static async actualizarElemento(carrusel_id, multimedia_id, datos) {
    const camposPermitidos = ['orden', 'titulo_overlay', 'descripcion_overlay', 'boton_texto', 'boton_enlace', 'activo'];
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

    valores.push(carrusel_id, multimedia_id);
    const query = `
      UPDATE carrusel_multimedia 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE carrusel_id = ? AND multimedia_id = ?
    `;

    try {
      const result = await query(query, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Elemento del carrusel no encontrado');
      }

      return this.obtenerElemento(carrusel_id, multimedia_id);
    } catch (error) {
      throw new Error(`Error al actualizar elemento del carrusel: ${error.message}`);
    }
  }

  /**
   * Eliminar elemento del carrusel
   * @param {number} carrusel_id - ID del carrusel
   * @param {number} multimedia_id - ID del multimedia
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminarElemento(carrusel_id, multimedia_id) {
    const query = 'DELETE FROM carrusel_multimedia WHERE carrusel_id = ? AND multimedia_id = ?';

    try {
      const result = await query(query, [carrusel_id, multimedia_id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar elemento del carrusel: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de carruseles
   * @returns {Promise<Object>} Estadísticas de carruseles
   */
  static async obtenerEstadisticas() {
    const query = `
      SELECT 
        COUNT(*) as total_carruseles,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as carruseles_activos,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as carruseles_inactivos,
        COUNT(DISTINCT ubicacion) as ubicaciones_diferentes,
        AVG(velocidad_transicion) as velocidad_promedio,
        COUNT(CASE WHEN tipo_transicion = 'fade' THEN 1 END) as transicion_fade,
        COUNT(CASE WHEN tipo_transicion = 'slide' THEN 1 END) as transicion_slide
      FROM carruseles
    `;

    try {
      const rows = await query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas por ubicación
   * @returns {Promise<Array>} Estadísticas por ubicación
   */
  static async obtenerEstadisticasPorUbicacion() {
    const query = `
      SELECT 
        ubicacion,
        COUNT(*) as total_carruseles,
        COUNT(CASE WHEN activo = 1 THEN 1 END) as carruseles_activos,
        AVG(velocidad_transicion) as velocidad_promedio
      FROM carruseles
      WHERE ubicacion IS NOT NULL
      GROUP BY ubicacion
      ORDER BY total_carruseles DESC
    `;

    try {
      const rows = await query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener estadísticas por ubicación: ${error.message}`);
    }
  }

  /**
   * Obtener tipos de transición disponibles
   * @returns {Array} Tipos de transición
   */
  static obtenerTiposTransicion() {
    return ['fade', 'slide', 'zoom', 'flip', 'cube'];
  }

  /**
   * Obtener ubicaciones comunes
   * @returns {Array} Ubicaciones comunes
   */
  static obtenerUbicacionesComunes() {
    return ['inicio', 'servicios', 'galeria', 'productos', 'contacto', 'sobre_nosotros'];
  }

  /**
   * Reordenar elementos del carrusel
   * @param {number} carrusel_id - ID del carrusel
   * @param {Array} elementos - Array con IDs y nuevos órdenes
   * @returns {Promise<Array>} Elementos actualizados
   */
  static async reordenarElementos(carrusel_id, elementos) {
    const elementosActualizados = [];

    for (const elemento of elementos) {
      try {
        const elementoActualizado = await this.actualizarElemento(carrusel_id, elemento.multimedia_id, {
          orden: elemento.orden
        });
        elementosActualizados.push(elementoActualizado);
      } catch (error) {
        console.error(`Error al reordenar elemento ${elemento.multimedia_id}:`, error);
      }
    }

    return elementosActualizados;
  }

  /**
   * Exportar carruseles a formato CSV
   * @param {Object} opciones - Opciones de exportación
   * @returns {Promise<Array>} Datos para CSV
   */
  static async exportarCSV(opciones = {}) {
    const { 
      activo = null,
      ubicacion = null
    } = opciones;

    let whereConditions = [];
    let params = [];

    if (activo !== null) {
      whereConditions.push('c.activo = ?');
      params.push(activo);
    }

    if (ubicacion) {
      whereConditions.push('c.ubicacion = ?');
      params.push(ubicacion);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT c.id, c.nombre, c.descripcion, c.velocidad_transicion, c.tipo_transicion,
             c.activo, c.ubicacion, c.orden, c.created_at,
             COUNT(cm.multimedia_id) as total_elementos,
             COUNT(CASE WHEN cm.activo = 1 THEN 1 END) as elementos_activos
      FROM carruseles c
      LEFT JOIN carrusel_multimedia cm ON c.id = cm.carrusel_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.orden ASC
    `;

    try {
      const rows = await query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al exportar carruseles: ${error.message}`);
    }
  }
}

module.exports = Carrusel; 