const AusenciaEmpleado = require('../models/AusenciaEmpleado');
const asyncHandler = require('../middleware/asyncHandler');

class ErrorResponse extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        if (errors) this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

// @desc    Crear una nueva ausencia de empleado
// @route   POST /api/ausencias-empleado
// @access  Private (Admin, Dueño)
exports.createAusenciaEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const ausencia = await AusenciaEmpleado.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Ausencia registrada exitosamente.',
            data: ausencia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las ausencias de empleados
// @route   GET /api/ausencias-empleado
// @access  Private (Admin, Dueño)
exports.getAllAusenciasEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const ausencias = await AusenciaEmpleado.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: ausencias.length,
            data: ausencias
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una ausencia por ID
// @route   GET /api/ausencias-empleado/:id
// @access  Private (Admin, Dueño)
exports.getAusenciaEmpleadoById = asyncHandler(async (req, res, next) => {
    try {
        const ausencia = await AusenciaEmpleado.obtenerPorId(req.params.id);
        if (!ausencia) {
            return next(new ErrorResponse(`Ausencia no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: ausencia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una ausencia
// @route   PUT /api/ausencias-empleado/:id
// @access  Private (Admin, Dueño)
exports.updateAusenciaEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const ausencia = await AusenciaEmpleado.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Ausencia actualizada exitosamente',
            data: ausencia
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una ausencia
// @route   DELETE /api/ausencias-empleado/:id
// @access  Private (Admin, Dueño)
exports.deleteAusenciaEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await AusenciaEmpleado.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Ausencia no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Ausencia eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener ausencias por empleado
// @route   GET /api/ausencias-empleado/empleado/:empleado_id
// @access  Private (Admin, Dueño, Empleado)
exports.getAusenciasPorEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const ausencias = await AusenciaEmpleado.obtenerPorEmpleado(req.params.empleado_id);
        res.status(200).json({
            success: true,
            count: ausencias.length,
            data: ausencias
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener ausencias por fecha
// @route   GET /api/ausencias-empleado/fecha/:fecha
// @access  Private (Admin, Dueño)
exports.getAusenciasPorFecha = asyncHandler(async (req, res, next) => {
    try {
        const ausencias = await AusenciaEmpleado.obtenerPorFecha(req.params.fecha);
        res.status(200).json({
            success: true,
            count: ausencias.length,
            data: ausencias
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener ausencias por rango de fechas
// @route   GET /api/ausencias-empleado/rango
// @access  Private (Admin, Dueño)
exports.getAusenciasPorRango = asyncHandler(async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const ausencias = await AusenciaEmpleado.obtenerPorRango(fecha_inicio, fecha_fin);
        res.status(200).json({
            success: true,
            count: ausencias.length,
            data: ausencias
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 