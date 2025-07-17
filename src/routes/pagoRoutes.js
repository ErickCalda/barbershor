const express = require('express');
const { body, query } = require('express-validator');
const pagoController = require('../controllers/pagoController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas para Administradores, Dueños y Empleados ---
router.route('/')
    .post([
        authorize('administrador', 'dueño', 'empleado'),
        body('cita_id').optional().isInt({ min: 1 }).withMessage('ID de cita debe ser un número positivo'),
        body('cliente_id').isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
        body('metodo_pago_id').isInt({ min: 1 }).withMessage('ID de método de pago debe ser un número positivo'),
        body('monto').isFloat({ min: 0 }).withMessage('Monto debe ser un número positivo'),
        body('estado_pago_id').optional().isInt({ min: 1 }).withMessage('ID de estado de pago debe ser un número positivo'),
        body('referencia').optional().isString(),
        body('notas').optional().isString(),
        body('fecha_pago').optional().isISO8601().withMessage('Fecha de pago debe ser válida')
    ], handleValidation, pagoController.createPago)
    .get([
        authorize('administrador', 'dueño'),
        query('cliente_id').optional().isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
        query('cita_id').optional().isInt({ min: 1 }).withMessage('ID de cita debe ser un número positivo'),
        query('metodo_pago_id').optional().isInt({ min: 1 }).withMessage('ID de método de pago debe ser un número positivo'),
        query('estado_pago_id').optional().isInt({ min: 1 }).withMessage('ID de estado de pago debe ser un número positivo'),
        query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
        query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
        query('monto_min').optional().isFloat({ min: 0 }).withMessage('Monto mínimo debe ser un número positivo'),
        query('monto_max').optional().isFloat({ min: 0 }).withMessage('Monto máximo debe ser un número positivo'),
        query('ordenar_por').optional().isIn(['fecha_pago', 'monto', 'cliente_id', 'cita_id']).withMessage('Ordenar por debe ser válido'),
        query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
    ], handleValidation, pagoController.getAllPagos);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, pagoController.getPagoById)
    .put([
        authorize('administrador', 'dueño'),
        body('cita_id').optional().isInt({ min: 1 }).withMessage('ID de cita debe ser un número positivo'),
        body('cliente_id').optional().isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
        body('metodo_pago_id').optional().isInt({ min: 1 }).withMessage('ID de método de pago debe ser un número positivo'),
        body('monto').optional().isFloat({ min: 0 }).withMessage('Monto debe ser un número positivo'),
        body('estado_pago_id').optional().isInt({ min: 1 }).withMessage('ID de estado de pago debe ser un número positivo'),
        body('referencia').optional().isString(),
        body('notas').optional().isString(),
        body('fecha_pago').optional().isISO8601().withMessage('Fecha de pago debe ser válida')
    ], handleValidation, pagoController.updatePago)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, pagoController.deletePago);

// --- Rutas específicas ---
router.get('/cliente/:cliente_id', [
    authorize('administrador', 'dueño', 'empleado'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida'),
    query('estado_pago_id').optional().isInt({ min: 1 }).withMessage('ID de estado de pago debe ser un número positivo')
], handleValidation, pagoController.getPagosPorCliente);

router.get('/cita/:cita_id', [
    authorize('administrador', 'dueño', 'empleado')
], pagoController.getPagosPorCita);

router.get('/metodo/:metodo_id', [
    authorize('administrador', 'dueño'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, pagoController.getPagosPorMetodo);

router.get('/estado/:estado', [
    authorize('administrador', 'dueño'),
    query('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').optional().isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, pagoController.getPagosPorEstado);

router.get('/fecha/:fecha', [
    authorize('administrador', 'dueño')
], pagoController.getPagosPorFecha);

router.get('/rango', [
    authorize('administrador', 'dueño'),
    query('fecha_inicio').isISO8601().withMessage('Fecha de inicio debe ser válida'),
    query('fecha_fin').isISO8601().withMessage('Fecha de fin debe ser válida')
], handleValidation, pagoController.getPagosPorRango);

router.patch('/:id/estado', [
    authorize('administrador', 'dueño'),
    body('estado').isInt({ min: 1 }).withMessage('ID de estado debe ser un número positivo')
], handleValidation, pagoController.cambiarEstadoPago);

module.exports = router; 