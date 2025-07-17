const express = require('express');
const { body, query } = require('express-validator');
const fichaClienteController = require('../controllers/fichaClienteController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// --- Rutas para Administradores, Dueños y Empleados ---
router.route('/')
    .post([
        authorize('administrador', 'dueño', 'empleado'),
        body('cliente_id').isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
        body('tipo_cabello').optional().isString(),
        body('color_cabello').optional().isString(),
        body('textura_cabello').optional().isString(),
        body('condicion_cabello').optional().isString(),
        body('alergias').optional().isString(),
        body('condiciones_medicas').optional().isString(),
        body('preferencias').optional().isString(),
        body('notas').optional().isString(),
        body('fecha_creacion').optional().isISO8601().withMessage('Fecha de creación debe ser válida')
    ], handleValidation, fichaClienteController.createFichaCliente)
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        query('cliente_id').optional().isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
        query('tipo_cabello').optional().isString(),
        query('color_cabello').optional().isString(),
        query('textura_cabello').optional().isString(),
        query('condicion_cabello').optional().isString(),
        query('con_alergias').optional().isBoolean().withMessage('Con alergias debe ser true o false'),
        query('con_condiciones_medicas').optional().isBoolean().withMessage('Con condiciones médicas debe ser true o false'),
        query('ordenar_por').optional().isIn(['fecha_creacion', 'cliente_id', 'tipo_cabello']).withMessage('Ordenar por debe ser válido'),
        query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
    ], handleValidation, fichaClienteController.getAllFichasCliente);

router.route('/:id')
    .get([
        authorize('administrador', 'dueño', 'empleado'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, fichaClienteController.getFichaClienteById)
    .put([
        authorize('administrador', 'dueño', 'empleado'),
        body('cliente_id').optional().isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
        body('tipo_cabello').optional().isString(),
        body('color_cabello').optional().isString(),
        body('textura_cabello').optional().isString(),
        body('condicion_cabello').optional().isString(),
        body('alergias').optional().isString(),
        body('condiciones_medicas').optional().isString(),
        body('preferencias').optional().isString(),
        body('notas').optional().isString(),
        body('fecha_creacion').optional().isISO8601().withMessage('Fecha de creación debe ser válida')
    ], handleValidation, fichaClienteController.updateFichaCliente)
    .delete([
        authorize('administrador', 'dueño'),
        body('id').isInt({ min: 1 }).withMessage('ID debe ser un número positivo')
    ], handleValidation, fichaClienteController.deleteFichaCliente);

// --- Rutas específicas ---
router.get('/cliente/:cliente_id', [
    authorize('administrador', 'dueño', 'empleado')
], fichaClienteController.getFichaPorCliente);

router.get('/tipo-cabello/:tipo', [
    authorize('administrador', 'dueño', 'empleado'),
    query('ordenar_por').optional().isIn(['fecha_creacion', 'cliente_id']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, fichaClienteController.getFichasPorTipoCabello);

router.get('/color-cabello/:color', [
    authorize('administrador', 'dueño', 'empleado'),
    query('ordenar_por').optional().isIn(['fecha_creacion', 'cliente_id']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, fichaClienteController.getFichasPorColorCabello);

router.get('/con-alergias', [
    authorize('administrador', 'dueño', 'empleado'),
    query('ordenar_por').optional().isIn(['fecha_creacion', 'cliente_id']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, fichaClienteController.getFichasConAlergias);

router.get('/con-condiciones-medicas', [
    authorize('administrador', 'dueño', 'empleado'),
    query('ordenar_por').optional().isIn(['fecha_creacion', 'cliente_id']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, fichaClienteController.getFichasConCondicionesMedicas);

router.get('/buscar', [
    authorize('administrador', 'dueño', 'empleado'),
    query('termino').isString().notEmpty().withMessage('Término de búsqueda es requerido'),
    query('ordenar_por').optional().isIn(['fecha_creacion', 'cliente_id']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, fichaClienteController.buscarFichas);

module.exports = router; 