const CategoriaGaleria = require('../models/CategoriaGaleria');
const asyncHandler = require('../middleware/asyncHandler');

class ErrorResponse extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        if (errors) this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

// @desc    Crear una nueva categoría de galería
// @route   POST /api/categorias-galeria
// @access  Private (Admin, Dueño)
exports.createCategoriaGaleria = asyncHandler(async (req, res, next) => {
    try {
        const categoria = await CategoriaGaleria.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Categoría de galería creada exitosamente.',
            data: categoria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las categorías de galería
// @route   GET /api/categorias-galeria
// @access  Public
exports.getAllCategoriasGaleria = asyncHandler(async (req, res, next) => {
    try {
        const resultado = await CategoriaGaleria.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: resultado.categorias.length,
            data: resultado.categorias,
            paginacion: resultado.paginacion
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una categoría de galería por ID
// @route   GET /api/categorias-galeria/:id
// @access  Public
exports.getCategoriaGaleriaById = asyncHandler(async (req, res, next) => {
    try {
        const categoria = await CategoriaGaleria.obtenerPorId(req.params.id);
        if (!categoria) {
            return next(new ErrorResponse(`Categoría de galería no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: categoria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una categoría de galería
// @route   PUT /api/categorias-galeria/:id
// @access  Private (Admin, Dueño)
exports.updateCategoriaGaleria = asyncHandler(async (req, res, next) => {
    try {
        const categoria = await CategoriaGaleria.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Categoría de galería actualizada exitosamente',
            data: categoria
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una categoría de galería
// @route   DELETE /api/categorias-galeria/:id
// @access  Private (Admin, Dueño)
exports.deleteCategoriaGaleria = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await CategoriaGaleria.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Categoría de galería no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Categoría de galería eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 