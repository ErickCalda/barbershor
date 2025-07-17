const express = require('express');
const router = express.Router();
const controller = require('../controllers/EmpleadoEspecialidadController');

router.get('/', controller.listar);
router.get('/:empleado_id/:especialidad_id', controller.obtenerPorId);
router.post('/', controller.crear);
router.put('/:empleado_id/:especialidad_id', controller.actualizar);
router.delete('/:empleado_id/:especialidad_id', controller.eliminar);

module.exports = router; 