const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Modelo para la gestión de usuarios
 * Maneja operaciones CRUD, autenticación y consultas relacionadas con usuarios
 */
class Usuario {
  /**
   * Crear un nuevo usuario
   * @param {Object} usuarioData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado
   */
  static async crear(usuarioData) {
    const {
      nombre,
      apellido,
      email,
      password,
      telefono,
      rol_id,
      foto_perfil = null,
      activo = true
    } = usuarioData;

    // Encriptar contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sql = `
      INSERT INTO usuarios (
        nombre, apellido, email, password, telefono, rol_id, foto_perfil, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      nombre, apellido, email, hashedPassword, telefono, rol_id, foto_perfil, activo
    ];

    try {
      const result = await query(sql, params);
      return this.obtenerPorId(result.insertId);
    } catch (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  /**
   * Obtener usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  static async obtenerPorId(id) {
    const sql = `
      SELECT u.*, r.nombre as rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ?
    `;

    try {
      const rows = await query(sql, [id]);
      if (rows.length > 0) {
        // Como no hay columna permisos en la tabla roles, asignamos un array vacío por defecto
        rows[0].rol_permisos = [];
      }
      return rows.length > 0 ? this.sanearUsuario(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }
  }

  /**
   * Obtener usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  static async obtenerPorEmail(email) {
    const sql = `
      SELECT u.*, r.nombre as rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.email = ?
    `;

    try {
      const rows = await query(sql, [email]);
      if (rows.length > 0) {
        // Como no hay columna permisos en la tabla roles, asignamos un array vacío por defecto
        rows[0].rol_permisos = [];
      }
      return rows.length > 0 ? this.sanearUsuario(rows[0]) : null;
    } catch (error) {
      throw new Error(`Error al obtener usuario por email: ${error.message}`);
    }
  }

  /**
   * Obtener todos los usuarios
   * @param {Object} filtros - Filtros opcionales
   * @returns {Promise<Array>} Lista de usuarios
   */
  static async obtenerTodos(filtros = {}) {
    console.log('🔍 [Usuario.obtenerTodos] Iniciando con filtros:', filtros);
    
    let sql = `
      SELECT u.*, r.nombre as rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
    `;
    
    const params = [];
    const condiciones = [];

    // Aplicar filtros
    if (filtros.activo !== undefined) {
      condiciones.push('u.activo = ?');
      params.push(filtros.activo);
    }

    if (filtros.rol_id) {
      condiciones.push('u.rol_id = ?');
      params.push(filtros.rol_id);
    }

    if (filtros.busqueda) {
      condiciones.push('(u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?)');
      const busqueda = `%${filtros.busqueda}%`;
      params.push(busqueda, busqueda, busqueda);
    }

    if (condiciones.length > 0) {
      sql += ' WHERE ' + condiciones.join(' AND ');
    }

    // Ordenamiento
    sql += ' ORDER BY u.nombre, u.apellido';

    // Paginación con validación
    if (filtros.limite) {
      const limiteNum = Math.max(1, Math.min(100, parseInt(filtros.limite) || 10));
      sql += ' LIMIT ?';
      params.push(limiteNum);
      
      if (filtros.offset) {
        const offsetNum = Math.max(0, parseInt(filtros.offset) || 0);
        sql += ' OFFSET ?';
        params.push(offsetNum);
      }
    }

    console.log('🔍 [Usuario.obtenerTodos] SQL final:', sql);
    console.log('🔍 [Usuario.obtenerTodos] Parámetros:', params);

    try {
      console.log('🔍 [Usuario.obtenerTodos] Ejecutando query...');
      const rows = await query(sql, params);
      console.log('🔍 [Usuario.obtenerTodos] Query ejecutada exitosamente. Filas obtenidas:', rows.length);
      
      if (rows.length > 0) {
        console.log('🔍 [Usuario.obtenerTodos] Primera fila de ejemplo:', {
          id: rows[0].id,
          nombre: rows[0].nombre,
          apellido: rows[0].apellido,
          email: rows[0].email,
          rol_id: rows[0].rol_id,
          rol_nombre: rows[0].rol_nombre
        });
      }
      
      console.log('🔍 [Usuario.obtenerTodos] Iniciando procesamiento de filas...');
      
      // Procesar cada usuario y sanear
      const usuariosProcesados = rows.map((usuario, index) => {
        try {
          console.log(`🔍 [Usuario.obtenerTodos] Procesando usuario ${index + 1}/${rows.length}:`, {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido
          });
          
          // Como no hay columna permisos en la tabla roles, asignamos un array vacío por defecto
          usuario.rol_permisos = [];
          console.log(`🔍 [Usuario.obtenerTodos] Permisos asignados para usuario ${usuario.id}:`, usuario.rol_permisos);
          
          // Sanear usuario
          const usuarioSaneado = this.sanearUsuario(usuario);
          console.log(`🔍 [Usuario.obtenerTodos] Usuario ${usuario.id} saneado:`, {
            nombre: usuarioSaneado.nombre,
            apellido: usuarioSaneado.apellido,
            telefono: usuarioSaneado.telefono,
            foto_perfil: usuarioSaneado.foto_perfil
          });
          
          return usuarioSaneado;
        } catch (usuarioError) {
          console.error(`❌ [Usuario.obtenerTodos] Error procesando usuario ${index + 1}:`, usuarioError);
          console.error(`❌ [Usuario.obtenerTodos] Datos del usuario problemático:`, usuario);
          throw usuarioError;
        }
      });
      
      console.log('🔍 [Usuario.obtenerTodos] Procesamiento completado. Usuarios retornados:', usuariosProcesados.length);
      return usuariosProcesados;
    } catch (error) {
      console.error('❌ [Usuario.obtenerTodos] Error en obtenerTodos:', error);
      console.error('❌ [Usuario.obtenerTodos] Stack trace:', error.stack);
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  /**
   * Actualizar usuario
   * @param {number} id - ID del usuario
   * @param {Object} usuarioData - Datos a actualizar
   * @returns {Promise<Object>} Usuario actualizado
   */
  static async actualizar(id, usuarioData) {
    const camposPermitidos = [
      'nombre', 'apellido', 'email', 'telefono', 'rol_id', 'foto_perfil', 'activo'
    ];

    const camposActualizar = [];
    const valores = [];

    // Filtrar solo campos permitidos
    for (const campo of camposPermitidos) {
      if (usuarioData[campo] !== undefined) {
        camposActualizar.push(`${campo} = ?`);
        valores.push(usuarioData[campo]);
      }
    }

    // Manejar actualización de contraseña
    if (usuarioData.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(usuarioData.password, saltRounds);
      camposActualizar.push('password = ?');
      valores.push(hashedPassword);
    }

    if (camposActualizar.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }

    valores.push(id);
    const sql = `UPDATE usuarios SET ${camposActualizar.join(', ')} WHERE id = ?`;
    
    try {
      const result = await query(sql, valores);
      
      if (result.affectedRows === 0) {
        throw new Error('Usuario no encontrado');
      }

      return this.obtenerPorId(id);
    } catch (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  /**
   * Eliminar usuario
   * @param {number} id - ID del usuario
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async eliminar(id) {
    const sql = 'DELETE FROM usuarios WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  /**
   * Verificar credenciales de usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object|null>} Usuario autenticado o null
   */
  static async verificarCredenciales(email, password) {
    try {
      const usuario = await this.obtenerPorEmail(email);
      
      if (!usuario || !usuario.activo) {
        return null;
      }

      const passwordValido = await bcrypt.compare(password, usuario.password);
      
      if (!passwordValido) {
        return null;
      }

      // Actualizar último acceso
      await this.actualizarUltimoAcceso(usuario.id);

      return usuario;
    } catch (error) {
      throw new Error(`Error al verificar credenciales: ${error.message}`);
    }
  }

  /**
   * Actualizar último acceso
   * @param {number} id - ID del usuario
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async actualizarUltimoAcceso(id) {
    const sql = 'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?';

    try {
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al actualizar último acceso: ${error.message}`);
    }
  }

  /**
   * Cambiar contraseña
   * @param {number} id - ID del usuario
   * @param {string} passwordActual - Contraseña actual
   * @param {string} passwordNuevo - Nueva contraseña
   * @returns {Promise<boolean>} Resultado de la operación
   */
  static async cambiarPassword(id, passwordActual, passwordNuevo) {
    try {
      const usuario = await this.obtenerPorId(id);
      
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
      
      if (!passwordValido) {
        throw new Error('Contraseña actual incorrecta');
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(passwordNuevo, saltRounds);

      const sql = 'UPDATE usuarios SET password = ? WHERE id = ?';
      const result = await query(sql, [hashedPassword, id]);

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error al cambiar contraseña: ${error.message}`);
    }
  }

  /**
   * Verificar si existe un email
   * @param {string} email - Email a verificar
   * @param {number} excludeId - ID a excluir (para actualizaciones)
   * @returns {Promise<boolean>} Existe el email
   */
  static async existeEmail(email, excludeId = null) {
    let sql = 'SELECT COUNT(*) as total FROM usuarios WHERE email = ?';
    let params = [email];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const rows = await query(sql, params);
      return rows[0].total > 0;
    } catch (error) {
      throw new Error(`Error al verificar email: ${error.message}`);
    }
  }

  /**
   * Buscar usuarios
   * @param {string} termino - Término de búsqueda
   * @returns {Promise<Array>} Usuarios encontrados
   */
  static async buscar(termino) {
    const sql = `
      SELECT u.*, r.nombre as rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ?
      ORDER BY u.nombre, u.apellido
    `;

    const busqueda = `%${termino}%`;

    try {
      const rows = await query(sql, [busqueda, busqueda, busqueda]);
      // Asignar permisos como array vacío por defecto y sanear
      return rows.map(usuario => {
        usuario.rol_permisos = [];
        return this.sanearUsuario(usuario);
      });
    } catch (error) {
      throw new Error(`Error al buscar usuarios: ${error.message}`);
    }
  }

  /**
   * Obtener usuarios por rol
   * @param {number} rol_id - ID del rol
   * @returns {Promise<Array>} Usuarios del rol
   */
  static async obtenerPorRol(rol_id) {
    const sql = `
      SELECT u.*, r.nombre as rol_nombre
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE u.rol_id = ?
      ORDER BY u.nombre, u.apellido
    `;

    try {
      const rows = await query(sql, [rol_id]);
      // Asignar permisos como array vacío por defecto y sanear
      return rows.map(usuario => {
        usuario.rol_permisos = [];
        return this.sanearUsuario(usuario);
      });
    } catch (error) {
      throw new Error(`Error al obtener usuarios por rol: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de usuarios
   * @returns {Promise<Object>} Estadísticas de usuarios
   */
  static async obtenerEstadisticas() {
    const sql = `
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN activo = true THEN 1 END) as usuarios_activos,
        COUNT(CASE WHEN activo = false THEN 1 END) as usuarios_inactivos,
        COUNT(CASE WHEN ultimo_acceso >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as usuarios_activos_semana,
        COUNT(CASE WHEN ultimo_acceso >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as usuarios_activos_mes
      FROM usuarios
    `;

    try {
      const rows = await query(sql);
      return rows[0];
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  // Función utilitaria para sanear campos nulos en usuario
  static sanearUsuario(usuario) {
    if (!usuario) return usuario;
    usuario.nombre = usuario.nombre || '';
    usuario.apellido = usuario.apellido || '';
    usuario.telefono = usuario.telefono || '';
    usuario.foto_perfil = usuario.foto_perfil || '';
    return usuario;
  }


  /**
 * Obtener usuario por Firebase UID
 * @param {string} firebase_uid - UID de Firebase
 * @returns {Promise<Object|null>} Usuario encontrado
 */
static async obtenerPorFirebaseUid(firebase_uid) {
  const sql = `
    SELECT u.*, r.nombre as rol_nombre
    FROM usuarios u
    INNER JOIN roles r ON u.rol_id = r.id
    WHERE u.firebase_uid = ?
    LIMIT 1
  `;

  try {
    const rows = await query(sql, [firebase_uid]);
    if (rows.length > 0) {
      rows[0].rol_permisos = [];
    }
    return rows.length > 0 ? this.sanearUsuario(rows[0]) : null;
  } catch (error) {
    throw new Error(`Error al obtener usuario por Firebase UID: ${error.message}`);
  }
}





  
}

module.exports = Usuario; 