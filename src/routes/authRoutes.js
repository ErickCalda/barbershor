const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verificarToken, protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// --- Rutas Públicas ---

// Login con Google (recibe idToken Firebase y genera JWT propio)
router.post('/login/google', [
    body('idToken').notEmpty().withMessage('El idToken de Google es requerido.'),
], handleValidation, authController.loginGoogle);

// --- Rutas Privadas que usan JWT propio (accessToken backend) ---
router.use(verificarToken); // middleware que valida JWT backend

// Cerrar Sesión
router.post('/logout', authController.cerrarSesion);

// Verificar Token (valida JWT backend)
router.get('/verify', authController.verificarAutenticacion);

// Gestionar Perfil
router.route('/profile')
  .get(authController.obtenerPerfil)
  .put([
    body('nombre').optional().isString({ min: 2, max: 100 }).trim(),
    body('apellido').optional().isString({ min: 2, max: 100 }).trim(),
    body('telefono').optional().isString(),
    body('foto_perfil').optional().isURL(),
    body('notificacion_correo').optional().isBoolean(),
    body('notificacion_push').optional().isBoolean(),
    body('notificacion_sms').optional().isBoolean(),
    body('recordatorio_horas_antes').optional().isInt({ min: 1, max: 168 })
  ], handleValidation, authController.actualizarPerfil);

// Rutas que requieren rol administrador o dueño
router.get('/stats', authorize('administrador', 'dueño'), authController.obtenerEstadisticas);

module.exports = router;
