const express = require('express');
const { body, query } = require('express-validator');
const ausenciaEmpleadoController = require('../controllers/ausenciaEmpleadoController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas para Administradores y Dueños ---
router.route('/')
    .post([
        authorize('administrador', 'dueño'),
        body('empleado_id').isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
        body('fecha_inicio').isISO8601().withMessage('Fecha de inicio debe ser válida'),
        body('fecha_fin').isISO8601().withMessage('Fecha de fin debe ser válida'),
        body('tipo').isIn(['vacaciones', 'enfermedad', 'personal', 'otro']).withMessage('Tipo debe ser válido'),
        body('motivo').optional().isString(),
        body('aprobada').optional().isBoolean().withMessage('Aprobada debe ser true o false')
    ], handleValidation, ausenciaEmpleadoController.createAusenciaEmpleado)
    .get([
        authorize('administrador', 'dueño'),
        query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
        query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        query('tipo').optional().isIn(['vacaciones', 'enfermedad', 'personal', 'otro']).withMessage('Tipo debe ser válido'),
        query('aprobada').optional().isBoolean().withMessage('Aprobada debe ser true o false')
    ], handleValidation, ausenciaEmpleadoController.getAllAusenciasEmpleado);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, ausenciaEmpleadoController.getAusenciaEmpleadoById)
    .put([
        authorize('administrador', 'dueño'),
        body('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        body('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        body('tipo').optional().isIn(['vacaciones', 'enfermedad', 'personal', 'otro']).withMessage('Tipo debe ser válido'),
        body('motivo').optional().isString(),
        body('aprobada').optional().isBoolean().withMessage('Aprobada debe ser true o false')
    ], handleValidation, ausenciaEmpleadoController.updateAusenciaEmpleado)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, ausenciaEmpleadoController.deleteAusenciaEmpleado);

// --- Rutas específicas ---
router.get('/empleado/:empleado_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, ausenciaEmpleadoController.getAusenciasPorEmpleado);

router.get('/fecha/:fecha', [
    authorize('administrador', 'dueño')
], ausenciaEmpleadoController.getAusenciasPorFecha);

router.get('/rango', [
    authorize('administrador', 'dueño'),
    query('fecha_inicio').isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, ausenciaEmpleadoController.getAusenciasPorRango);

module.exports = router; 