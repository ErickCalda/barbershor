const express = require('express');
const { body, query } = require('express-validator');
const horarioEmpleadoController = require('../controllers/horarioEmpleadoController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas para Administradores, Dueños y Empleados ---
router.route('/')
    .post([
        authorize('administrador', 'dueño'),
        body('empleado_id').isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
        body('dia_semana').isInt({ min: 1, max: 7 }).withMessage('Día de la semana debe estar entre 1 y 7'),
        body('hora_inicio').isString().withMessage('Hora de inicio es requerida'),
        body('hora_fin').isString().withMessage('Hora de fin es requerida'),
        body('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        body('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        body('activo').optional().isBoolean().withMessage('Activo debe ser true o false'),
        body('notas').optional().isString()
    ], handleValidation, horarioEmpleadoController.createHorarioEmpleado)
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
        query('dia_semana').optional().isInt({ min: 1, max: 7 }).withMessage('Día de la semana debe estar entre 1 y 7'),
        query('activo').optional().isBoolean().withMessage('Activo debe ser true o false'),
        query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        query('ordenar_por').optional().isIn(['dia_semana', 'hora_inicio', 'empleado_id', 'fecha_inicio']).withMessage('Ordenar por debe ser válido'),
        query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
    ], handleValidation, horarioEmpleadoController.getAllHorariosEmpleado);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, horarioEmpleadoController.getHorarioEmpleadoById)
    .put([
        authorize('administrador', 'dueño'),
        body('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
        body('dia_semana').optional().isInt({ min: 1, max: 7 }).withMessage('Día de la semana debe estar entre 1 y 7'),
        body('hora_inicio').optional().isString().withMessage('Hora de inicio debe ser válida'),
        body('hora_fin').optional().isString().withMessage('Hora de fin debe ser válida'),
        body('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        body('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        body('activo').optional().isBoolean().withMessage('Activo debe ser true o false'),
        body('notas').optional().isString()
    ], handleValidation, horarioEmpleadoController.updateHorarioEmpleado)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, horarioEmpleadoController.deleteHorarioEmpleado);

// --- Rutas específicas ---
router.get('/empleado/:empleado_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('activo').optional().isBoolean().withMessage('Activo debe ser true o false'),
    query('dia_semana').optional().isInt({ min: 1, max: 7 }).withMessage('Día de la semana debe estar entre 1 y 7'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, horarioEmpleadoController.getHorariosPorEmpleado);

router.get('/dia/:dia', [
    authorize('administrador', 'dueño', 'empleado'),
    query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
    query('activo').optional().isBoolean().withMessage('Activo debe ser true o false')
], handleValidation, horarioEmpleadoController.getHorariosPorDia);

router.get('/activos', [
    authorize('administrador', 'dueño', 'empleado'),
    query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
    query('dia_semana').optional().isInt({ min: 1, max: 7 }).withMessage('Día de la semana debe estar entre 1 y 7')
], handleValidation, horarioEmpleadoController.getHorariosActivos);

router.get('/fecha/:fecha', [
    authorize('administrador', 'dueño', 'empleado'),
    query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo')
], handleValidation, horarioEmpleadoController.getHorariosPorFecha);

router.get('/rango', [
    authorize('administrador', 'dueño', 'empleado'),
    query('fecha_inicio').isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').isISO8601().withMessage('Fecha de fin debe ser válida'),
    query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo')
], handleValidation, horarioEmpleadoController.getHorariosPorRango);

router.patch('/:id/estado', [
    authorize('administrador', 'dueño'),
    body('activo').isBoolean().withMessage('Activo debe ser true o false')
], handleValidation, horarioEmpleadoController.cambiarEstadoHorario);

module.exports = router; 