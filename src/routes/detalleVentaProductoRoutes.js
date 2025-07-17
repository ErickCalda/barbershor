const express = require('express');
const router = express.Router();
const controller = require('../controllers/DetalleVentaProductoController');

router.get('/', controller.listar);
router.get('/:venta_id/:producto_id', controller.obtenerPorId);
router.post('/', controller.crear);
router.put('/:venta_id/:producto_id', controller.actualizar);
router.delete('/:venta_id/:producto_id', controller.eliminar);

module.exports = router; 