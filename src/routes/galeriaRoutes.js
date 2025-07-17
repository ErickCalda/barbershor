const express = require('express');
const { body, query } = require('express-validator');
const galeriaController = require('../controllers/galeriaController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// --- Rutas públicas ---
router.get('/', [
    query('categoria_id').optional().isInt({ min: 1 }).withMessage('ID de categoría debe ser un número positivo'),
    query('destacada').optional().isBoolean().withMessage('Destacada debe ser true o false'),
    query('ordenar_por').optional().isIn(['fecha', 'orden', 'titulo']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, galeriaController.getAllGaleria);

router.get('/destacadas', galeriaController.getGaleriaDestacadas);

router.get('/categoria/:categoria_id', [
    query('ordenar_por').optional().isIn(['fecha', 'orden', 'titulo']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, galeriaController.getGaleriaPorCategoria);

router.get('/:id', galeriaController.getGaleriaById);

// --- Rutas para Administradores y Dueños ---
router.post('/', [
    authorize('administrador', 'dueño'),
    body('titulo').isString().notEmpty().withMessage('Título es requerido'),
    body('descripcion').optional().isString(),
    body('imagen_url').isString().notEmpty().withMessage('URL de imagen es requerida'),
    body('categoria_id').optional().isInt({ min: 1 }).withMessage('ID de categoría debe ser un número positivo'),
    body('destacada').optional().isBoolean().withMessage('Destacada debe ser true o false'),
    body('orden').optional().isInt({ min: 1 }).withMessage('Orden debe ser un número positivo'),
    body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
], handleValidation, galeriaController.createGaleria);

router.route('/:id')
    .put([
        authorize('administrador', 'dueño'),
        body('titulo').optional().isString().notEmpty().withMessage('Título no puede estar vacío'),
        body('descripcion').optional().isString(),
        body('imagen_url').optional().isString().notEmpty().withMessage('URL de imagen no puede estar vacía'),
        body('categoria_id').optional().isInt({ min: 1 }).withMessage('ID de categoría debe ser un número positivo'),
        body('destacada').optional().isBoolean().withMessage('Destacada debe ser true o false'),
        body('orden').optional().isInt({ min: 1 }).withMessage('Orden debe ser un número positivo'),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
    ], handleValidation, galeriaController.updateGaleria)
    .delete([
        authorize('administrador', 'dueño')
    ], galeriaController.deleteGaleria);

module.exports = router; 