const authService = require('../services/authService');
const { validationResult } = require('express-validator');
const admin = require('firebase-admin');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

class AuthController {
  /**
   * Login con Google OAuth
   * POST /api/auth/login/google
   */
  async loginGoogle(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { idToken } = req.body;
      const userAgent = req.get('User-Agent');
      const ip = req.ip || req.connection.remoteAddress;

      const result = await authService.loginGoogle(idToken, userAgent, ip);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error en loginGoogle controller:', error);
      res.status(401).json({
        success: false,
        mensaje: error.message
      });
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   * GET /api/auth/profile
   */
  async obtenerPerfil(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const datosCompletos = await authService.obtenerDatosCompletos(usuarioId);

      if (!datosCompletos) {
        // Si no existe el usuario en la base de datos, es un error grave
        return res.status(500).json({
          success: false,
          mensaje: 'Error: usuario no encontrado en la base de datos.'
        });
      }

      res.status(200).json({
        success: true,
        usuario: datosCompletos
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          mensaje: 'Ocurrió un error al obtener el perfil. Intenta nuevamente o contacta al soporte.',
          code: 'PROFILE_FETCH_ERROR',
          ...(process.env.NODE_ENV !== 'production' && { error: error.message })
        });
      }
    }
  }

  /**
   * Actualizar perfil del usuario
   * PUT /api/auth/profile
   */
  async actualizarPerfil(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const usuarioId = req.usuario.id;
      const datosPerfil = req.body;

      const usuarioActualizado = await authService.actualizarPerfil(usuarioId, datosPerfil);

      res.status(200).json({
        success: true,
        usuario: usuarioActualizado,
        mensaje: 'Perfil actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({
        success: false,
        mensaje: 'No se pudo actualizar el perfil. Por favor, revisa los datos e intenta nuevamente.',
        code: 'PROFILE_UPDATE_ERROR',
        ...(process.env.NODE_ENV !== 'production' && { error: error.message })
      });
    }
  }

  /**
   * Verificar estado de autenticación
   * GET /api/auth/verify
   */
  async verificarAutenticacion(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const datosCompletos = await authService.obtenerDatosCompletos(usuarioId);

      res.status(200).json({
        success: true,
        autenticado: true,
        usuario: datosCompletos
      });
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      res.status(401).json({
        success: false,
        autenticado: false,
        mensaje: 'No se pudo verificar la autenticación. El token es inválido o expiró.',
        code: 'AUTH_VERIFICATION_ERROR',
        ...(process.env.NODE_ENV !== 'production' && { error: error.message })
      });
    }
  }

 

  /**
   * Obtener estadísticas de autenticación (solo admin)
   * GET /api/auth/stats
   */
  async obtenerEstadisticas(req, res) {
    try {
      // Verificar que sea admin
      if (req.usuario.rol_id !== 3) {
        return res.status(403).json({
          success: false,
          mensaje: 'Acceso denegado'
        });
      }

      const estadisticas = await authService.obtenerEstadisticas();

      res.status(200).json({
        success: true,
        estadisticas
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        mensaje: 'No se pudieron obtener las estadísticas. Intenta más tarde.',
        code: 'STATS_FETCH_ERROR',
        ...(process.env.NODE_ENV !== 'production' && { error: error.message })
      });
    }
  }

  /**
   * Logout simple (sin gestión de sesiones)
   * POST /api/auth/logout
   */
  async cerrarSesion(req, res) {
    try {
      const usuarioId = req.usuario.id;

      await authService.registrarLog(usuarioId, 'LOGOUT', 'usuarios', usuarioId, {
        accion: 'Sesión cerrada exitosamente'
      });

      res.status(200).json({
        success: true,
        mensaje: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      res.status(500).json({
        success: false,
        mensaje: 'No se pudo cerrar la sesión correctamente. Intenta nuevamente.',
        code: 'LOGOUT_ERROR',
        ...(process.env.NODE_ENV !== 'production' && { error: error.message })
      });
    }
  }

  /**
   * @desc    Verificar estado del token
   * @route   GET /api/auth/verify-token
   * @access  Public
   */
  async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          mensaje: 'Token de acceso requerido',
          code: 'TOKEN_MISSING'
        });
      }
      
      const idToken = authHeader.substring(7);
      
      try {
        // Verificar el token con Firebase Admin
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        // Buscar usuario en la base de datos
        const usuario = await authService.buscarUsuarioPorFirebaseUid(decodedToken.uid);
        
        if (!usuario) {
          return res.status(401).json({
            success: false,
            mensaje: 'Usuario no registrado en la base de datos',
            code: 'USER_NOT_FOUND'
          });
        }
        
        res.status(200).json({
          success: true,
          mensaje: 'Token válido',
          usuario: {
            id: usuario.id,
            firebase_uid: usuario.firebase_uid,
            email: usuario.email,
            nombre: usuario.nombre || '',
            apellido: usuario.apellido || '',
            rol_id: usuario.rol_id,
            picture: usuario.foto_perfil || ''
          }
        });
        
      } catch (firebaseError) {
        console.error('Error verificando token de Firebase:', firebaseError);
        
        if (firebaseError.code === 'auth/id-token-expired') {
          return res.status(401).json({
            success: false,
            mensaje: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            code: 'TOKEN_EXPIRED',
            action: 'REFRESH_TOKEN',
            ...(process.env.NODE_ENV !== 'production' && { error: firebaseError.message })
          });
        }
        
        return res.status(401).json({
          success: false,
          mensaje: 'El token proporcionado no es válido. Por favor, inicia sesión de nuevo.',
          code: 'TOKEN_INVALID',
          action: 'LOGIN_AGAIN',
          ...(process.env.NODE_ENV !== 'production' && { error: firebaseError.message })
        });
      }
      
    } catch (error) {
      console.error('❌ [authController.verifyToken] Error:', error);
      next(new ErrorResponse('Error verificando token', 500));
    }
  }
}

module.exports = new AuthController(); 