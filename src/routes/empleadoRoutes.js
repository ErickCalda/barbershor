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
        body('titulo').optional().isString({ min: 2, max: 100 }).withMessage('Título debe tener entre 2 y 100 caracteres'),
        body('biografia').optional().isString({ max: 1000 }).withMessage('Biografía debe tener máximo 1000 caracteres'),
        body('fecha_contratacion').optional().isISO8601().withMessage('Fecha de contratación debe ser válida'),
        body('numero_seguro_social').optional().isString({ min: 9, max: 11 }).withMessage('Número de seguro social debe tener entre 9 y 11 caracteres'),
        body('salario_base').optional().isFloat({ min: 0 }).withMessage('Salario base debe ser un número positivo'),
        body('comision_porcentaje').optional().isFloat({ min: 0, max: 100 }).withMessage('Comisión debe ser un porcentaje entre 0 y 100'),
        body('activo').optional().isInt({ min: 0, max: 1 }).withMessage('Activo debe ser 0 o 1')
    ], handleValidation, empleadoController.createEmpleado)
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        query('activo').optional().isInt({ min: 0, max: 1 }).withMessage('Activo debe ser 0 o 1'),
        query('search').optional().isString(),
        query('ordenar_por').optional().isIn(['nombre', 'apellido', 'fecha_contratacion', 'salario_base']).withMessage('Ordenar por debe ser válido'),
        query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
    ], handleValidation, empleadoController.getAllEmpleados);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño', 'empleado')
    ], empleadoController.getEmpleadoById)
    .put([
        authorize('administrador', 'dueño'),
        body('titulo').optional().isString({ min: 2, max: 100 }).withMessage('Título debe tener entre 2 y 100 caracteres'),
        body('biografia').optional().isString({ max: 1000 }).withMessage('Biografía debe tener máximo 1000 caracteres'),
        body('fecha_contratacion').optional().isISO8601().withMessage('Fecha de contratación debe ser válida'),
        body('numero_seguro_social').optional().isString({ min: 9, max: 11 }).withMessage('Número de seguro social debe tener entre 9 y 11 caracteres'),
        body('salario_base').optional().isFloat({ min: 0 }).withMessage('Salario base debe ser un número positivo'),
        body('comision_porcentaje').optional().isFloat({ min: 0, max: 100 }).withMessage('Comisión debe ser un porcentaje entre 0 y 100'),
        body('activo').optional().isInt({ min: 0, max: 1 }).withMessage('Activo debe ser 0 o 1')
    ], handleValidation, empleadoController.updateEmpleado)
    .delete([
        authorize('administrador', 'dueño')
    ], empleadoController.deleteEmpleado);

// --- Rutas específicas ---
router.get('/especialidad/:especialidad_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('activo').optional().isInt({ min: 0, max: 1 }).withMessage('Activo debe ser 0 o 1')
], handleValidation, empleadoController.getEmpleadosPorEspecialidad);

router.get('/servicio/:servicio_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('activo').optional().isInt({ min: 0, max: 1 }).withMessage('Activo debe ser 0 o 1')
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
