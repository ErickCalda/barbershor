const express = require('express');
const router = express.Router();
const controller = require('../controllers/EmpleadoServicioController');

router.get('/', controller.listar);
router.get('/:empleado_id/:servicio_id', controller.obtenerPorId);
router.post('/', controller.crear);
router.put('/:empleado_id/:servicio_id', controller.actualizar);
router.delete('/:empleado_id/:servicio_id', controller.eliminar);

module.exports = router; 