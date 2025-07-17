const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const { protect, authorize } = require('../middleware/auth');
const { uploadService, handleUploadError } = require('../middleware/upload');

// Rutas públicas
router.get('/', servicioController.obtenerServicios);
router.get('/destacados', servicioController.obtenerServiciosDestacados);
router.get('/buscar', servicioController.buscarServicios);
router.get('/categoria/:categoria_id', servicioController.obtenerServiciosPorCategoria);
router.get('/:id', servicioController.obtenerServicioPorId);

// Rutas protegidas (solo admin o dueño)

// Crear servicio con imagen
router.post(
  '/',
  protect,
  authorize('administrador', 'dueño'),
  uploadService,                // middleware de carga de imagen
  handleUploadError,           // manejo de errores de subida
  servicioController.crearServicio
);

// Actualizar servicio con imagen (opcional)
router.put(
  '/:id',
  protect,
  authorize('administrador', 'dueño'),
  uploadService,                // opcional: permite reemplazar imagen
  handleUploadError,
  servicioController.actualizarServicio
);

router.delete('/:id', protect, authorize('administrador', 'dueño'), servicioController.eliminarServicio);

module.exports = router;
