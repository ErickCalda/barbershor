// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { admin } = require('../config/firebaseAdmin');
const authService = require('../services/authService');

/**
 * Middleware para verificar token JWT
 */
const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar si el usuario existe y está activo
    const rows = await query(
      'SELECT u.id, u.email, u.rol_id, u.activo, c.id as cliente_id, e.id as empleado_id FROM usuarios u LEFT JOIN clientes c ON u.id = c.usuario_id LEFT JOIN empleados e ON u.id = e.usuario_id WHERE u.id = ? AND u.activo = 1',
      [decoded.id]
    );
    
    if (!rows[0]) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario no encontrado o inactivo'
      });
    }
    
    // Agregar información del usuario al request
    req.usuario = {
      id: rows[0].id,
      email: rows[0].email,
      rol_id: rows[0].rol_id,
      cliente_id: rows[0].cliente_id,
      empleado_id: rows[0].empleado_id
    };
    
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        mensaje: 'Token expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        mensaje: 'Token inválido'
      });
    }
    
    res.status(500).json({
      success: false,
      mensaje: 'Error de autenticación'
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario no autenticado'
      });
    }
    
    // Convertir a array si es un solo rol
    const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
    
    if (!roles.includes(req.usuario.rol_id)) {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Permisos insuficientes.'
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar si es admin
 */
const esAdmin = (req, res, next) => {
  return verificarRol(1)(req, res, next);
};

/**
 * Middleware para verificar si es empleado o admin
 */
const esEmpleadoOAdmin = (req, res, next) => {
  return verificarRol([1, 2])(req, res, next);
};

/**
 * Middleware para verificar si es cliente
 */
const esCliente = (req, res, next) => {
  return verificarRol(3)(req, res, next);
};

/**
 * Middleware para verificar propiedad del recurso
 * Para recursos que pertenecen al usuario autenticado
 */
const verificarPropiedad = (tabla, campoId = 'usuario_id') => {
  return async (req, res, next) => {
    try {
      const recursoId = req.params.id || req.body.id;
      
      if (!recursoId) {
        return res.status(400).json({
          success: false,
          mensaje: 'ID del recurso requerido'
        });
      }
      
      const [rows] = await query(
        `SELECT ${campoId} FROM ${tabla} WHERE id = ?`,
        [recursoId]
      );
      
      if (!rows[0]) {
        return res.status(404).json({
          success: false,
          mensaje: 'Recurso no encontrado'
        });
      }
      
      // Si es admin, puede acceder a cualquier recurso
      if (req.usuario.rol_id === 1) {
        return next();
      }
      
      // Verificar que el recurso pertenezca al usuario
      if (rows[0][campoId] !== req.usuario.id) {
        return res.status(403).json({
          success: false,
          mensaje: 'Acceso denegado. No tienes permisos sobre este recurso.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Error verificando propiedad:', error);
      res.status(500).json({
        success: false,
        mensaje: 'Error verificando permisos'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario puede acceder a datos de cliente
 */
const verificarAccesoCliente = async (req, res, next) => {
  try {
    const clienteId = req.params.clienteId || req.params.id;
    
    if (!clienteId) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID del cliente requerido'
      });
    }
    
    // Si es admin, puede acceder a cualquier cliente
    if (req.usuario.rol_id === 1) {
      return next();
    }
    
    // Si es empleado, puede acceder a clientes
    if (req.usuario.rol_id === 2) {
      return next();
    }
    
    // Si es cliente, solo puede acceder a sus propios datos
    const [rows] = await query(
      'SELECT usuario_id FROM clientes WHERE id = ?',
      [clienteId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cliente no encontrado'
      });
    }
    
    if (rows[0].usuario_id !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. Solo puedes acceder a tus propios datos.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error verificando acceso a cliente:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error verificando permisos'
    });
  }
};

/**
 * Middleware para verificar si el usuario puede acceder a datos de empleado
 */
const verificarAccesoEmpleado = async (req, res, next) => {
  try {
    const empleadoId = req.params.empleadoId || req.params.id;
    
    if (!empleadoId) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID del empleado requerido'
      });
    }
    
    // Si es admin, puede acceder a cualquier empleado
    if (req.usuario.rol_id === 1) {
      return next();
    }
    
    // Si es empleado, solo puede acceder a sus propios datos
    if (req.usuario.rol_id === 2) {
      const [rows] = await query(
        'SELECT usuario_id FROM empleados WHERE id = ?',
        [empleadoId]
      );
      
      if (!rows[0]) {
        return res.status(404).json({
          success: false,
          mensaje: 'Empleado no encontrado'
        });
      }
      
      if (rows[0].usuario_id !== req.usuario.id) {
        return res.status(403).json({
          success: false,
          mensaje: 'Acceso denegado. Solo puedes acceder a tus propios datos.'
        });
      }
    }
    
    // Los clientes no pueden acceder a datos de empleados
    if (req.usuario.rol_id === 1) {
      return res.status(403).json({
        success: false,
        mensaje: 'Acceso denegado. No tienes permisos para acceder a datos de empleados.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error verificando acceso a empleado:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error verificando permisos'
    });
  }
};

/**
 * Middleware para verificar permisos de cita
 */
const verificarPermisosCita = async (req, res, next) => {
  try {
    const citaId = req.params.citaId || req.params.id;
    
    if (!citaId) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de la cita requerido'
      });
    }
    
    // Si es admin, puede acceder a cualquier cita
    if (req.usuario.rol_id === 3) {
      return next();
    }
    
    const [rows] = await query(
      'SELECT cliente_id, empleado_id FROM citas WHERE id = ?',
      [citaId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cita no encontrada'
      });
    }
    
    // Si es empleado, verificar si es el empleado asignado
    if (req.usuario.rol_id === 2) {
      const [empleadoRows] = await query(
        'SELECT id FROM empleados WHERE usuario_id = ?',
        [req.usuario.id]
      );
      
      if (empleadoRows[0] && empleadoRows[0].id === rows[0].empleado_id) {
        return next();
      }
    }
    
    // Si es cliente, verificar si es el cliente de la cita
    if (req.usuario.rol_id === 1) {
      const [clienteRows] = await query(
        'SELECT id FROM clientes WHERE usuario_id = ?',
        [req.usuario.id]
      );
      
      if (clienteRows[0] && clienteRows[0].id === rows[0].cliente_id) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      mensaje: 'Acceso denegado. No tienes permisos para acceder a esta cita.'
    });
    
  } catch (error) {
    console.error('Error verificando permisos de cita:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error verificando permisos'
    });
  }
};

/**
 * Middleware para verificar permisos de pago
 */
const verificarPermisosPago = async (req, res, next) => {
  try {
    const pagoId = req.params.pagoId || req.params.id;
    
    if (!pagoId) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID del pago requerido'
      });
    }
    
    // Si es admin, puede acceder a cualquier pago
    if (req.usuario.rol_id === 3) {
      return next();
    }
    
    const [rows] = await query(
      `SELECT c.cliente_id, c.empleado_id 
       FROM pagos p 
       JOIN citas c ON p.cita_id = c.id 
       WHERE p.id = ?`,
      [pagoId]
    );
    
    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        mensaje: 'Pago no encontrado'
      });
    }
    
    // Si es empleado, verificar si es el empleado de la cita
    if (req.usuario.rol_id === 2) {
      const [empleadoRows] = await query(
        'SELECT id FROM empleados WHERE usuario_id = ?',
        [req.usuario.id]
      );
      
      if (empleadoRows[0] && empleadoRows[0].id === rows[0].empleado_id) {
        return next();
      }
    }
    
    // Si es cliente, verificar si es el cliente de la cita
    if (req.usuario.rol_id === 1) {
      const [clienteRows] = await query(
        'SELECT id FROM clientes WHERE usuario_id = ?',
        [req.usuario.id]
      );
      
      if (clienteRows[0] && clienteRows[0].id === rows[0].cliente_id) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      mensaje: 'Acceso denegado. No tienes permisos para acceder a este pago.'
    });
    
  } catch (error) {
    console.error('Error verificando permisos de pago:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error verificando permisos'
    });
  }
};

/**
 * Middleware para verificar autenticación con Google/Firebase
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, mensaje: 'Token de acceso requerido' });
    }
    const token = authHeader.substring(7);

    // Verificar y decodificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en base de datos y verificar que esté activo
    const rows = await query(
      'SELECT id, email, rol_id, activo FROM usuarios WHERE id = ? AND activo = 1',
      [decoded.id]
    );
    if (!rows[0]) {
      return res.status(401).json({ success: false, mensaje: 'Usuario no autorizado o inactivo' });
    }

    // Adjuntar datos usuario a la request
    req.usuario = {
      id: rows[0].id,
      email: rows[0].email,
      rol_id: rows[0].rol_id,
    };

    next();
  } catch (error) {
    console.error('Error autenticando token:', error);
    return res.status(401).json({ success: false, mensaje: 'Token inválido o expirado' });
  }
};
// Función para autorizar roles específicos
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      console.log('[authorize] Usuario no autenticado');
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario no autenticado'
      });
    }
    // Convertir nombres de roles a IDs
    const roleMap = {
      'administrador': 3,
      'empleado': 2,
      'cliente': 1,
      'dev':4
    };
    const roleIds = roles.map(role => roleMap[role] || role);
    console.log('[authorize] Usuario:', req.usuario, 'Roles permitidos:', roleIds);
    if (!roleIds.includes(req.usuario.rol_id)) {
      console.log('[authorize] Acceso denegado. Rol del usuario:', req.usuario.rol_id);
      return res.status(403).json({
        success: false,
        mensaje: 'No tienes permisos para realizar esta acción'
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
  verificarToken,
  verificarRol,
  esAdmin,
  esEmpleadoOAdmin,
  esCliente,
  verificarPropiedad,
  verificarAccesoCliente,
  verificarAccesoEmpleado,
  verificarPermisosCita,
  verificarPermisosPago
};