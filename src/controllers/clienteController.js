const Cliente = require('../models/Cliente');
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

// @desc    Crear un nuevo cliente
// @route   POST /api/clientes
// @access  Private (Admin, Dueño)
exports.createCliente = asyncHandler(async (req, res, next) => {
    try {
        const cliente = await Cliente.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Cliente creado exitosamente.',
            data: cliente
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todos los clientes
// @route   GET /api/clientes
// @access  Private (Admin, Dueño, Empleado)
exports.getAllClientes = asyncHandler(async (req, res, next) => {
    const clientes = await Cliente.obtenerTodos(req.query);
    res.status(200).json({
        success: true,
        count: clientes.length,
        data: clientes
    });
});

// @desc    Obtener un cliente por ID
// @route   GET /api/clientes/:id
// @access  Private (Admin, Dueño, Empleado)
exports.getClienteById = asyncHandler(async (req, res, next) => {
    try {
        const cliente = await Cliente.obtenerPorId(req.params.id);

        if (!cliente) {
            return next(new ErrorResponse(`Cliente no encontrado con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: cliente
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar un cliente
// @route   PUT /api/clientes/:id
// @access  Private (Admin, Dueño)
exports.updateCliente = asyncHandler(async (req, res, next) => {
    try {
        const cliente = await Cliente.actualizar(req.params.id, req.body);

        res.status(200).json({
            success: true,
            mensaje: 'Cliente actualizado exitosamente',
            data: cliente
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar (desactivar) un cliente
// @route   DELETE /api/clientes/:id
// @access  Private (Admin, Dueño)
exports.deleteCliente = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Cliente.eliminar(req.params.id);

        if (!eliminado) {
            return next(new ErrorResponse(`Cliente no encontrado con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            mensaje: 'Cliente eliminado exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener historial de servicios de un cliente
// @route   GET /api/clientes/:id/historial
// @access  Private (Admin, Dueño, Empleado)
exports.getHistorialCliente = asyncHandler(async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const historial = await Cliente.obtenerHistorialServicios(req.params.id, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.status(200).json({
            success: true,
            count: historial.length,
            data: historial
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener citas de un cliente
// @route   GET /api/clientes/:id/citas
// @access  Private (Admin, Dueño, Empleado)
exports.getCitasCliente = asyncHandler(async (req, res, next) => {
    try {
        const { page = 1, limit = 20, estado } = req.query;
        const citas = await Cliente.obtenerCitas(req.params.id, {
            page: parseInt(page),
            limit: parseInt(limit),
            estado
        });

        res.status(200).json({
            success: true,
            count: citas.length,
            data: citas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener estadísticas de un cliente
// @route   GET /api/clientes/:id/stats
// @access  Private (Admin, Dueño, Empleado)
exports.getStatsCliente = asyncHandler(async (req, res, next) => {
    try {
        const estadisticas = await Cliente.obtenerEstadisticas(req.params.id);

        res.status(200).json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Buscar clientes
// @route   GET /api/clientes/search
// @access  Private (Admin, Dueño, Empleado)
exports.searchClientes = asyncHandler(async (req, res, next) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q) {
            return next(new ErrorResponse('Término de búsqueda requerido', 400));
        }

        const clientes = await Cliente.buscar(q, parseInt(limit));

        res.status(200).json({
            success: true,
            count: clientes.length,
            data: clientes
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 