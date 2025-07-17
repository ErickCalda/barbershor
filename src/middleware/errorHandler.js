/**
 * Middleware para manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Utilidad para construir la respuesta de error
  const buildErrorResponse = ({
    status = 500,
    mensaje = 'Error interno del servidor',
    code = 'INTERNAL_ERROR',
    action = undefined,
    errors = undefined
  }) => {
    const response = {
      success: false,
      mensaje,
      code
    };
    if (action) response.action = action;
    if (errors) response.errors = errors;
    // En desarrollo, incluir detalles del error
    if (process.env.NODE_ENV !== 'production' && err.stack) {
      response.stack = err.stack;
    }
    return res.status(status).json(response);
  };

  // Errores de validación de Joi
  if (err.isJoi) {
    return buildErrorResponse({
      status: 400,
      mensaje: 'Datos de entrada inválidos',
      code: 'VALIDATION_ERROR',
      errors: err.details.map(detail => detail.message)
    });
  }

  // Errores de MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return buildErrorResponse({
      status: 409,
      mensaje: 'El registro ya existe en la base de datos',
      code: 'DUPLICATE_ENTRY'
    });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return buildErrorResponse({
      status: 400,
      mensaje: 'Referencia inválida en la base de datos',
      code: 'INVALID_REFERENCE'
    });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return buildErrorResponse({
      status: 400,
      mensaje: 'No se puede eliminar el registro porque está siendo utilizado',
      code: 'ROW_REFERENCED'
    });
  }

  // Errores de autenticación
  if (err.name === 'JsonWebTokenError') {
    return buildErrorResponse({
      status: 401,
      mensaje: 'Token de autenticación inválido',
      code: 'TOKEN_INVALID',
      action: 'LOGIN_AGAIN'
    });
  }
  if (err.name === 'TokenExpiredError') {
    return buildErrorResponse({
      status: 401,
      mensaje: 'Token de autenticación expirado',
      code: 'TOKEN_EXPIRED',
      action: 'REFRESH_TOKEN'
    });
  }

  // Errores de permisos
  if (err.name === 'PermissionError') {
    return buildErrorResponse({
      status: 403,
      mensaje: err.message || 'No tienes permisos para realizar esta acción',
      code: 'PERMISSION_DENIED'
    });
  }

  // Errores de validación de negocio
  if (err.name === 'ValidationError') {
    return buildErrorResponse({
      status: 400,
      mensaje: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  // Errores de recursos no encontrados
  if (err.name === 'NotFoundError') {
    return buildErrorResponse({
      status: 404,
      mensaje: err.message || 'Recurso no encontrado',
      code: 'NOT_FOUND'
    });
  }

  // Errores de conflicto (por ejemplo, horario no disponible)
  if (err.name === 'ConflictError') {
    return buildErrorResponse({
      status: 409,
      mensaje: err.message,
      code: 'CONFLICT'
    });
  }

  // Error por defecto
  return buildErrorResponse({
    status: 500,
    mensaje: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message,
    code: 'INTERNAL_ERROR'
  });
};

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`
  });
};

/**
 * Clases de error personalizadas
 */
class PermissionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PermissionError';
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Middleware para logging de requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

/**
 * Middleware para validar que el usuario esté activo
 */
const validateActiveUser = (req, res, next) => {
  if (req.user && !req.user.activo) {
    return res.status(403).json({
      success: false,
      message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
    });
  }
  next();
};

/**
 * Middleware para rate limiting básico
 */
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpiar requests antiguos
    if (requests.has(ip)) {
      requests.set(ip, requests.get(ip).filter(time => time > windowStart));
    } else {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
      });
    }

    userRequests.push(now);
    next();
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateActiveUser,
  rateLimiter,
  PermissionError,
  ValidationError,
  NotFoundError,
  ConflictError
}; 