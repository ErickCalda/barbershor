const { body, param, query } = require('express-validator');

/**
 * Validaciones para registro de usuario
 */
const validarRegistro = [
  body('email')
    .notEmpty()
    .withMessage('Email es requerido')
    .isEmail()
    .withMessage('Email debe tener un formato válido')
    .normalizeEmail(),
  body('nombre')
    .notEmpty()
    .withMessage('Nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),
  body('apellido')
    .notEmpty()
    .withMessage('Apellido es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('Apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),
  body('telefono')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Teléfono debe tener un formato válido'),
  body('fecha_nacimiento')
    .optional()
    .isISO8601()
    .withMessage('Fecha de nacimiento debe tener formato válido')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fecha.getFullYear();
      if (edad < 13 || edad > 120) {
        throw new Error('La edad debe estar entre 13 y 120 años');
      }
      return true;
    }),
  body('genero')
    .optional()
    .isIn(['Masculino', 'Femenino', 'No binario', 'Prefiero no decir'])
    .withMessage('Género debe ser uno de los valores permitidos')
];

/**
 * Validaciones para login con Google
 */
const validarLoginGoogle = [
  body('idToken')
    .notEmpty()
    .withMessage('Token de Google es requerido')
    .isString()
    .withMessage('Token debe ser una cadena de texto')
    .isLength({ min: 100 })
    .withMessage('Token de Google inválido')
];

/**
 * Validaciones para refresh token
 */
const validarRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token es requerido')
    .isString()
    .withMessage('Refresh token debe ser una cadena de texto')
    .isLength({ min: 100 })
    .withMessage('Refresh token inválido')
];

/**
 * Validaciones para actualizar perfil
 */
const validarActualizarPerfil = [
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),
  body('apellido')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),
  body('telefono')
    .optional()
    .matches(/^[\+]?[0-9\s\-\(\)]{10,15}$/)
    .withMessage('Teléfono debe tener un formato válido'),
  body('foto_perfil')
    .optional()
    .isURL()
    .withMessage('URL de foto de perfil inválida')
    .custom((value) => {
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
      if (!urlPattern.test(value)) {
        throw new Error('URL de imagen debe ser una imagen válida (jpg, jpeg, png, gif, webp)');
      }
      return true;
    }),
  body('fecha_nacimiento')
    .optional()
    .isISO8601()
    .withMessage('Fecha de nacimiento debe tener formato válido')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fecha.getFullYear();
      if (edad < 13 || edad > 120) {
        throw new Error('La edad debe estar entre 13 y 120 años');
      }
      return true;
    }),
  body('genero')
    .optional()
    .isIn(['Masculino', 'Femenino', 'No binario', 'Prefiero no decir'])
    .withMessage('Género debe ser uno de los valores permitidos'),
  body('notas_preferencias')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notas de preferencias no pueden exceder 1000 caracteres')
    .trim()
    .escape()
];

/**
 * Validaciones para cambiar contraseña
 */
const validarCambiarContraseña = [
  body('contraseñaActual')
    .notEmpty()
    .withMessage('Contraseña actual es requerida')
    .isLength({ min: 6 })
    .withMessage('Contraseña actual debe tener al menos 6 caracteres'),
  body('nuevaContraseña')
    .notEmpty()
    .withMessage('Nueva contraseña es requerida')
    .isLength({ min: 8, max: 128 })
    .withMessage('Nueva contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial')
    .custom((value, { req }) => {
      if (value === req.body.contraseñaActual) {
        throw new Error('La nueva contraseña no puede ser igual a la actual');
      }
      return true;
    })
];

/**
 * Validaciones para solicitar recuperación de contraseña
 */
const validarSolicitarRecuperacion = [
  body('email')
    .notEmpty()
    .withMessage('Email es requerido')
    .isEmail()
    .withMessage('Email debe tener un formato válido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email no puede exceder 255 caracteres')
];

/**
 * Validaciones para restablecer contraseña
 */
const validarRestablecerContraseña = [
  body('token')
    .notEmpty()
    .withMessage('Token de recuperación es requerido')
    .isString()
    .withMessage('Token debe ser una cadena de texto')
    .isLength({ min: 100 })
    .withMessage('Token de recuperación inválido'),
  body('nuevaContraseña')
    .notEmpty()
    .withMessage('Nueva contraseña es requerida')
    .isLength({ min: 8, max: 128 })
    .withMessage('Nueva contraseña debe tener entre 8 y 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial')
];

/**
 * Validaciones para verificar token de recuperación
 */
const validarVerificarToken = [
  param('token')
    .notEmpty()
    .withMessage('Token es requerido')
    .isString()
    .withMessage('Token debe ser una cadena de texto')
    .isLength({ min: 100 })
    .withMessage('Token inválido')
];

/**
 * Validaciones para cerrar sesión específica
 */
const validarCerrarSesion = [
  param('sessionId')
    .notEmpty()
    .withMessage('ID de sesión es requerido')
    .isInt({ min: 1 })
    .withMessage('ID de sesión debe ser un número entero positivo')
];

/**
 * Validaciones para estadísticas (solo admin)
 */
const validarEstadisticas = [
  query('fecha_inicio')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio debe tener formato válido'),
  query('fecha_fin')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin debe tener formato válido')
    .custom((value, { req }) => {
      if (req.query.fecha_inicio && new Date(value) <= new Date(req.query.fecha_inicio)) {
        throw new Error('Fecha de fin debe ser posterior a la fecha de inicio');
      }
      return true;
    }),
  query('tipo')
    .optional()
    .isIn(['diario', 'semanal', 'mensual', 'anual'])
    .withMessage('Tipo debe ser uno de: diario, semanal, mensual, anual')
];

/**
 * Validaciones para notificaciones de usuario
 */
const validarNotificacionesUsuario = [
  query('leida')
    .optional()
    .isBoolean()
    .withMessage('Leída debe ser true o false'),
  query('tipo')
    .optional()
    .isString()
    .withMessage('Tipo debe ser una cadena de texto'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser un número mayor o igual a 0')
];

/**
 * Validaciones para configuraciones de notificación
 */
const validarConfiguracionNotificaciones = [
  body('notificacion_correo')
    .optional()
    .isBoolean()
    .withMessage('Notificación por correo debe ser true o false'),
  body('notificacion_push')
    .optional()
    .isBoolean()
    .withMessage('Notificación push debe ser true o false'),
  body('notificacion_sms')
    .optional()
    .isBoolean()
    .withMessage('Notificación SMS debe ser true o false'),
  body('recordatorio_horas_antes')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Recordatorio debe ser entre 1 y 168 horas (1 semana)')
];

/**
 * Validaciones para dispositivos push
 */
const validarDispositivoPush = [
  body('token_dispositivo')
    .notEmpty()
    .withMessage('Token del dispositivo es requerido')
    .isString()
    .withMessage('Token debe ser una cadena de texto')
    .isLength({ min: 100, max: 500 })
    .withMessage('Token del dispositivo debe tener entre 100 y 500 caracteres'),
  body('plataforma')
    .notEmpty()
    .withMessage('Plataforma es requerida')
    .isIn(['android', 'ios', 'web'])
    .withMessage('Plataforma debe ser: android, ios o web')
];

/**
 * Validaciones para logout
 */
const validarLogout = [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token debe ser una cadena de texto')
    .isLength({ min: 100 })
    .withMessage('Refresh token inválido'),
  body('cerrarTodas')
    .optional()
    .isBoolean()
    .withMessage('Cerrar todas debe ser true o false')
];

module.exports = {
  validarRegistro,
  validarLoginGoogle,
  validarRefreshToken,
  validarActualizarPerfil,
  validarCambiarContraseña,
  validarSolicitarRecuperacion,
  validarRestablecerContraseña,
  validarVerificarToken,
  validarCerrarSesion,
  validarEstadisticas,
  validarNotificacionesUsuario,
  validarConfiguracionNotificaciones,
  validarDispositivoPush,
  validarLogout
}; 