const { admin } = require('../config/firebaseAdmin');
const {pool} = require('../config/database');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const Empleado = require('../models/Empleado');
const Log = require('../models/Log');

class AuthService {
  constructor() {
    this.maxLoginAttempts = 10;
    this.sessionExpiry = 24 * 60 * 60 * 1000; // 24 horas
    this.maxDevices = 3;
  }

  /**
   * Autenticación principal con Google OAuth
   * @param {string} idToken - Token de ID de Google
   * @param {string} userAgent - User agent del dispositivo
   * @param {string} ip - IP del cliente
   * @returns {Object} - Datos del usuario autenticado
   */
  async loginGoogle(idToken, userAgent, ip) {
    try {
      // Validar token de Google
      const decodedToken = await admin.auth().verifyIdToken(idToken);
  
      // Buscar o crear usuario
      let usuario = await this.buscarUsuarioPorFirebaseUid(decodedToken.uid);
      if (!usuario) {
        usuario = await this.crearUsuarioDesdeGoogle(decodedToken);
      } else {
        await this.actualizarUltimoAcceso(usuario.id);
      }
      if (!usuario.activo) {
        throw new Error('Usuario inactivo. Contacte al administrador.');
      }
  
      // Registrar log
      await this.registrarLog(usuario.id, 'LOGIN_GOOGLE', 'usuarios', usuario.id, {
        email: usuario.email,
        userAgent,
        ip,
      });
  
      // Generar tokens JWT
      const accessToken = this.generarAccessToken(usuario);
      const refreshToken = this.generarRefreshToken(usuario);
  
      // Retornar usuario + tokens
      return {
        usuario,
        accessToken,
        refreshToken,
      };
  
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Buscar usuario por Firebase UID
   */
  async buscarUsuarioPorFirebaseUid(firebaseUid) {
    try {
      const rows = await query(
        'SELECT * FROM usuarios WHERE firebase_uid = ?',
        [firebaseUid]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error buscando usuario: ${error.message}`);
    }
  }

  /**
   * Crear nuevo usuario desde datos de Google
   */
  async crearUsuarioDesdeGoogle(decodedToken) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
  
      const rolId = 1;
  
      // Insertar usuario
      const [result] = await connection.query(
        `INSERT INTO usuarios (firebase_uid, email, nombre, apellido, foto_perfil, rol_id, activo) 
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          decodedToken.uid,
          decodedToken.email,
          decodedToken.name?.split(' ')[0] || '',
          decodedToken.name?.split(' ').slice(1).join(' ') || '',
          decodedToken.picture || null,
          rolId
        ]
      );
  
      const usuarioId = result.insertId;
  
      // Insertar cliente relacionado
      await connection.query(
        'INSERT INTO clientes (usuario_id) VALUES (?)',
        [usuarioId]
      );
  
      await connection.commit();
  
      // Obtener usuario creado
      const [rows] = await connection.query(
        'SELECT * FROM usuarios WHERE id = ?',
        [usuarioId]
      );
  
      return rows[0];
  
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creando usuario: ${error.message}`);
    } finally {
      connection.release();
    }
  }
  

  /**
   * Actualizar último acceso
   */
  async actualizarUltimoAcceso(usuarioId) {
    await query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
      [usuarioId]
    );
  }

  /**
   * Registrar log de auditoría
   */
  async registrarLog(usuarioId, accion = 'LOGIN_GOOGLE', tabla = 'usuarios', registroId = null, detalles = {}, ip = null, userAgent = null) {
    try {
      await Log.crear({
        accion: accion || 'LOGIN_GOOGLE',
        tabla_afectada: tabla || 'usuarios',
        registro_id: registroId !== undefined ? registroId : null,
        detalles: detalles ? JSON.stringify(detalles) : null,
        usuario_id: usuarioId !== undefined ? usuarioId : null,
        ip: ip !== undefined ? ip : null,
        user_agent: userAgent !== undefined ? userAgent : null,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Error registrando log:', error);
    }
  }

  /**
   * Obtener datos completos del usuario por ID
   */
  async obtenerDatosCompletos(usuarioId) {
    try {
      console.log('[obtenerDatosCompletos] usuarioId:', usuarioId);
      // Consulta principal con joins
      const rows = await query(
        `SELECT u.*, r.nombre as rol_nombre, 
                c.id as cliente_id, c.fecha_nacimiento, c.genero, c.notas_preferencias,
                e.id as empleado_id, e.titulo, e.biografia, e.fecha_contratacion
         FROM usuarios u
         LEFT JOIN roles r ON u.rol_id = r.id
         LEFT JOIN clientes c ON u.id = c.usuario_id
         LEFT JOIN empleados e ON u.id = e.usuario_id
         WHERE u.id = ?
         LIMIT 1`,
        [usuarioId]
      );
      console.log('[obtenerDatosCompletos] resultado consulta principal:', rows);
      let user = null;
      if (rows.length > 0) {
        user = rows[0];
      } else {
        // Consulta solo el usuario y su rol
        const usuarios = await query(
          `SELECT u.*, r.nombre as rol_nombre
           FROM usuarios u
           LEFT JOIN roles r ON u.rol_id = r.id
           WHERE u.id = ?
           LIMIT 1`,
          [usuarioId]
        );
        console.log('[obtenerDatosCompletos] resultado consulta solo usuario:', usuarios);
        if (usuarios.length > 0) {
          user = usuarios[0];
        }
      }
      if (!user) {
        console.log('[obtenerDatosCompletos] Usuario no encontrado en ninguna consulta');
        return null;
      }
      // Reemplazar nulos por valores por defecto
      const userFinal = {
        ...user,
        cliente_id: user.cliente_id || 0,
        fecha_nacimiento: user.fecha_nacimiento || '',
        genero: user.genero || '',
        notas_preferencias: user.notas_preferencias || '',
        empleado_id: user.empleado_id || 0,
        titulo: user.titulo || '',
        biografia: user.biografia || '',
        fecha_contratacion: user.fecha_contratacion || '',
        rol_nombre: user.rol_nombre || '',
        foto_perfil: user.foto_perfil || '',
        telefono: user.telefono || '',
        apellido: user.apellido || '',
        nombre: user.nombre || '',
        email: user.email || '',
      };
      console.log('[obtenerDatosCompletos] userFinal retornado:', userFinal);
      return userFinal;
    } catch (error) {
      console.error('[obtenerDatosCompletos] Error:', error);
      throw new Error(`Error obteniendo datos completos: ${error.message}`);
    }
  }

  generarAccessToken(usuario) {
    // El payload puede incluir lo que necesites (id, email, rol, etc.)
    const payload = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol_id,
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  }

  generarRefreshToken(usuario) {
    const payload = { id: usuario.id };
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }
}

module.exports = new AuthService(); 