const express = require('express');
const { body, query } = require('express-validator');
const clienteController = require('../controllers/clienteController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas para Administradores y Dueños ---
router.route('/')
    .post([
        authorize('administrador', 'dueño'),
        body('email').isEmail().withMessage('Email válido requerido'),
        body('nombre').isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('apellido').isString({ min: 2, max: 100 }).withMessage('Apellido debe tener entre 2 y 100 caracteres'),
        body('telefono').optional().isString(),
        body('fecha_nacimiento').optional().isISO8601().withMessage('Fecha de nacimiento debe ser válida'),
        body('genero').optional().isIn(['M', 'F', 'O']).withMessage('Género debe ser M, F u O'),
        body('direccion').optional().isString(),
        body('alergias').optional().isString(),
        body('condiciones_medicas').optional().isString(),
        body('preferencias').optional().isString()
    ], handleValidation, clienteController.createCliente)
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
        query('search').optional().isString(),
        query('activo').optional().isBoolean().withMessage('Activo debe ser true o false')
    ], handleValidation, clienteController.getAllClientes);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, clienteController.getClienteById)
    .put([
        authorize('administrador', 'dueño'),
        body('email').optional().isEmail().withMessage('Email válido requerido'),
        body('nombre').optional().isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('apellido').optional().isString({ min: 2, max: 100 }).withMessage('Apellido debe tener entre 2 y 100 caracteres'),
        body('telefono').optional().isString(),
        body('fecha_nacimiento').optional().isISO8601().withMessage('Fecha de nacimiento debe ser válida'),
        body('genero').optional().isIn(['M', 'F', 'O']).withMessage('Género debe ser M, F u O'),
        body('direccion').optional().isString(),
        body('alergias').optional().isString(),
        body('condiciones_medicas').optional().isString(),
        body('preferencias').optional().isString(),
        body('activo').optional().isBoolean().withMessage('Activo debe ser true o false')
    ], handleValidation, clienteController.updateCliente)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, clienteController.deleteCliente);

// --- Rutas para obtener información específica del cliente ---
router.get('/:id/historial', [
    authorize('administrador', 'dueño', 'empleado'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50')
], handleValidation, clienteController.getHistorialCliente);

router.get('/:id/citas', [
    authorize('administrador', 'dueño', 'empleado'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50'),
    query('estado').optional().isInt({ min: 1 }).withMessage('Estado debe ser un número positivo')
], handleValidation, clienteController.getCitasCliente);

router.get('/:id/stats', [
    authorize('administrador', 'dueño', 'empleado'),
    body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
], handleValidation, clienteController.getStatsCliente);

// --- Ruta de búsqueda ---
router.get('/search', [
    authorize('administrador', 'dueño', 'empleado'),
    query('q').notEmpty().withMessage('Término de búsqueda requerido'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50')
], handleValidation, clienteController.searchClientes);

module.exports = router; 