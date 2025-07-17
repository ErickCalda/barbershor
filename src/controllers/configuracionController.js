const Configuracion = require('../models/Configuracion');
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

// @desc    Crear una nueva configuración
// @route   POST /api/configuraciones
// @access  Private (Admin, Dueño)
exports.createConfiguracion = asyncHandler(async (req, res, next) => {
    try {
        const configuracion = await Configuracion.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Configuración creada exitosamente.',
            data: configuracion
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las configuraciones
// @route   GET /api/configuraciones
// @access  Private (Admin, Dueño)
exports.getAllConfiguraciones = asyncHandler(async (req, res, next) => {
    try {
        const configuraciones = await Configuracion.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: configuraciones.length,
            data: configuraciones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una configuración por ID
// @route   GET /api/configuraciones/:id
// @access  Private (Admin, Dueño)
exports.getConfiguracionById = asyncHandler(async (req, res, next) => {
    try {
        const configuracion = await Configuracion.obtenerPorId(req.params.id);
        if (!configuracion) {
            return next(new ErrorResponse(`Configuración no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: configuracion
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una configuración
// @route   PUT /api/configuraciones/:id
// @access  Private (Admin, Dueño)
exports.updateConfiguracion = asyncHandler(async (req, res, next) => {
    try {
        const configuracion = await Configuracion.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Configuración actualizada exitosamente',
            data: configuracion
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una configuración
// @route   DELETE /api/configuraciones/:id
// @access  Private (Admin, Dueño)
exports.deleteConfiguracion = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Configuracion.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Configuración no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Configuración eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener configuración por clave
// @route   GET /api/configuraciones/clave/:clave
// @access  Private (Admin, Dueño)
exports.getConfiguracionPorClave = asyncHandler(async (req, res, next) => {
    try {
        const configuracion = await Configuracion.obtenerPorClave(req.params.clave);
        if (!configuracion) {
            return next(new ErrorResponse(`Configuración no encontrada con la clave ${req.params.clave}`, 404));
        }
        res.status(200).json({
            success: true,
            data: configuracion
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener configuración por categoría
// @route   GET /api/configuraciones/categoria/:categoria
// @access  Private (Admin, Dueño)
exports.getConfiguracionPorCategoria = asyncHandler(async (req, res, next) => {
    try {
        const configuraciones = await Configuracion.obtenerPorCategoria(req.params.categoria);
        res.status(200).json({
            success: true,
            count: configuraciones.length,
            data: configuraciones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener configuración del sistema
// @route   GET /api/configuraciones/sistema
// @access  Public
exports.getConfiguracionSistema = asyncHandler(async (req, res, next) => {
    try {
        const configuraciones = await Configuracion.obtenerSistema();
        res.status(200).json({
            success: true,
            data: configuraciones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 