const express = require('express');
const { body, query } = require('express-validator');
const productoController = require('../controllers/productoController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// --- Rutas públicas ---
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
    query('categoria_id').optional().isInt({ min: 1 }).withMessage('ID de categoría debe ser un número positivo'),
    query('search').optional().isString(),
    query('min_precio').optional().isFloat({ min: 0 }).withMessage('Precio mínimo debe ser un número positivo'),
    query('max_precio').optional().isFloat({ min: 0 }).withMessage('Precio máximo debe ser un número positivo'),
    query('ordenar_por').optional().isIn(['nombre', 'precio', 'stock', 'createdAt']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC'),
    query('solo_activos').optional().isBoolean().withMessage('Solo activos debe ser true o false')
], handleValidation, productoController.getAllProductos);

router.get('/:id', [
    body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
], handleValidation, productoController.getProductoById);

router.get('/categoria/:categoria_id', [
    body('categoria_id').isInt({ min: 1 }).withMessage('ID de categoría debe ser un número positivo'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100')
], handleValidation, productoController.getProductosPorCategoria);

router.get('/search', [
    query('q').notEmpty().withMessage('Término de búsqueda requerido'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Límite debe estar entre 1 y 50')
], handleValidation, productoController.searchProductos);

// --- Rutas privadas (requieren autenticación) ---
router.use(protect);

// --- Rutas para Administradores y Dueños ---
router.route('/')
    .post([
        authorize('administrador', 'dueño'),
        body('nombre').isString({ min: 2, max: 200 }).withMessage('Nombre debe tener entre 2 y 200 caracteres'),
        body('descripcion').optional().isString(),
        body('precio').isFloat({ min: 0 }).withMessage('Precio debe ser un número positivo'),
        body('stock').optional().isInt({ min: 0 }).withMessage('Stock debe ser un número entero positivo'),
        body('categoria_id').optional().isInt({ min: 1 }).withMessage('ID de categoría debe ser un número positivo'),
        body('marca').optional().isString(),
        body('codigo_barras').optional().isString(),
        body('imagen_url').optional().isURL().withMessage('URL de imagen debe ser válida'),
        body('activo').optional().isBoolean().withMessage('Activo debe ser true o false')
    ], handleValidation, productoController.createProducto);

router.route('/:id')
    .put([
        authorize('administrador', 'dueño'),
        body('nombre').optional().isString({ min: 2, max: 200 }).withMessage('Nombre debe tener entre 2 y 200 caracteres'),
        body('descripcion').optional().isString(),
        body('precio').optional().isFloat({ min: 0 }).withMessage('Precio debe ser un número positivo'),
        body('stock').optional().isInt({ min: 0 }).withMessage('Stock debe ser un número entero positivo'),
        body('categoria_id').optional().isInt({ min: 1 }).withMessage('ID de categoría debe ser un número positivo'),
        body('marca').optional().isString(),
        body('codigo_barras').optional().isString(),
        body('imagen_url').optional().isURL().withMessage('URL de imagen debe ser válida'),
        body('activo').optional().isBoolean().withMessage('Activo debe ser true o false')
    ], handleValidation, productoController.updateProducto)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, productoController.deleteProducto);

// --- Rutas para gestión de stock ---
router.patch('/:id/stock', [
    authorize('administrador', 'dueño', 'empleado'),
    body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser un número entero positivo'),
    body('tipo').isIn(['incrementar', 'decrementar', 'establecer']).withMessage('Tipo debe ser incrementar, decrementar o establecer')
], handleValidation, productoController.updateStock);

// --- Rutas para administradores y dueños ---
router.get('/stock-bajo', [
    authorize('administrador', 'dueño'),
    query('limite').optional().isInt({ min: 1 }).withMessage('Límite debe ser un número positivo')
], handleValidation, productoController.getProductosStockBajo);

router.get('/stats', [
    authorize('administrador', 'dueño')
], handleValidation, productoController.getStatsProductos);

module.exports = router; 