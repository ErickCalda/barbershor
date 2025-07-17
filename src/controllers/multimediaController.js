const Multimedia = require('../models/Multimedia');
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

// @desc    Crear un nuevo archivo multimedia
// @route   POST /api/multimedia
// @access  Private (Admin, Dueño, Empleado)
exports.createMultimedia = asyncHandler(async (req, res, next) => {
    try {
        const multimedia = await Multimedia.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Archivo multimedia creado exitosamente.',
            data: multimedia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todos los archivos multimedia
// @route   GET /api/multimedia
// @access  Private (Admin, Dueño, Empleado)
exports.getAllMultimedia = asyncHandler(async (req, res, next) => {
    try {
        const multimedia = await Multimedia.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: multimedia.length,
            data: multimedia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener un archivo multimedia por ID
// @route   GET /api/multimedia/:id
// @access  Private (Admin, Dueño, Empleado)
exports.getMultimediaById = asyncHandler(async (req, res, next) => {
    try {
        const multimedia = await Multimedia.obtenerPorId(req.params.id);
        if (!multimedia) {
            return next(new ErrorResponse(`Archivo multimedia no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: multimedia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar un archivo multimedia
// @route   PUT /api/multimedia/:id
// @access  Private (Admin, Dueño, Empleado)
exports.updateMultimedia = asyncHandler(async (req, res, next) => {
    try {
        const multimedia = await Multimedia.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Archivo multimedia actualizado exitosamente',
            data: multimedia
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar un archivo multimedia
// @route   DELETE /api/multimedia/:id
// @access  Private (Admin, Dueño)
exports.deleteMultimedia = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Multimedia.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Archivo multimedia no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Archivo multimedia eliminado exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener multimedia por tipo
// @route   GET /api/multimedia/tipo/:tipo_id
// @access  Private (Admin, Dueño, Empleado)
exports.getMultimediaPorTipo = asyncHandler(async (req, res, next) => {
    try {
        const multimedia = await Multimedia.obtenerPorTipo(req.params.tipo_id);
        res.status(200).json({
            success: true,
            count: multimedia.length,
            data: multimedia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener multimedia por entidad
// @route   GET /api/multimedia/entidad/:entidad/:entidad_id
// @access  Private (Admin, Dueño, Empleado)
exports.getMultimediaPorEntidad = asyncHandler(async (req, res, next) => {
    try {
        const { entidad, entidad_id } = req.params;
        const multimedia = await Multimedia.obtenerPorEntidad(entidad, entidad_id);
        res.status(200).json({
            success: true,
            count: multimedia.length,
            data: multimedia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener multimedia activa
// @route   GET /api/multimedia/activa
// @access  Private (Admin, Dueño, Empleado)
exports.getMultimediaActiva = asyncHandler(async (req, res, next) => {
    try {
        const multimedia = await Multimedia.obtenerActiva();
        res.status(200).json({
            success: true,
            count: multimedia.length,
            data: multimedia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Cambiar estado de multimedia
// @route   PATCH /api/multimedia/:id/estado
// @access  Private (Admin, Dueño)
exports.cambiarEstadoMultimedia = asyncHandler(async (req, res, next) => {
    try {
        const { activa } = req.body;
        const multimedia = await Multimedia.cambiarEstado(req.params.id, activa);
        res.status(200).json({
            success: true,
            mensaje: 'Estado de multimedia actualizado exitosamente',
            data: multimedia
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Obtener multimedia por fecha
// @route   GET /api/multimedia/fecha/:fecha
// @access  Private (Admin, Dueño, Empleado)
exports.getMultimediaPorFecha = asyncHandler(async (req, res, next) => {
    try {
        const multimedia = await Multimedia.obtenerPorFecha(req.params.fecha);
        res.status(200).json({
            success: true,
            count: multimedia.length,
            data: multimedia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Buscar multimedia por término
// @route   GET /api/multimedia/buscar
// @access  Private (Admin, Dueño, Empleado)
exports.buscarMultimedia = asyncHandler(async (req, res, next) => {
    try {
        const { termino } = req.query;
        const multimedia = await Multimedia.buscar(termino);
        res.status(200).json({
            success: true,
            count: multimedia.length,
            data: multimedia
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 