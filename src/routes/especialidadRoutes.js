const express = require('express');
const { body, query } = require('express-validator');
const especialidadController = require('../controllers/especialidadController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// --- Rutas públicas ---
router.get('/', [
    query('solo_activas').optional().isBoolean().withMessage('Solo activas debe ser true o false')
], handleValidation, especialidadController.getAllEspecialidades);

router.get('/:id', [
    body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
], handleValidation, especialidadController.getEspecialidadById);

router.get('/:id/empleados', [
    body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100')
], handleValidation, especialidadController.getEmpleadosPorEspecialidad);

router.get('/search', [
    query('q').notEmpty().withMessage('Término de búsqueda requerido'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50')
], handleValidation, especialidadController.searchEspecialidades);

// --- Rutas privadas (requieren autenticación) ---
router.use(protect);

// --- Rutas para Administradores y Dueños ---
router.route('/')
    .post([
        authorize('administrador', 'dueño'),
        body('nombre').isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('descripcion').optional().isString(),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
    ], handleValidation, especialidadController.createEspecialidad);

router.route('/:id')
    .put([
        authorize('administrador', 'dueño'),
        body('nombre').optional().isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('descripcion').optional().isString(),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
    ], handleValidation, especialidadController.updateEspecialidad)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, especialidadController.deleteEspecialidad);

// --- Rutas para gestión de empleados ---
router.post('/:id/empleados', [
    authorize('administrador', 'dueño'),
    body('empleado_id').isInt({ min: 1 }).withMessage('ID de empleado requerido')
], handleValidation, especialidadController.asignarEmpleado);

router.delete('/:id/empleados/:empleado_id', [
    authorize('administrador', 'dueño'),
    body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo'),
    body('empleado_id').isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo')
], handleValidation, especialidadController.removerEmpleado);

// --- Ruta de estadísticas (solo admin y dueño) ---
router.get('/stats', [
    authorize('administrador', 'dueño')
], handleValidation, especialidadController.getStatsEspecialidades);

module.exports = router; 