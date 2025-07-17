const express = require('express');
const { body, query } = require('express-validator');
const categoriaGaleriaController = require('../controllers/categoriaGaleriaController');
const { protect, authorize } = require('../middleware/auth');
const handleValidation = require('../middleware/handleValidation');

const router = express.Router();

// Rutas públicas
router.get('/', [
    query('pagina').optional().isInt({ min: 1 }),
    query('limite').optional().isInt({ min: 1, max: 100 }),
], handleValidation, categoriaGaleriaController.getAllCategoriasGaleria);

router.get('/:id', categoriaGaleriaController.getCategoriaGaleriaById);

// Rutas privadas (requieren autenticación)
router.use(protect);

// Rutas para administradores y dueños
router.post('/', [
    authorize('administrador', 'dueño'),
    body('nombre').isString().notEmpty(),
    body('color').optional().isString(),
    body('orden').optional().isInt({ min: 1 }),
    body('activo').optional().isBoolean(),
], handleValidation, categoriaGaleriaController.createCategoriaGaleria);

router.put('/:id', [
    authorize('administrador', 'dueño'),
    body('nombre').optional().isString(),
    body('color').optional().isString(),
    body('orden').optional().isInt({ min: 1 }),
    body('activo').optional().isBoolean(),
], handleValidation, categoriaGaleriaController.updateCategoriaGaleria);

router.delete('/:id', [
    authorize('administrador', 'dueño')
], handleValidation, categoriaGaleriaController.deleteCategoriaGaleria);

module.exports = router; 