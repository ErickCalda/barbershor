const Servicio = require('../models/Servicio');
const asyncHandler = require('../middleware/asyncHandler');
const { getFileUrl } = require('../middleware/upload');

// Crear un nuevo servicio con imagen subida
exports.crearServicio = asyncHandler(async (req, res, next) => {
  let datosServicio = { ...req.body };

  if (req.file) {
    datosServicio.imagen = req.file.filename;
  }

  const servicio = await Servicio.crear(datosServicio);

  // Si tiene imagen, añadimos la URL pública
  if (servicio.imagen) {
    servicio.imagen = getFileUrl(servicio.imagen, 'servicios');
  }

  res.status(201).json({ success: true, data: servicio });
});

// Obtener todos los servicios (con filtros opcionales)
exports.obtenerServicios = asyncHandler(async (req, res, next) => {
  let servicios = await Servicio.obtenerTodos(req.query);

  servicios = servicios.map(servicio => {
    if (servicio.imagen) {
      servicio.imagen = getFileUrl(servicio.imagen, 'servicios');
    }
    return servicio;
  });

  res.status(200).json({ success: true, count: servicios.length, data: servicios });
});

// Obtener un servicio por ID
exports.obtenerServicioPorId = asyncHandler(async (req, res, next) => {
  const servicio = await Servicio.obtenerPorId(req.params.id);

  if (!servicio) {
    return res.status(404).json({ success: false, mensaje: 'Servicio no encontrado' });
  }

  if (servicio.imagen) {
    servicio.imagen = getFileUrl(servicio.imagen, 'servicios');
  }

  res.status(200).json({ success: true, data: servicio });
});

// Actualizar un servicio
exports.actualizarServicio = asyncHandler(async (req, res, next) => {
  const actualizado = await Servicio.actualizar(req.params.id, req.body);

  if (!actualizado) {
    return res.status(404).json({ success: false, mensaje: 'Servicio no encontrado o sin cambios' });
  }

  res.status(200).json({ success: true, mensaje: 'Servicio actualizado correctamente' });
});

// Eliminar (desactivar) un servicio
exports.eliminarServicio = asyncHandler(async (req, res, next) => {
  const eliminado = await Servicio.eliminar(req.params.id);

  if (!eliminado) {
    return res.status(404).json({ success: false, mensaje: 'Servicio no encontrado' });
  }

  res.status(200).json({ success: true, mensaje: 'Servicio eliminado correctamente' });
});

// Obtener servicios por categoría
exports.obtenerServiciosPorCategoria = asyncHandler(async (req, res, next) => {
  let servicios = await Servicio.obtenerPorCategoria(req.params.categoria_id);

  servicios = servicios.map(servicio => {
    if (servicio.imagen) {
      servicio.imagen = getFileUrl(servicio.imagen, 'servicios');
    }
    return servicio;
  });

  res.status(200).json({ success: true, count: servicios.length, data: servicios });
});

// Obtener servicios destacados
exports.obtenerServiciosDestacados = asyncHandler(async (req, res, next) => {
  let servicios = await Servicio.obtenerDestacados(Number(req.query.limite) || 10);

  servicios = servicios.map(servicio => {
    if (servicio.imagen) {
      servicio.imagen = getFileUrl(servicio.imagen, 'servicios');
    }
    return servicio;
  });

  res.status(200).json({ success: true, count: servicios.length, data: servicios });
});

// Buscar servicios
exports.buscarServicios = asyncHandler(async (req, res, next) => {
  let servicios = await Servicio.buscar(req.query.q || '');

  servicios = servicios.map(servicio => {
    if (servicio.imagen) {
      servicio.imagen = getFileUrl(servicio.imagen, 'servicios');
    }
    return servicio;
  });

  res.status(200).json({ success: true, count: servicios.length, data: servicios });
});
