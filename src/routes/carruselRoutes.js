const express = require('express');
const { body, query } = require('express-validator');
const carruselController = require('../controllers/carruselController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Rutas públicas
router.get('/', [
    query('pagina').optional().isInt({ min: 1 }),
    query('limite').optional().isInt({ min: 1, max: 100 }),
], handleValidation, carruselController.getAllCarruseles);

router.get('/:id', carruselController.getCarruselById);

// Rutas privadas (requieren autenticación)
router.use(protect);

// Rutas para administradores y dueños
router.post('/', [
    authorize('administrador', 'dueño'),
    body('titulo').isString().notEmpty(),
    body('imagen_url').isString().notEmpty(),
    body('orden').optional().isInt({ min: 1 }),
    body('activo').optional().isBoolean(),
], handleValidation, carruselController.createCarrusel);

router.put('/:id', [
    authorize('administrador', 'dueño'),
    body('titulo').optional().isString(),
    body('imagen_url').optional().isString(),
    body('orden').optional().isInt({ min: 1 }),
    body('activo').optional().isBoolean(),
], handleValidation, carruselController.updateCarrusel);

router.delete('/:id', [
    authorize('administrador', 'dueño')
], handleValidation, carruselController.deleteCarrusel);

module.exports = router; 