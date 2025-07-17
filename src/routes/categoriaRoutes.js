const express = require('express');
const { body, query } = require('express-validator');
const categoriaController = require('../controllers/categoriaController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// --- Rutas públicas para categorías de productos ---
router.get('/productos', [
    query('solo_activas').optional().isBoolean().withMessage('Solo activas debe ser true o false')
], handleValidation, categoriaController.getAllCategoriasProductos);

router.get('/productos/:id', [
    body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
], handleValidation, categoriaController.getCategoriaProductoById);

// --- Rutas públicas para categorías de servicios ---
router.get('/servicios', [
    query('solo_activas').optional().isBoolean().withMessage('Solo activas debe ser true o false')
], handleValidation, categoriaController.getAllCategoriasServicios);

router.get('/servicios/:id', [
    body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
], handleValidation, categoriaController.getCategoriaServicioById);

// --- Rutas privadas (requieren autenticación) ---
router.use(protect);

// --- Rutas para categorías de productos (Admin y Dueño) ---
router.route('/productos')
    .post([
        authorize('administrador', 'dueño'),
        body('nombre').isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('descripcion').optional().isString(),
        body('imagen_url').optional().isURL().withMessage('URL de imagen debe ser válida'),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
    ], handleValidation, categoriaController.createCategoriaProducto);

router.route('/productos/:id')
    .put([
        authorize('administrador', 'dueño'),
        body('nombre').optional().isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('descripcion').optional().isString(),
        body('imagen_url').optional().isURL().withMessage('URL de imagen debe ser válida'),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
    ], handleValidation, categoriaController.updateCategoriaProducto)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, categoriaController.deleteCategoriaProducto);

// --- Rutas para categorías de servicios (Admin y Dueño) ---
router.route('/servicios')
    .post([
        authorize('administrador', 'dueño'),
        body('nombre').isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('descripcion').optional().isString(),
        body('imagen_url').optional().isURL().withMessage('URL de imagen debe ser válida'),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
    ], handleValidation, categoriaController.createCategoriaServicio);

router.route('/servicios/:id')
    .put([
        authorize('administrador', 'dueño'),
        body('nombre').optional().isString({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('descripcion').optional().isString(),
        body('imagen_url').optional().isURL().withMessage('URL de imagen debe ser válida'),
        body('activa').optional().isBoolean().withMessage('Activa debe ser true o false')
    ], handleValidation, categoriaController.updateCategoriaServicio)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, categoriaController.deleteCategoriaServicio);

// --- Ruta de estadísticas (solo admin y dueño) ---
router.get('/stats', [
    authorize('administrador', 'dueño')
], handleValidation, categoriaController.getStatsCategorias);

module.exports = router; 