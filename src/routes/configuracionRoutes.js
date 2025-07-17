const express = require('express');
const { body, query } = require('express-validator');
const configuracionController = require('../controllers/configuracionController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// --- Rutas públicas ---
router.get('/sistema', configuracionController.getConfiguracionSistema);

// --- Rutas para Administradores y Dueños ---
router.route('/')
    .post([
        authorize('administrador', 'dueño'),
        body('clave').isString().notEmpty().withMessage('Clave es requerida'),
        body('valor').isString().notEmpty().withMessage('Valor es requerido'),
        body('descripcion').optional().isString(),
        body('categoria').optional().isString(),
        body('tipo').optional().isIn(['string', 'number', 'boolean', 'json']).withMessage('Tipo debe ser válido'),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
    ], handleValidation, configuracionController.createConfiguracion)
    .get([
        authorize('administrador', 'dueño'),
        query('categoria').optional().isString(),
        query('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
        query('ordenar_por').optional().isIn(['clave', 'categoria', 'fecha_creacion']).withMessage('Ordenar por debe ser válido'),
        query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
    ], handleValidation, configuracionController.getAllConfiguraciones);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, configuracionController.getConfiguracionById)
    .put([
        authorize('administrador', 'dueño'),
        body('clave').optional().isString().notEmpty().withMessage('Clave no puede estar vacía'),
        body('valor').optional().isString().notEmpty().withMessage('Valor no puede estar vacío'),
        body('descripcion').optional().isString(),
        body('categoria').optional().isString(),
        body('tipo').optional().isIn(['string', 'number', 'boolean', 'json']).withMessage('Tipo debe ser válido'),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
    ], handleValidation, configuracionController.updateConfiguracion)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, configuracionController.deleteConfiguracion);

// --- Rutas específicas ---
router.get('/clave/:clave', [
    authorize('administrador', 'dueño')
], configuracionController.getConfiguracionPorClave);

router.get('/categoria/:categoria', [
    authorize('administrador', 'dueño'),
    query('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
    query('ordenar_por').optional().isIn(['clave', 'fecha_creacion']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, configuracionController.getConfiguracionPorCategoria);

module.exports = router; 