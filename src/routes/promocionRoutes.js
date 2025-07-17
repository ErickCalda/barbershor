const express = require('express');
const { body, query } = require('express-validator');
const promocionController = require('../controllers/promocionController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// --- Rutas públicas ---
router.get('/', [
    query('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
    query('servicio_id').optional().isInt({ min: 1 }).withMessage('ID de servicio debe ser un número positivo'),
    query('fecha').optional().isISO8601().withMessage('Fecha debe ser válida'),
    query('ordenar_por').optional().isIn(['fecha_inicio', 'fecha_fin', 'descuento', 'titulo']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, promocionController.getAllPromociones);

router.get('/activas', promocionController.getPromocionesActivas);

router.get('/fecha/:fecha', promocionController.getPromocionesPorFecha);

router.get('/servicio/:servicio_id', promocionController.getPromocionesPorServicio);

router.get('/:id', promocionController.getPromocionById);

// --- Rutas para Administradores y Dueños ---
router.post('/', [
    authorize('administrador', 'dueño'),
    body('titulo').isString().notEmpty().withMessage('Título es requerido'),
    body('descripcion').optional().isString(),
    body('descuento').isFloat({ min: 0, max: 100 }).withMessage('Descuento debe estar entre 0 y 100'),
    body('fecha_inicio').isISO8601().withMessage('Fecha de inicio debe ser válida'),
    body('fecha_fin').isISO8601().withMessage('Fecha de fin debe ser válida'),
    body('servicio_id').optional().isInt({ min: 1 }).withMessage('ID de servicio debe ser un número positivo'),
    body('codigo').optional().isString(),
    body('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
    body('imagen_url').optional().isString()
], handleValidation, promocionController.createPromocion);

router.route('/:id')
    .put([
        authorize('administrador', 'dueño'),
        body('titulo').optional().isString().notEmpty().withMessage('Título no puede estar vacío'),
        body('descripcion').optional().isString(),
        body('descuento').optional().isFloat({ min: 0, max: 100 }).withMessage('Descuento debe estar entre 0 y 100'),
        body('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        body('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        body('servicio_id').optional().isInt({ min: 1 }).withMessage('ID de servicio debe ser un número positivo'),
        body('codigo').optional().isString(),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false'),
        body('imagen_url').optional().isString()
    ], handleValidation, promocionController.updatePromocion)
    .delete([
        authorize('administrador', 'dueño')
    ], promocionController.deletePromocion);

module.exports = router; 