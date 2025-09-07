const Cita = require('../models/Cita');
const asyncHandler = require('../middleware/asyncHandler');

// Clase ErrorResponse local
class ErrorResponse extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        if (errors) this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

// @desc    Crear una nueva cita
// @route   POST /api/citas
// @access  Private (Admin, Dueño, Empleado)
exports.createCita = asyncHandler(async (req, res, next) => {
    try {
        const cita = await Cita.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Cita creada exitosamente.',
            data: cita
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las citas
// @route   GET /api/citas
// @access  Private (Admin, Dueño, Empleado)
exports.getAllCitas = asyncHandler(async (req, res, next) => {
    const citas = await Cita.obtenerTodas(req.query);
    res.status(200).json({
        success: true,
        count: citas.length,
        data: citas
    });
});

// @desc    Obtener una cita por ID
// @route   GET /api/citas/:id
// @access  Private (Admin, Dueño, Empleado)
exports.getCitaById = asyncHandler(async (req, res, next) => {
    try {
        const cita = await Cita.obtenerPorId(req.params.id);
        if (!cita) {
            return next(new ErrorResponse(`Cita no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: cita
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una cita
// @route   PUT /api/citas/:id
// @access  Private (Admin, Dueño, Empleado)
exports.updateCita = asyncHandler(async (req, res, next) => {
    try {
        const cita = await Cita.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Cita actualizada exitosamente',
            data: cita
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una cita
// @route   DELETE /api/citas/:id
// @access  Private (Admin, Dueño)
exports.deleteCita = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Cita.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Cita no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Cita eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener citas por cliente
// @route   GET /api/citas/cliente/:cliente_id
// @access  Private (Admin, Dueño, Empleado)
exports.getCitasPorCliente = asyncHandler(async (req, res, next) => {
    try {
        const citas = await Cita.obtenerPorCliente(req.params.cliente_id);
        res.status(200).json({
            success: true,
            count: citas.length,
            data: citas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener citas por empleado
// @route   GET /api/citas/empleado/:empleado_id
// @access  Private (Admin, Dueño, Empleado)
exports.getCitasPorEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const citas = await Cita.obtenerPorEmpleado(req.params.empleado_id);
        res.status(200).json({
            success: true,
            count: citas.length,
            data: citas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener citas por fecha
// @route   GET /api/citas/fecha/:fecha
// @access  Private (Admin, Dueño, Empleado)
exports.getCitasPorFecha = asyncHandler(async (req, res, next) => {
    try {
        const citas = await Cita.obtenerPorFecha(req.params.fecha);
        res.status(200).json({
            success: true,
            count: citas.length,
            data: citas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener citas por estado
// @route   GET /api/citas/estado/:estado
// @access  Private (Admin, Dueño, Empleado)
exports.getCitasPorEstado = asyncHandler(async (req, res, next) => {
    try {
        const citas = await Cita.obtenerPorEstado(req.params.estado);
        res.status(200).json({
            success: true,
            count: citas.length,
            data: citas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Cambiar estado de una cita
// @route   PATCH /api/citas/:id/estado
// @access  Private (Admin, Dueño, Empleado)
exports.cambiarEstadoCita = asyncHandler(async (req, res, next) => {
    console.log('📦 BODY recibido en /estado:', req.body);

    try {
        const estadoId = req.body.estado_id;
        console.log('🔍 estado_id recibido:', estadoId);

        // Validar que estado_id exista y sea un número válido
        if (!estadoId || isNaN(Number(estadoId))) {
            const msg = "El campo 'estado_id' es requerido y debe ser un número válido.";
            console.error('❌ Validación:', msg);
            return next(new ErrorResponse(msg, 400));
        }

        // Cambiar estado en la base de datos
        const cita = await Cita.cambiarEstado(req.params.id, estadoId);

        if (!cita) {
            return next(new ErrorResponse('Cita no encontrada', 404));
        }

        res.status(200).json({
            success: true,
            mensaje: 'Estado de cita actualizado exitosamente',
            data: cita
        });
    } catch (error) {
        console.error('❌ Error al cambiar estado:', error.message);
        next(new ErrorResponse(error.message, 500));
    }
});

  

// @desc    Obtener horarios disponibles
// @route   GET /api/citas/horarios-disponibles
// @access  Public
exports.getHorariosDisponibles = asyncHandler(async (req, res, next) => {
    try {
        const { fecha, empleado_id, servicio_id } = req.query;
        const horarios = await Cita.obtenerHorariosDisponibles(fecha, empleado_id, servicio_id);
        res.status(200).json({
            success: true,
            data: horarios
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener disponibilidad de empleado
// @route   GET /api/citas/disponibilidad/:empleado_id
// @access  Private (Admin, Dueño, Empleado)
exports.getDisponibilidadEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const { fecha } = req.query;
        const disponibilidad = await Cita.obtenerDisponibilidad(req.params.empleado_id, fecha);

        res.status(200).json({
            success: true,
            data: disponibilidad
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener estadísticas de citas
// @route   GET /api/citas/stats
// @access  Private (Admin, Dueño)
exports.getStatsCitas = asyncHandler(async (req, res, next) => {
    try {
        const { periodo = 'mes' } = req.query;
        const estadisticas = await Cita.obtenerEstadisticas(periodo);

        res.status(200).json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 

// @desc    Serie temporal de citas
// @route   GET /api/citas/serie
// @access  Private (Admin, Dueño)
exports.getSerieCitas = asyncHandler(async (req, res, next) => {
    try {
        const { periodo = 'dia', fecha_inicio, fecha_fin } = req.query;
        const data = await Cita.obtenerSerie(periodo, fecha_inicio, fecha_fin);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});



exports.obtenerEstadosCitas = async (req, res) => {
    try {
      const estados = await Cita.obtenerEstadosCitas();
      res.status(200).json({ success: true, data: estados });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener estados' });
    }
  };

  async function probarEstados() {
    try {
      const estados = await Cita.obtenerEstadosCitas();
      console.log('Estados de citas:', estados);
    } catch (error) {
      console.error('Error en prueba:', error);
    }
  }
  probarEstados();