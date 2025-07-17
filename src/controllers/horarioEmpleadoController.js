const HorarioEmpleado = require('../models/HorarioEmpleado');
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

// @desc    Crear un nuevo horario de empleado
// @route   POST /api/horarios-empleado
// @access  Private (Admin, Dueño)
exports.createHorarioEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const horario = await HorarioEmpleado.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Horario creado exitosamente.',
            data: horario
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todos los horarios de empleados
// @route   GET /api/horarios-empleado
// @access  Private (Admin, Dueño, Empleado)
exports.getAllHorariosEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const horarios = await HorarioEmpleado.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: horarios.length,
            data: horarios
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener un horario por ID
// @route   GET /api/horarios-empleado/:id
// @access  Private (Admin, Dueño, Empleado)
exports.getHorarioEmpleadoById = asyncHandler(async (req, res, next) => {
    try {
        const horario = await HorarioEmpleado.obtenerPorId(req.params.id);
        if (!horario) {
            return next(new ErrorResponse(`Horario no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: horario
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar un horario
// @route   PUT /api/horarios-empleado/:id
// @access  Private (Admin, Dueño)
exports.updateHorarioEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const horario = await HorarioEmpleado.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Horario actualizado exitosamente',
            data: horario
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar un horario
// @route   DELETE /api/horarios-empleado/:id
// @access  Private (Admin, Dueño)
exports.deleteHorarioEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await HorarioEmpleado.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Horario no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Horario eliminado exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener horarios por empleado
// @route   GET /api/horarios-empleado/empleado/:empleado_id
// @access  Private (Admin, Dueño, Empleado)
exports.getHorariosPorEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const horarios = await HorarioEmpleado.obtenerPorEmpleado(req.params.empleado_id);
        res.status(200).json({
            success: true,
            count: horarios.length,
            data: horarios
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener horarios por día de la semana
// @route   GET /api/horarios-empleado/dia/:dia
// @access  Private (Admin, Dueño, Empleado)
exports.getHorariosPorDia = asyncHandler(async (req, res, next) => {
    try {
        const horarios = await HorarioEmpleado.obtenerPorDia(req.params.dia);
        res.status(200).json({
            success: true,
            count: horarios.length,
            data: horarios
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener horarios activos
// @route   GET /api/horarios-empleado/activos
// @access  Private (Admin, Dueño, Empleado)
exports.getHorariosActivos = asyncHandler(async (req, res, next) => {
    try {
        const horarios = await HorarioEmpleado.obtenerActivos();
        res.status(200).json({
            success: true,
            count: horarios.length,
            data: horarios
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener horarios por fecha
// @route   GET /api/horarios-empleado/fecha/:fecha
// @access  Private (Admin, Dueño, Empleado)
exports.getHorariosPorFecha = asyncHandler(async (req, res, next) => {
    try {
        const horarios = await HorarioEmpleado.obtenerPorFecha(req.params.fecha);
        res.status(200).json({
            success: true,
            count: horarios.length,
            data: horarios
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener horarios por rango de fechas
// @route   GET /api/horarios-empleado/rango
// @access  Private (Admin, Dueño, Empleado)
exports.getHorariosPorRango = asyncHandler(async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const horarios = await HorarioEmpleado.obtenerPorRango(fecha_inicio, fecha_fin);
        res.status(200).json({
            success: true,
            count: horarios.length,
            data: horarios
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Cambiar estado de un horario
// @route   PATCH /api/horarios-empleado/:id/estado
// @access  Private (Admin, Dueño)
exports.cambiarEstadoHorario = asyncHandler(async (req, res, next) => {
    try {
        const { activo } = req.body;
        const horario = await HorarioEmpleado.cambiarEstado(req.params.id, activo);
        res.status(200).json({
            success: true,
            mensaje: 'Estado de horario actualizado exitosamente',
            data: horario
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
}); 