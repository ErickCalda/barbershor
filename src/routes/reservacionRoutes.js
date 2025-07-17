const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const reservacionController = require('../controllers/reservacionController');
console.log('DEBUG reservacionController:', reservacionController);
const { protect } = require('../middleware/auth');

// --- Rutas públicas ---

// @desc    Obtener servicios disponibles
// @route   GET /api/reservacion/servicios
// @access  Public
router.get('/servicios', reservacionController.getServiciosDisponibles);

// @desc    Obtener empleados disponibles para servicios seleccionados
// @route   GET /api/reservacion/empleados
// @access  Public
router.get('/empleados', reservacionController.getEmpleadosDisponibles);

// @desc    Obtener horarios disponibles para un empleado
// @route   GET /api/reservacion/horarios
// @access  Public
router.get('/horarios', reservacionController.getHorariosDisponibles);

// --- Rutas privadas (requieren autenticación) ---

// @desc    Procesar reservación (pago + creación de cita)
// @route   POST /api/reservacion/procesar
// @access  Private (Cliente)
router.post('/procesar', [
  protect,
  body('empleadoId').isInt({ min: 1 }).withMessage('empleadoId debe ser un número positivo'),
  body('servicios').isArray().withMessage('servicios debe ser un array'),
  body('fecha').isISO8601().withMessage('fecha debe ser una fecha válida'),
  body('horario').isString().withMessage('horario debe ser una cadena de texto'),
  body('total').isFloat({ min: 0 }).withMessage('total debe ser un número positivo')
], reservacionController.procesarReservacion);

// @desc    Obtener citas del cliente autenticado
// @route   GET /api/reservacion/mis-citas
// @access  Private (Cliente)

router.get('/mis-citas', protect, reservacionController.getMisCitas);

// @desc    Cancelar cita del cliente
// @route   PUT /api/reservacion/cancelar/:id
// @access  Private (Cliente)
router.put('/cancelar/:id', [
  protect
], reservacionController.cancelarCita);

module.exports = router; 