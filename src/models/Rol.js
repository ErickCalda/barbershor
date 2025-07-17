const { query } = require('../config/database');

/**
 * Modelo para la gestión de roles de usuario
 * Maneja operaciones CRUD y consultas relacionadas con roles
 */
class Rol {
  /**
   * Crear un nuevo rol
   * @param {Object} rolData - Datos del rol
   * @returns {Promise<Object>} Rol creado
   */
  static async crear(rolData) {
    const { nombre, descripcion } = rolData;

    const sql = `
      INSERT INTO roles (nombre, descripcion)
      VALUES (?, ?)
    `;

    try {
      const result = await query(sql, [nombre, descripcion]);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear rol: ${error.message}`);
    }
  }

  /**
   * Obtener rol por ID
   * @param {number} id - ID del rol
   * @returns {Promise<Object|null>} Rol encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT r.*, 
             COUNT(u.id) as total_usuarios
      FROM roles r
      LEFT JOIN usuarios u ON r.id = u.rol_id
      WHERE r.id = ?
      GROUP BY r.id
    `;

    try {
      const rows = await query(sql, [id]);
      if (rows[0]) {
        // Como no hay columna permisos en la tabla roles, asignamos un array vacío por defecto
        rows[0].permisos = [];
      }
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener rol: ${error.message}`);
    }
  }

  /**
   * Obtener todos los roles
   * @param {Object} opciones - Opciones de filtrado
   * @returns {Promise<Array>} Lista de roles
   */
  static async obtenerTodos(opciones = {}) {
    const { incluirUsuarios = false } = opciones;

    const sql = `
      SELECT r.*, 
             COUNT(u.id) as total_usuarios
      FROM roles r
      LEFT JOIN usuarios u ON r.id = u.rol_id
      GROUP BY r.id
      ORDER BY r.nombre
    `;

    try {
      const rows = await query(sql);
      
      // Asignar permisos como array vacío por defecto para cada rol
      rows.forEach(rol => {
        rol.permisos = [];
      });

      if (incluirUsuarios) {
        // Obtener usuarios para cada rol
        for (let rol of rows) {
          rol.usuarios = await this.obtenerUsuariosPorRol(rol.id);
        }
      }

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener roles: ${error.message}`);
    }
  }

  /**
   * Actualizar rol
   * @param {number} id - ID del rol
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} Rol actualizado
   */
  static async actualizar(id, datos) {
    const camposPermitidos = ['nombre', 'descripcion'];
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
      UPDATE roles 
      SET ${camposActualizar.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Rol no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar rol: ${error.message}`);
    }
  }

  /**
   * Eliminar rol
   * @param {number} id - ID del rol
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    // Verificar si tiene usuarios asociados
    const usuarios = await this.obtenerUsuariosPorRol(id);
    if (usuarios.length > 0) {
      throw new Error('No se puede eliminar un rol que tiene usuarios asociados');
    }

    const sql = 'DELETE FROM roles WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar rol: ${error.message}`);
    }
  }

  /**
   * Buscar roles por nombre
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Roles encontrados
   */
  static async buscar(termino) {
    const sql = `
      SELECT r.*, 
             COUNT(u.id) as total_usuarios
      FROM roles r
      LEFT JOIN usuarios u ON r.id = u.rol_id
      WHERE r.nombre LIKE ? OR r.descripcion LIKE ?
      GROUP BY r.id
      ORDER BY r.nombre
    `;

    const busquedaParam = `%${termino}%`;

    try {
      const rows = await query(sql, [busquedaParam, busquedaParam]);
      
      // Asignar permisos como array vacío por defecto para cada rol
      rows.forEach(rol => {
        rol.permisos = [];
      });

      return rows;
    } catch (error) {
      throw new Error(`Error al buscar roles: ${error.message}`);
    }
  }

  /**
   * Obtener usuarios por rol
   * @param {number} rol_id - ID del rol
   * @param {Object} opciones - Opciones adicionales
   * @returns {Promise<Array>} Usuarios del rol
   */
  static async obtenerUsuariosPorRol(rol_id, opciones = {}) {
    const { activo = null, limite = null } = opciones;

    let whereConditions = ['u.rol_id = ?'];
    let params = [rol_id];

    if (activo !== null) {
      whereConditions.push('u.activo = ?');
      params.push(activo);
    }

    let limitClause = '';
    if (limite) {
      limitClause = 'LIMIT ?';
      params.push(limite);
    }

    const sql = `
      SELECT u.*, r.nombre as rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY u.nombre, u.apellido
      ${limitClause}
    `;

    try {
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener usuarios por rol: ${error.message}`);
    }
  }

  /**
   * Obtener rol por nombre
   * @param {string} nombre - Nombre del rol
   * @returns {Promise<Object|null>} Rol encontrado
   */
  static async obtenerPorNombre(nombre) {
    const sql = `
      SELECT r.*, 
             COUNT(u.id) as total_usuarios
      FROM roles r
      LEFT JOIN usuarios u ON r.id = u.rol_id
      WHERE r.nombre = ?
      GROUP BY r.id
    `;

    try {
      const rows = await query(sql, [nombre]);
      if (rows[0]) {
        // Como no hay columna permisos en la tabla roles, asignamos un array vacío por defecto
        rows[0].permisos = [];
      }
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener rol por nombre: ${error.message}`);
    }
  }

  /**
   * Verificar si un rol existe
   * @param {string} nombre - Nombre del rol
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe el rol
   */
  static async existe(nombre, excludeId = null) {
    let sql = 'SELECT COUNT(*) as total FROM roles WHERE nombre = ?';
    let params = [nombre];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const rows = await query(sql, params);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al verificar existencia: ${error.message}`);
    }
  }

  /**
   * Obtener roles sin usuarios
   * @returns {Promise<Array>} Roles sin usuarios
   */
  static async obtenerSinUsuarios() {
    const sql = `
      SELECT r.*, 
             COUNT(u.id) as total_usuarios
      FROM roles r
      LEFT JOIN usuarios u ON r.id = u.rol_id
      GROUP BY r.id
      HAVING total_usuarios = 0
      ORDER BY r.nombre
    `;

    try {
      const rows = await query(sql);
      
      // Asignar permisos como array vacío por defecto para cada rol
      rows.forEach(rol => {
        rol.permisos = [];
      });

      return rows;
    } catch (error) {
      throw new Error(`Error al obtener roles sin usuarios: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de roles
   * @returns {Promise<Object>} Estadísticas de roles
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_roles,
        COUNT(CASE WHEN total_usuarios > 0 THEN 1 END) as roles_con_usuarios,
        COUNT(CASE WHEN total_usuarios = 0 THEN 1 END) as roles_sin_usuarios,
        AVG(total_usuarios) as promedio_usuarios_por_rol,
        MAX(total_usuarios) as max_usuarios_por_rol
      FROM (
        SELECT r.id, COUNT(u.id) as total_usuarios
        FROM roles r
        LEFT JOIN usuarios u ON r.id = u.rol_id
        GROUP BY r.id
      ) as stats
    `;

    try {
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Crear roles por defecto
   * @returns {Promise<Array>} Roles creados
   */
  static async crearRolesPorDefecto() {
    const rolesPorDefecto = [
      {
        nombre: 'Administrador',
        descripcion: 'Acceso completo al sistema'
      },
      {
        nombre: 'Empleado',
        descripcion: 'Acceso a funciones de empleado'
      },
      {
        nombre: 'Cliente',
        descripcion: 'Acceso limitado para clientes'
      }
    ];

    const rolesCreados = [];

    for (const rol of rolesPorDefecto) {
      try {
        const existe = await this.existe(rol.nombre);
        if (!existe) {
          const rolCreado = await this.crear(rol);
          rolesCreados.push(rolCreado);
        }
      } catch (error) {
        console.error(`Error creando rol ${rol.nombre}:`, error);
      }
    }

    return rolesCreados;
  }
}

module.exports = Rol; 