const express = require('express');
const { body, query } = require('express-validator');
const resenaController = require('../controllers/resenaController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// --- Rutas públicas ---
router.get('/', [
    query('cliente_id').optional().isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
    query('servicio_id').optional().isInt({ min: 1 }).withMessage('ID de servicio debe ser un número positivo'),
    query('calificacion').optional().isInt({ min: 1, max: 5 }).withMessage('Calificación debe estar entre 1 y 5'),
    query('aprobada').optional().isBoolean().withMessage('Aprobada debe ser true o false'),
    query('ordenar_por').optional().isIn(['fecha', 'calificacion', 'cliente_id']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, resenaController.getAllResenas);

router.get('/aprobadas', resenaController.getResenasAprobadas);

router.get('/cliente/:cliente_id', [
    query('aprobada').optional().isBoolean().withMessage('Aprobada debe ser true o false'),
    query('ordenar_por').optional().isIn(['fecha', 'calificacion']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, resenaController.getResenasPorCliente);

router.get('/servicio/:servicio_id', [
    query('aprobada').optional().isBoolean().withMessage('Aprobada debe ser true o false'),
    query('ordenar_por').optional().isIn(['fecha', 'calificacion']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, resenaController.getResenasPorServicio);

router.get('/calificacion/:calificacion', [
    query('aprobada').optional().isBoolean().withMessage('Aprobada debe ser true o false'),
    query('ordenar_por').optional().isIn(['fecha', 'cliente_id']).withMessage('Ordenar por debe ser válido'),
    query('orden').optional().isIn(['ASC', 'DESC']).withMessage('Orden debe ser ASC o DESC')
], handleValidation, resenaController.getResenasPorCalificacion);

router.get('/:id', resenaController.getResenaById);

// --- Rutas para Clientes ---
router.post('/', [
    protect,
    authorize('cliente'),
    body('cliente_id').isInt({ min: 1 }).withMessage('ID de cliente debe ser un número positivo'),
    body('servicio_id').isInt({ min: 1 }).withMessage('ID de servicio debe ser un número positivo'),
    body('calificacion').isInt({ min: 1, max: 5 }).withMessage('Calificación debe estar entre 1 y 5'),
    body('comentario').isString().notEmpty().withMessage('Comentario es requerido'),
    body('titulo').optional().isString()
], handleValidation, resenaController.createResena);

// --- Rutas para Clientes propietarios, Administradores y Dueños ---
router.route('/:id')
    .put([
        protect,
        authorize('cliente', 'administrador', 'dueño'),
        body('calificacion').optional().isInt({ min: 1, max: 5 }).withMessage('Calificación debe estar entre 1 y 5'),
        body('comentario').optional().isString().notEmpty().withMessage('Comentario no puede estar vacío'),
        body('titulo').optional().isString()
    ], handleValidation, resenaController.updateResena)
    .delete([
        protect,
        authorize('cliente', 'administrador', 'dueño')
    ], resenaController.deleteResena);

// --- Rutas para Administradores y Dueños ---
router.patch('/:id/estado', [
    authorize('administrador', 'dueño'),
    body('aprobada').isBoolean().withMessage('Aprobada debe ser true o false')
], handleValidation, resenaController.cambiarEstadoResena);

module.exports = router; 