const Pago = require('../models/Pago');
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

// @desc    Crear un nuevo pago
// @route   POST /api/pagos
// @access  Private (Admin, Dueño, Empleado)
exports.createPago = asyncHandler(async (req, res, next) => {
    try {
        const pago = await Pago.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Pago registrado exitosamente.',
            data: pago
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todos los pagos
// @route   GET /api/pagos
// @access  Private (Admin, Dueño)
exports.getAllPagos = asyncHandler(async (req, res, next) => {
    try {
        const pagos = await Pago.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: pagos.length,
            data: pagos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener un pago por ID
// @route   GET /api/pagos/:id
// @access  Private (Admin, Dueño, Empleado)
exports.getPagoById = asyncHandler(async (req, res, next) => {
    try {
        const pago = await Pago.obtenerPorId(req.params.id);
        if (!pago) {
            return next(new ErrorResponse(`Pago no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: pago
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar un pago
// @route   PUT /api/pagos/:id
// @access  Private (Admin, Dueño)
exports.updatePago = asyncHandler(async (req, res, next) => {
    try {
        const pago = await Pago.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Pago actualizado exitosamente',
            data: pago
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar un pago
// @route   DELETE /api/pagos/:id
// @access  Private (Admin, Dueño)
exports.deletePago = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Pago.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Pago no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Pago eliminado exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener pagos por cliente
// @route   GET /api/pagos/cliente/:cliente_id
// @access  Private (Admin, Dueño, Empleado)
exports.getPagosPorCliente = asyncHandler(async (req, res, next) => {
    try {
        const pagos = await Pago.obtenerPorCliente(req.params.cliente_id);
        res.status(200).json({
            success: true,
            count: pagos.length,
            data: pagos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener pagos por cita
// @route   GET /api/pagos/cita/:cita_id
// @access  Private (Admin, Dueño, Empleado)
exports.getPagosPorCita = asyncHandler(async (req, res, next) => {
    try {
        const pagos = await Pago.obtenerPorCita(req.params.cita_id);
        res.status(200).json({
            success: true,
            count: pagos.length,
            data: pagos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener pagos por método de pago
// @route   GET /api/pagos/metodo/:metodo_id
// @access  Private (Admin, Dueño)
exports.getPagosPorMetodo = asyncHandler(async (req, res, next) => {
    try {
        const pagos = await Pago.obtenerPorMetodo(req.params.metodo_id);
        res.status(200).json({
            success: true,
            count: pagos.length,
            data: pagos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener pagos por estado
// @route   GET /api/pagos/estado/:estado
// @access  Private (Admin, Dueño)
exports.getPagosPorEstado = asyncHandler(async (req, res, next) => {
    try {
        const pagos = await Pago.obtenerPorEstado(req.params.estado);
        res.status(200).json({
            success: true,
            count: pagos.length,
            data: pagos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener pagos por fecha
// @route   GET /api/pagos/fecha/:fecha
// @access  Private (Admin, Dueño)
exports.getPagosPorFecha = asyncHandler(async (req, res, next) => {
    try {
        const pagos = await Pago.obtenerPorFecha(req.params.fecha);
        res.status(200).json({
            success: true,
            count: pagos.length,
            data: pagos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener pagos por rango de fechas
// @route   GET /api/pagos/rango
// @access  Private (Admin, Dueño)
exports.getPagosPorRango = asyncHandler(async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const pagos = await Pago.obtenerPorRango(fecha_inicio, fecha_fin);
        res.status(200).json({
            success: true,
            count: pagos.length,
            data: pagos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Cambiar estado de un pago
// @route   PATCH /api/pagos/:id/estado
// @access  Private (Admin, Dueño)
exports.cambiarEstadoPago = asyncHandler(async (req, res, next) => {
    try {
        const { estado } = req.body;
        const pago = await Pago.cambiarEstado(req.params.id, estado);
        res.status(200).json({
            success: true,
            mensaje: 'Estado de pago actualizado exitosamente',
            data: pago
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
}); 