const Promocion = require('../models/Promocion');
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

// @desc    Crear una nueva promoción
// @route   POST /api/promociones
// @access  Private (Admin, Dueño)
exports.createPromocion = asyncHandler(async (req, res, next) => {
    try {
        const promocion = await Promocion.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Promoción creada exitosamente.',
            data: promocion
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las promociones
// @route   GET /api/promociones
// @access  Public
exports.getAllPromociones = asyncHandler(async (req, res, next) => {
    try {
        const promociones = await Promocion.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: promociones.length,
            data: promociones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una promoción por ID
// @route   GET /api/promociones/:id
// @access  Public
exports.getPromocionById = asyncHandler(async (req, res, next) => {
    try {
        const promocion = await Promocion.obtenerPorId(req.params.id);
        if (!promocion) {
            return next(new ErrorResponse(`Promoción no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: promocion
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una promoción
// @route   PUT /api/promociones/:id
// @access  Private (Admin, Dueño)
exports.updatePromocion = asyncHandler(async (req, res, next) => {
    try {
        const promocion = await Promocion.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Promoción actualizada exitosamente',
            data: promocion
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una promoción
// @route   DELETE /api/promociones/:id
// @access  Private (Admin, Dueño)
exports.deletePromocion = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Promocion.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Promoción no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Promoción eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener promociones activas
// @route   GET /api/promociones/activas
// @access  Public
exports.getPromocionesActivas = asyncHandler(async (req, res, next) => {
    try {
        const promociones = await Promocion.obtenerActivas();
        res.status(200).json({
            success: true,
            count: promociones.length,
            data: promociones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener promociones por fecha
// @route   GET /api/promociones/fecha/:fecha
// @access  Public
exports.getPromocionesPorFecha = asyncHandler(async (req, res, next) => {
    try {
        const promociones = await Promocion.obtenerPorFecha(req.params.fecha);
        res.status(200).json({
            success: true,
            count: promociones.length,
            data: promociones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener promociones por servicio
// @route   GET /api/promociones/servicio/:servicio_id
// @access  Public
exports.getPromocionesPorServicio = asyncHandler(async (req, res, next) => {
    try {
        const promociones = await Promocion.obtenerPorServicio(req.params.servicio_id);
        res.status(200).json({
            success: true,
            count: promociones.length,
            data: promociones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 