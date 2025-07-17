const Carrusel = require('../models/Carrusel');
const asyncHandler = require('../middleware/asyncHandler');

class ErrorResponse extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        if (errors) this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

// @desc    Crear un nuevo carrusel
// @route   POST /api/carruseles
// @access  Private (Admin, Dueño)
exports.createCarrusel = asyncHandler(async (req, res, next) => {
    try {
        const carrusel = await Carrusel.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Carrusel creado exitosamente.',
            data: carrusel
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todos los carruseles
// @route   GET /api/carruseles
// @access  Public
exports.getAllCarruseles = asyncHandler(async (req, res, next) => {
    try {
        const resultado = await Carrusel.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: resultado.carruseles.length,
            data: resultado.carruseles,
            paginacion: resultado.paginacion
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener un carrusel por ID
// @route   GET /api/carruseles/:id
// @access  Public
exports.getCarruselById = asyncHandler(async (req, res, next) => {
    try {
        const carrusel = await Carrusel.obtenerPorId(req.params.id);
        if (!carrusel) {
            return next(new ErrorResponse(`Carrusel no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: carrusel
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar un carrusel
// @route   PUT /api/carruseles/:id
// @access  Private (Admin, Dueño)
exports.updateCarrusel = asyncHandler(async (req, res, next) => {
    try {
        const carrusel = await Carrusel.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Carrusel actualizado exitosamente',
            data: carrusel
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar (desactivar) un carrusel
// @route   DELETE /api/carruseles/:id
// @access  Private (Admin, Dueño)
exports.deleteCarrusel = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Carrusel.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Carrusel no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Carrusel eliminado exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 