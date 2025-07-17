const Galeria = require('../models/Galeria');
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

// @desc    Crear una nueva imagen de galería
// @route   POST /api/galeria
// @access  Private (Admin, Dueño)
exports.createGaleria = asyncHandler(async (req, res, next) => {
    try {
        const galeria = await Galeria.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Imagen de galería creada exitosamente.',
            data: galeria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las imágenes de galería
// @route   GET /api/galeria
// @access  Public
exports.getAllGaleria = asyncHandler(async (req, res, next) => {
    try {
        const galeria = await Galeria.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: galeria.length,
            data: galeria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una imagen por ID
// @route   GET /api/galeria/:id
// @access  Public
exports.getGaleriaById = asyncHandler(async (req, res, next) => {
    try {
        const galeria = await Galeria.obtenerPorId(req.params.id);
        if (!galeria) {
            return next(new ErrorResponse(`Imagen no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: galeria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una imagen
// @route   PUT /api/galeria/:id
// @access  Private (Admin, Dueño)
exports.updateGaleria = asyncHandler(async (req, res, next) => {
    try {
        const galeria = await Galeria.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Imagen actualizada exitosamente',
            data: galeria
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una imagen
// @route   DELETE /api/galeria/:id
// @access  Private (Admin, Dueño)
exports.deleteGaleria = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Galeria.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Imagen no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Imagen eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener imágenes por categoría
// @route   GET /api/galeria/categoria/:categoria_id
// @access  Public
exports.getGaleriaPorCategoria = asyncHandler(async (req, res, next) => {
    try {
        const galeria = await Galeria.obtenerPorCategoria(req.params.categoria_id);
        res.status(200).json({
            success: true,
            count: galeria.length,
            data: galeria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener imágenes destacadas
// @route   GET /api/galeria/destacadas
// @access  Public
exports.getGaleriaDestacadas = asyncHandler(async (req, res, next) => {
    try {
        const galeria = await Galeria.obtenerDestacadas();
        res.status(200).json({
            success: true,
            count: galeria.length,
            data: galeria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 