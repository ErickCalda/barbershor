const express = require('express');
const { body, query } = require('express-validator');
const citaController = require('../controllers/citaController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas públicas o específicas que deben ir antes ---
router.get('/horarios-disponibles', [
  query('fecha').isISO8601().withMessage('Fecha debe ser válida'),
  query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
  query('servicio_id').optional().isInt({ min: 1 }).withMessage('ID de servicio debe ser un número positivo')
], handleValidation, citaController.getHorariosDisponibles);

router.get('/estadisticas', [
  authorize('administrador', 'dueño', 'empleado')
], citaController.getStatsCitas);

// 🔥 ESTA ES LA RUTA QUE DEBÍA ESTAR ANTES DE `/:id`
router.get('/estados', [
  authorize('administrador', 'dueño', 'empleado')
], citaController.obtenerEstadosCitas);

// --- Rutas específicas ---
router.get('/cliente/:cliente_id', [
  authorize('administrador', 'dueño', 'empleado'),
  query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
  query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
  query('estado').optional().isIn(['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada']).withMessage('Estado debe ser válido')
], handleValidation, citaController.getCitasPorCliente);

router.get('/empleado/:empleado_id', [
  authorize('administrador', 'dueño', 'empleado'),
  query('fecha').optional().isISO8601().withMessage('Fecha debe ser válida'),
  query('estado').optional().isIn(['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada']).withMessage('Estado debe ser válido')
], handleValidation, citaController.getCitasPorEmpleado);

router.get('/fecha/:fecha', [
  authorize('administrador', 'dueño', 'empleado'),
  query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo')
], handleValidation, citaController.getCitasPorFecha);

router.get('/estado/:estado', [
  authorize('administrador', 'dueño', 'empleado'),
  query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
  query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, citaController.getCitasPorEstado);

// --- CRUD principal ---
router.route('/')
  .post([
    authorize('administrador', 'dueño', 'empleado'),
    body('cliente_id').isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
    body('empleado_id').isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
    body('servicio_id').isInt({ min: 1 }).withMessage('ID de servicio debe ser un número positivo'),
    body('fecha').isISO8601().withMessage('Fecha debe ser válida'),
    body('hora_inicio').isString().withMessage('Hora de inicio es requerida'),
    body('hora_fin').isString().withMessage('Hora de fin es requerida'),
    body('notas').optional().isString(),
    body('estado').optional().isIn(['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada']).withMessage('Estado debe ser válido')
  ], handleValidation, citaController.createCita)
  .get([
    authorize('administrador', 'dueño', 'empleado'),
    query('cliente_id').optional().isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
    query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
    query('fecha').optional().isISO8601().withMessage('Fecha debe ser válida'),
    query('estado').optional().isIn(['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada']).withMessage('Estado debe ser válido'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
  ], handleValidation, citaController.getAllCitas);

// --- Rutas con ID (al final siempre) ---
router.route('/:id')
  .get([
    authorize('administrador', 'dueño', 'empleado'),
    body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
  ], handleValidation, citaController.getCitaById)
  .put([
    authorize('administrador', 'dueño', 'empleado'),
    body('cliente_id').optional().isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
    body('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
    body('servicio_id').optional().isInt({ min: 1 }).withMessage('ID de servicio debe ser un número positivo'),
    body('fecha').optional().isISO8601().withMessage('Fecha debe ser válida'),
    body('hora_inicio').optional().isString().withMessage('Hora de inicio debe ser válida'),
    body('hora_fin').optional().isString().withMessage('Hora de fin debe ser válida'),
    body('notas').optional().isString(),
    body('estado').optional().isIn(['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada']).withMessage('Estado debe ser válido')
  ], handleValidation, citaController.updateCita)
  .delete([
    authorize('administrador', 'dueño'),
    body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
  ], handleValidation, citaController.deleteCita);

  router.patch('/:id/estado', [
    authorize('administrador', 'dueño', 'empleado'),
    body('estado_id').isInt({ min: 1 }).withMessage('Estado ID debe ser un número válido')
  ], handleValidation, citaController.cambiarEstadoCita);
  
module.exports = router;
