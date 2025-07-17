const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const empleadoCitaController = require('../controllers/empleadoCitaController');
const { protect } = require('../middleware/auth');

// @desc    Obtener citas del empleado autenticado
// @route   GET /api/empleado-citas/citas
// @access  Private (Empleado)
router.get('/citas', [
  protect
], empleadoCitaController.getMisCitas);

// @desc    Obtener citas de hoy del empleado
// @route   GET /api/empleado-citas/citas/hoy
// @access  Private (Empleado)
router.get('/citas/hoy', [
  protect
], empleadoCitaController.getCitasHoy);

// @desc    Obtener citas próximas del empleado
// @route   GET /api/empleado-citas/citas/proximas
// @access  Private (Empleado)
router.get('/citas/proximas', [
  protect,
  query('dias').optional().isInt({ min: 1, max: 30 }).withMessage('dias debe ser un número entre 1 y 30')
], empleadoCitaController.getCitasProximas);

// @desc    Solicitar ausencia
// @route   POST /api/empleado-citas/ausencias
// @access  Private (Empleado)
router.post('/ausencias', [
  protect,
  body('fecha').isISO8601().withMessage('fecha debe ser una fecha válida'),
  body('motivo').isString().isLength({ min: 10, max: 500 }).withMessage('motivo debe tener entre 10 y 500 caracteres'),
  body('tipo').optional().isIn(['personal', 'medica', 'vacaciones', 'otro']).withMessage('tipo debe ser personal, medica, vacaciones u otro')
], empleadoCitaController.solicitarAusencia);

// @desc    Obtener ausencias del empleado
// @route   GET /api/empleado-citas/ausencias
// @access  Private (Empleado)
router.get('/ausencias', [
  protect
], empleadoCitaController.getMisAusencias);

// @desc    Cancelar solicitud de ausencia
// @route   DELETE /api/empleado-citas/ausencias/:id
// @access  Private (Empleado)
router.delete('/ausencias/:id', [
  protect
], empleadoCitaController.cancelarAusencia);

// @desc    Obtener estadísticas del empleado
// @route   GET /api/empleado-citas/estadisticas
// @access  Private (Empleado)
router.get('/estadisticas', [
  protect
], empleadoCitaController.getEstadisticas);

// @desc    Obtener información del empleado
// @route   GET /api/empleado-citas/info
// @access  Private (Empleado)
router.get('/info', [
  protect
], empleadoCitaController.getInfoEmpleado);

module.exports = router; 