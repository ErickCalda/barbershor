const FichaCliente = require('../models/FichaCliente');
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

// @desc    Crear una nueva ficha de cliente
// @route   POST /api/fichas-cliente
// @access  Private (Admin, Dueño, Empleado)
exports.createFichaCliente = asyncHandler(async (req, res, next) => {
    try {
        const ficha = await FichaCliente.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Ficha de cliente creada exitosamente.',
            data: ficha
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las fichas de clientes
// @route   GET /api/fichas-cliente
// @access  Private (Admin, Dueño, Empleado)
exports.getAllFichasCliente = asyncHandler(async (req, res, next) => {
    try {
        const fichas = await FichaCliente.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: fichas.length,
            data: fichas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una ficha por ID
// @route   GET /api/fichas-cliente/:id
// @access  Private (Admin, Dueño, Empleado)
exports.getFichaClienteById = asyncHandler(async (req, res, next) => {
    try {
        const ficha = await FichaCliente.obtenerPorId(req.params.id);
        if (!ficha) {
            return next(new ErrorResponse(`Ficha no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: ficha
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una ficha
// @route   PUT /api/fichas-cliente/:id
// @access  Private (Admin, Dueño, Empleado)
exports.updateFichaCliente = asyncHandler(async (req, res, next) => {
    try {
        const ficha = await FichaCliente.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Ficha actualizada exitosamente',
            data: ficha
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una ficha
// @route   DELETE /api/fichas-cliente/:id
// @access  Private (Admin, Dueño)
exports.deleteFichaCliente = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await FichaCliente.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Ficha no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Ficha eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener ficha por cliente
// @route   GET /api/fichas-cliente/cliente/:cliente_id
// @access  Private (Admin, Dueño, Empleado)
exports.getFichaPorCliente = asyncHandler(async (req, res, next) => {
    try {
        const ficha = await FichaCliente.obtenerPorCliente(req.params.cliente_id);
        if (!ficha) {
            return next(new ErrorResponse(`Ficha no encontrada para el cliente ${req.params.cliente_id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: ficha
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener fichas por tipo de cabello
// @route   GET /api/fichas-cliente/tipo-cabello/:tipo
// @access  Private (Admin, Dueño, Empleado)
exports.getFichasPorTipoCabello = asyncHandler(async (req, res, next) => {
    try {
        const fichas = await FichaCliente.obtenerPorTipoCabello(req.params.tipo);
        res.status(200).json({
            success: true,
            count: fichas.length,
            data: fichas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener fichas por color de cabello
// @route   GET /api/fichas-cliente/color-cabello/:color
// @access  Private (Admin, Dueño, Empleado)
exports.getFichasPorColorCabello = asyncHandler(async (req, res, next) => {
    try {
        const fichas = await FichaCliente.obtenerPorColorCabello(req.params.color);
        res.status(200).json({
            success: true,
            count: fichas.length,
            data: fichas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener fichas con alergias
// @route   GET /api/fichas-cliente/con-alergias
// @access  Private (Admin, Dueño, Empleado)
exports.getFichasConAlergias = asyncHandler(async (req, res, next) => {
    try {
        const fichas = await FichaCliente.obtenerConAlergias();
        res.status(200).json({
            success: true,
            count: fichas.length,
            data: fichas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener fichas con condiciones médicas
// @route   GET /api/fichas-cliente/con-condiciones-medicas
// @access  Private (Admin, Dueño, Empleado)
exports.getFichasConCondicionesMedicas = asyncHandler(async (req, res, next) => {
    try {
        const fichas = await FichaCliente.obtenerConCondicionesMedicas();
        res.status(200).json({
            success: true,
            count: fichas.length,
            data: fichas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Buscar fichas por término
// @route   GET /api/fichas-cliente/buscar
// @access  Private (Admin, Dueño, Empleado)
exports.buscarFichas = asyncHandler(async (req, res, next) => {
    try {
        const { termino } = req.query;
        const fichas = await FichaCliente.buscar(termino);
        res.status(200).json({
            success: true,
            count: fichas.length,
            data: fichas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 