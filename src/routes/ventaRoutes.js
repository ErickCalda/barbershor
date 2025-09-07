const express = require('express');
const { body, query, param } = require('express-validator'); // ✅ se añadió `param`
const ventaController = require('../controllers/ventaController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas principales de ventas ---
router.route('/')
    .post([
        authorize('administrador', 'dueño', 'empleado'),
        body('cliente_id').isInt({ min: 1 }).withMessage('ID de cliente requerido'),
        body('empleado_id').isInt({ min: 1 }).withMessage('ID de empleado requerido'),
        body('metodo_pago_id').isInt({ min: 1 }).withMessage('ID de método de pago requerido'),
        body('productos').isArray({ min: 1 }).withMessage('Al menos un producto es requerido'),
        body('productos.*.producto_id').isInt({ min: 1 }).withMessage('ID de producto requerido'),
        body('productos.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser un número positivo'),
        body('productos.*.precio_unitario').isFloat({ min: 0 }).withMessage('Precio unitario debe ser un número positivo'),
        body('descuento').optional().isFloat({ min: 0 }).withMessage('Descuento debe ser un número positivo'),
        body('notas').optional().isString()
    ], handleValidation, ventaController.createVenta)
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
        query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        query('cliente_id').optional().isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
        query('empleado_id').optional().isInt({ min: 1 }).withMessage('ID de empleado debe ser un número positivo'),
        query('estado_pago_id').optional().isInt({ min: 1 }).withMessage('Estado de pago debe ser un número positivo')
    ], handleValidation, ventaController.getAllVentas);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        param('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo') // ✅ corregido
    ], handleValidation, ventaController.getVentaById)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, ventaController.deleteVenta);

// --- Ruta para cambiar estado de pago ---
router.patch('/:id/estado-pago', [
    authorize('administrador', 'dueño', 'empleado'),
    param('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo'), // ✅ agregado
    body('estado_pago_id').isInt({ min: 1 }).withMessage('Estado de pago requerido'),
    body('notas').optional().isString()
], handleValidation, ventaController.updateEstadoPago);

// --- Rutas específicas ---
router.get('/cliente/:cliente_id', [
    authorize('administrador', 'dueño', 'empleado'),
    param('cliente_id').isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'), // ✅ corregido
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100')
], handleValidation, ventaController.getVentasPorCliente);

// --- Ruta de estadísticas (solo admin y dueño) ---
router.get('/stats', [
    authorize('administrador', 'dueño'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, ventaController.getEstadisticasVentas);

// --- Serie temporal de ventas ---
router.get('/serie', [
    authorize('administrador', 'dueño'),
    query('periodo').optional().isIn(['dia','mes','anio']).withMessage('Periodo inválido'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, ventaController.getSerieVentas);

module.exports = router;
