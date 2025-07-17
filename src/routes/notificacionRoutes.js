const express = require('express');
const { body, query } = require('express-validator');
const notificacionController = require('../controllers/notificacionController');
const { protect, authorize, verificarToken } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// --- Rutas para Administradores, Dueños y Empleados ---
router.route('/')
    .post([
        authorize('administrador', 'dueño', 'empleado'),
        body('usuario_id').isInt({ min: 1 }).withMessage('ID de usuario debe ser un número positivo'),
        body('titulo').isString().notEmpty().withMessage('Título es requerido'),
        body('mensaje').isString().notEmpty().withMessage('Mensaje es requerido'),
        body('tipo').isIn(['sistema', 'cita', 'promocion', 'recordatorio', 'otro']).withMessage('Tipo debe ser válido'),
        body('leida').optional().isBoolean().withMessage('Leída debe ser true o false'),
        body('fecha_envio').optional().isISO8601().withMessage('Fecha de envío debe ser válida'),
        body('datos_adicionales').optional().isString()
    ], handleValidation, notificacionController.createNotificacion)
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        query('usuario_id').optional().isInt({ min: 1 }).withMessage('ID de usuario debe ser un número positivo'),
        query('tipo').optional().isIn(['sistema', 'cita', 'promocion', 'recordatorio', 'otro']).withMessage('Tipo debe ser válido'),
        query('leida').optional().isBoolean().withMessage('Leída debe ser true o false'),
        query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        query('ordenar_por').optional().isIn(['fecha_envio', 'leida', 'tipo', 'usuario_id']).withMessage('Ordenar por debe ser válido'),
        query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
    ], handleValidation, notificacionController.getAllNotificaciones);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, notificacionController.getNotificacionById)
    .put([
        authorize('administrador', 'dueño', 'empleado'),
        body('titulo').optional().isString().notEmpty().withMessage('Título no puede estar vacío'),
        body('mensaje').optional().isString().notEmpty().withMessage('Mensaje no puede estar vacío'),
        body('tipo').optional().isIn(['sistema', 'cita', 'promocion', 'recordatorio', 'otro']).withMessage('Tipo debe ser válido'),
        body('leida').optional().isBoolean().withMessage('Leída debe ser true o false'),
        body('fecha_envio').optional().isISO8601().withMessage('Fecha de envío debe ser válida'),
        body('datos_adicionales').optional().isString()
    ], handleValidation, notificacionController.updateNotificacion)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, notificacionController.deleteNotificacion);

// --- Rutas específicas ---
router.get('/usuario/:usuario_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('leida').optional().isBoolean().withMessage('Leída debe ser true o false'),
    query('tipo').optional().isIn(['sistema', 'cita', 'promocion', 'recordatorio', 'otro']).withMessage('Tipo debe ser válido'),
    query('ordenar_por').optional().isIn(['fecha_envio', 'leida', 'tipo']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, notificacionController.getNotificacionesPorUsuario);

router.get('/tipo/:tipo', [
    authorize('administrador', 'dueño', 'empleado'),
    query('usuario_id').optional().isInt({ min: 1 }).withMessage('ID de usuario debe ser un número positivo'),
    query('leida').optional().isBoolean().withMessage('Leída debe ser true o false'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, notificacionController.getNotificacionesPorTipo);

router.get('/no-leidas', [
    authorize('administrador', 'dueño', 'empleado'),
    query('usuario_id').isInt({ min: 1 }).withMessage('ID de usuario debe ser un número positivo'),
    query('tipo').optional().isIn(['sistema', 'cita', 'promocion', 'recordatorio', 'otro']).withMessage('Tipo debe ser válido')
], handleValidation, notificacionController.getNotificacionesNoLeidas);

router.patch('/:id/leer', [
    authorize('administrador', 'dueño', 'empleado')
], notificacionController.marcarComoLeida);

router.patch('/leer-todas', [
    authorize('administrador', 'dueño', 'empleado'),
    body('usuario_id').isInt({ min: 1 }).withMessage('ID de usuario debe ser un número positivo')
], handleValidation, notificacionController.marcarTodasComoLeidas);

router.get('/fecha/:fecha', [
    authorize('administrador', 'dueño', 'empleado'),
    query('usuario_id').optional().isInt({ min: 1 }).withMessage('ID de usuario debe ser un número positivo'),
    query('tipo').optional().isIn(['sistema', 'cita', 'promocion', 'recordatorio', 'otro']).withMessage('Tipo debe ser válido')
], handleValidation, notificacionController.getNotificacionesPorFecha);

// @desc    Enviar recordatorio manual para una cita
// @route   POST /api/notificaciones/recordatorio/:citaId
// @access  Private
router.post('/recordatorio/:citaId', notificacionController.enviarRecordatorioManual);

// @desc    Reenviar confirmación de cita
// @route   POST /api/notificaciones/confirmacion/:citaId
// @access  Private
router.post('/confirmacion/:citaId', notificacionController.reenviarConfirmacion);

// @desc    Programar recordatorios automáticos
// @route   POST /api/notificaciones/programar-recordatorios
// @access  Private
router.post('/programar-recordatorios', notificacionController.programarRecordatorios);

// @desc    Obtener historial de notificaciones
// @route   GET /api/notificaciones/historial
// @access  Private
router.get('/historial', notificacionController.getHistorialNotificaciones);

// @desc    Obtener configuración de notificaciones del usuario
// @route   GET /api/notificaciones/configuracion
// @access  Private
router.get('/configuracion', notificacionController.getConfiguracionNotificaciones);

// @desc    Actualizar configuración de notificaciones del usuario
// @route   PUT /api/notificaciones/configuracion
// @access  Private
router.put('/configuracion', notificacionController.actualizarConfiguracionNotificaciones);

// @desc    Registrar token FCM de dispositivo
// @route   POST /api/notificaciones/registrar-token
// @access  Private
router.post('/registrar-token', [
    body('token_dispositivo').isString().notEmpty().withMessage('Token de dispositivo es requerido'),
    body('plataforma').optional().isString().withMessage('Plataforma debe ser una cadena de texto')
], handleValidation, notificacionController.registrarTokenFCM);

module.exports = router; 