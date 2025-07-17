const express = require('express');
const { body, query } = require('express-validator');
const multimediaController = require('../controllers/multimediaController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas para Administradores, Dueños y Empleados ---
router.route('/')
    .post([
        authorize('administrador', 'dueño', 'empleado'),
        body('tipo_multimedia_id').isInt({ min: 1 }).withMessage('ID de tipo multimedia debe ser un número positivo'),
        body('nombre').isString().notEmpty().withMessage('Nombre es requerido'),
        body('descripcion').optional().isString(),
        body('url').isString().notEmpty().withMessage('URL es requerida'),
        body('entidad').optional().isString(),
        body('entidad_id').optional().isInt({ min: 1 }).withMessage('ID de entidad debe ser un número positivo'),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
        body('fecha_subida').optional().isISO8601().withMessage('Fecha de subida debe ser válida'),
        body('tamaño').optional().isInt({ min: 0 }).withMessage('Tamaño debe ser un número positivo'),
        body('formato').optional().isString()
    ], handleValidation, multimediaController.createMultimedia)
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        query('tipo_multimedia_id').optional().isInt({ min: 1 }).withMessage('ID de tipo multimedia debe ser un número positivo'),
        query('entidad').optional().isString(),
        query('entidad_id').optional().isInt({ min: 1 }).withMessage('ID de entidad debe ser un número positivo'),
        query('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
        query('formato').optional().isString(),
        query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        query('ordenar_por').optional().isIn(['fecha_subida', 'nombre', 'tamaño', 'tipo_multimedia_id']).withMessage('Ordenar por debe ser válido'),
        query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
    ], handleValidation, multimediaController.getAllMultimedia);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, multimediaController.getMultimediaById)
    .put([
        authorize('administrador', 'dueño', 'empleado'),
        body('tipo_multimedia_id').optional().isInt({ min: 1 }).withMessage('ID de tipo multimedia debe ser un número positivo'),
        body('nombre').optional().isString().notEmpty().withMessage('Nombre no puede estar vacío'),
        body('descripcion').optional().isString(),
        body('url').optional().isString().notEmpty().withMessage('URL no puede estar vacía'),
        body('entidad').optional().isString(),
        body('entidad_id').optional().isInt({ min: 1 }).withMessage('ID de entidad debe ser un número positivo'),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
        body('fecha_subida').optional().isISO8601().withMessage('Fecha de subida debe ser válida'),
        body('tamaño').optional().isInt({ min: 0 }).withMessage('Tamaño debe ser un número positivo'),
        body('formato').optional().isString()
    ], handleValidation, multimediaController.updateMultimedia)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, multimediaController.deleteMultimedia);

// --- Rutas específicas ---
router.get('/tipo/:tipo_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
    query('entidad').optional().isString(),
    query('ordenar_por').optional().isIn(['fecha_subida', 'nombre', 'tamaño']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, multimediaController.getMultimediaPorTipo);

router.get('/entidad/:entidad/:entidad_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('tipo_multimedia_id').optional().isInt({ min: 1 }).withMessage('ID de tipo multimedia debe ser un número positivo'),
    query('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
    query('ordenar_por').optional().isIn(['fecha_subida', 'nombre', 'tamaño']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, multimediaController.getMultimediaPorEntidad);

router.get('/activa', [
    authorize('administrador', 'dueño', 'empleado'),
    query('tipo_multimedia_id').optional().isInt({ min: 1 }).withMessage('ID de tipo multimedia debe ser un número positivo'),
    query('entidad').optional().isString(),
    query('ordenar_por').optional().isIn(['fecha_subida', 'nombre', 'tamaño']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, multimediaController.getMultimediaActiva);

router.patch('/:id/estado', [
    authorize('administrador', 'dueño'),
    body('activa').isBoolean().withMessage('Activa debe ser true o false')
], handleValidation, multimediaController.cambiarEstadoMultimedia);

router.get('/fecha/:fecha', [
    authorize('administrador', 'dueño', 'empleado'),
    query('tipo_multimedia_id').optional().isInt({ min: 1 }).withMessage('ID de tipo multimedia debe ser un número positivo'),
    query('entidad').optional().isString(),
    query('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
], handleValidation, multimediaController.getMultimediaPorFecha);

router.get('/buscar', [
    authorize('administrador', 'dueño', 'empleado'),
    query('termino').isString().notEmpty().withMessage('Término de búsqueda es requerido'),
    query('tipo_multimedia_id').optional().isInt({ min: 1 }).withMessage('ID de tipo multimedia debe ser un número positivo'),
    query('entidad').optional().isString(),
    query('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
    query('ordenar_por').optional().isIn(['fecha_subida', 'nombre', 'tamaño']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, multimediaController.buscarMultimedia);

module.exports = router; 