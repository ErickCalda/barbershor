const express = require('express');
const { body, query } = require('express-validator');
const empleadoController = require('../controllers/empleadoController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas para Administradores, Dueños y Empleados ---
router.route('/')
    .post([
        authorize('administrador', 'dueño'),
        body('usuario_id').isInt({ min: 1 }).withMessage('ID de usuario debe ser un número positivo'),
        body('nombre').isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('apellido').isString({ min: 2, max: 100 }).withMessage('Apellido debe tener entre 2 y 100 caracteres'),
        body('telefono').optional().isString(),
        body('email').optional().isEmail().withMessage('Email debe ser válido'),
        body('fecha_contratacion').optional().isISO8601().withMessage('Fecha de contratación debe ser válida'),
        body('salario').optional().isFloat({ min: 0 }).withMessage('Salario debe ser un número positivo'),
        body('activo').optional().isBoolean().withMessage('Activo debe ser true o false'),
        body('foto_url').optional().isString()
    ], handleValidation, empleadoController.createEmpleado)
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        query('activo').optional().isBoolean().withMessage('Activo debe ser true o false'),
        query('search').optional().isString(),
        query('ordenar_por').optional().isIn(['nombre', 'apellido', 'fecha_contratacion', 'salario']).withMessage('Ordenar por debe ser válido'),
        query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
    ], handleValidation, empleadoController.getAllEmpleados);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, empleadoController.getEmpleadoById)
    .put([
        authorize('administrador', 'dueño'),
        body('nombre').optional().isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('apellido').optional().isString({ min: 2, max: 100 }).withMessage('Apellido debe tener entre 2 y 100 caracteres'),
        body('telefono').optional().isString(),
        body('email').optional().isEmail().withMessage('Email debe ser válido'),
        body('fecha_contratacion').optional().isISO8601().withMessage('Fecha de contratación debe ser válida'),
        body('salario').optional().isFloat({ min: 0 }).withMessage('Salario debe ser un número positivo'),
        body('activo').optional().isBoolean().withMessage('Activo debe ser true o false'),
        body('foto_url').optional().isString()
    ], handleValidation, empleadoController.updateEmpleado)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, empleadoController.deleteEmpleado);

// --- Rutas específicas ---
router.get('/especialidad/:especialidad_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('activo').optional().isBoolean().withMessage('Activo debe ser true o false')
], handleValidation, empleadoController.getEmpleadosPorEspecialidad);

router.get('/servicio/:servicio_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('activo').optional().isBoolean().withMessage('Activo debe ser true o false')
], handleValidation, empleadoController.getEmpleadosPorServicio);

router.get('/:id/horarios', [
    authorize('administrador', 'dueño', 'empleado'),
    query('fecha').optional().isISO8601().withMessage('Fecha debe ser válida')
], handleValidation, empleadoController.getHorariosEmpleado);

router.get('/:id/ausencias', [
    authorize('administrador', 'dueño', 'empleado'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, empleadoController.getAusenciasEmpleado);

router.get('/:id/especialidades', [
    authorize('administrador', 'dueño', 'empleado')
], empleadoController.getEspecialidadesEmpleado);

router.get('/:id/servicios', [
    authorize('administrador', 'dueño', 'empleado')
], empleadoController.getServiciosEmpleado);

module.exports = router; 