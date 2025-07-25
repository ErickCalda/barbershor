const express = require('express');
const router = express.Router();
const controller = require('../controllers/TipoMultimediaController');

router.get('/', controller.listar);
router.get('/:id', controller.obtenerPorId);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router; 