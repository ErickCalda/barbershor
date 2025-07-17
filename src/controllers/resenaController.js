const Resena = require('../models/Resena');
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

// @desc    Crear una nueva reseña
// @route   POST /api/resenas
// @access  Private (Cliente)
exports.createResena = asyncHandler(async (req, res, next) => {
    try {
        const resena = await Resena.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Reseña creada exitosamente.',
            data: resena
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las reseñas
// @route   GET /api/resenas
// @access  Public
exports.getAllResenas = asyncHandler(async (req, res, next) => {
    try {
        const resenas = await Resena.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: resenas.length,
            data: resenas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una reseña por ID
// @route   GET /api/resenas/:id
// @access  Public
exports.getResenaById = asyncHandler(async (req, res, next) => {
    try {
        const resena = await Resena.obtenerPorId(req.params.id);
        if (!resena) {
            return next(new ErrorResponse(`Reseña no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: resena
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una reseña
// @route   PUT /api/resenas/:id
// @access  Private (Cliente propietario, Admin, Dueño)
exports.updateResena = asyncHandler(async (req, res, next) => {
    try {
        const resena = await Resena.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Reseña actualizada exitosamente',
            data: resena
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una reseña
// @route   DELETE /api/resenas/:id
// @access  Private (Cliente propietario, Admin, Dueño)
exports.deleteResena = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Resena.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Reseña no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Reseña eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener reseñas por cliente
// @route   GET /api/resenas/cliente/:cliente_id
// @access  Public
exports.getResenasPorCliente = asyncHandler(async (req, res, next) => {
    try {
        const resenas = await Resena.obtenerPorCliente(req.params.cliente_id);
        res.status(200).json({
            success: true,
            count: resenas.length,
            data: resenas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener reseñas por servicio
// @route   GET /api/resenas/servicio/:servicio_id
// @access  Public
exports.getResenasPorServicio = asyncHandler(async (req, res, next) => {
    try {
        const resenas = await Resena.obtenerPorServicio(req.params.servicio_id);
        res.status(200).json({
            success: true,
            count: resenas.length,
            data: resenas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener reseñas por calificación
// @route   GET /api/resenas/calificacion/:calificacion
// @access  Public
exports.getResenasPorCalificacion = asyncHandler(async (req, res, next) => {
    try {
        const resenas = await Resena.obtenerPorCalificacion(req.params.calificacion);
        res.status(200).json({
            success: true,
            count: resenas.length,
            data: resenas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener reseñas aprobadas
// @route   GET /api/resenas/aprobadas
// @access  Public
exports.getResenasAprobadas = asyncHandler(async (req, res, next) => {
    try {
        const resenas = await Resena.obtenerAprobadas();
        res.status(200).json({
            success: true,
            count: resenas.length,
            data: resenas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Aprobar/Rechazar una reseña
// @route   PATCH /api/resenas/:id/estado
// @access  Private (Admin, Dueño)
exports.cambiarEstadoResena = asyncHandler(async (req, res, next) => {
    try {
        const { aprobada } = req.body;
        const resena = await Resena.cambiarEstado(req.params.id, aprobada);
        res.status(200).json({
            success: true,
            mensaje: 'Estado de reseña actualizado exitosamente',
            data: resena
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
}); 