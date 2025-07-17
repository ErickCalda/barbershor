const VentaProducto = require('../models/VentaProducto');
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

// @desc    Crear una nueva venta de productos
// @route   POST /api/ventas
// @access  Private (Admin, Dueño, Empleado)
exports.createVenta = asyncHandler(async (req, res, next) => {
    try {
        const venta = await VentaProducto.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Venta registrada exitosamente.',
            data: venta
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las ventas
// @route   GET /api/ventas
// @access  Private (Admin, Dueño)
exports.getAllVentas = asyncHandler(async (req, res, next) => {
    try {
        const ventas = await VentaProducto.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: ventas.length,
            data: ventas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una venta por ID
// @route   GET /api/ventas/:id
// @access  Private (Admin, Dueño, Empleado)
exports.getVentaById = asyncHandler(async (req, res, next) => {
    try {
        const venta = await VentaProducto.obtenerPorId(req.params.id);
        if (!venta) {
            return next(new ErrorResponse(`Venta no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: venta
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar estado de pago de una venta
// @route   PATCH /api/ventas/:id/estado-pago
// @access  Private (Admin, Dueño, Empleado)
exports.updateEstadoPago = asyncHandler(async (req, res, next) => {
    try {
      const ventaId = req.params.id;
      const { estado_pago_id, notas } = req.body;
  
      // Aquí deberías llamar a la función de tu modelo que actualice el estado de pago.
      // Por ejemplo:
      const ventaActualizada = await VentaProducto.actualizarEstadoPago(ventaId, estado_pago_id, notas);
  
      if (!ventaActualizada) {
        return next(new ErrorResponse(`Venta no encontrada con el id ${ventaId}`, 404));
      }
  
      res.status(200).json({
        success: true,
        mensaje: 'Estado de pago actualizado exitosamente',
        data: ventaActualizada,
      });
    } catch (error) {
      next(new ErrorResponse(error.message, 500));
    }
  });
  

// @desc    Actualizar una venta
// @route   PUT /api/ventas/:id
// @access  Private (Admin, Dueño)
exports.updateVenta = asyncHandler(async (req, res, next) => {
    try {
        const venta = await VentaProducto.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Venta actualizada exitosamente',
            data: venta
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una venta
// @route   DELETE /api/ventas/:id
// @access  Private (Admin, Dueño)
exports.deleteVenta = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await VentaProducto.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Venta no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Venta eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener ventas por cliente
// @route   GET /api/ventas/cliente/:cliente_id
// @access  Private (Admin, Dueño, Empleado)
exports.getVentasPorCliente = asyncHandler(async (req, res, next) => {
    try {
        const ventas = await VentaProducto.obtenerPorCliente(req.params.cliente_id);
        res.status(200).json({
            success: true,
            count: ventas.length,
            data: ventas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener ventas por empleado
// @route   GET /api/ventas/empleado/:empleado_id
// @access  Private (Admin, Dueño)
exports.getVentasPorEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const ventas = await VentaProducto.obtenerPorEmpleado(req.params.empleado_id);
        res.status(200).json({
            success: true,
            count: ventas.length,
            data: ventas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener ventas por fecha
// @route   GET /api/ventas/fecha/:fecha
// @access  Private (Admin, Dueño)
exports.getVentasPorFecha = asyncHandler(async (req, res, next) => {
    try {
        const ventas = await VentaProducto.obtenerPorFecha(req.params.fecha);
        res.status(200).json({
            success: true,
            count: ventas.length,
            data: ventas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener ventas por rango de fechas
// @route   GET /api/ventas/rango
// @access  Private (Admin, Dueño)
exports.getVentasPorRango = asyncHandler(async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const ventas = await VentaProducto.obtenerPorRango(fecha_inicio, fecha_fin);
        res.status(200).json({
            success: true,
            count: ventas.length,
            data: ventas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener estadísticas de ventas
// @route   GET /api/ventas/estadisticas
// @access  Private (Admin, Dueño)
exports.getEstadisticasVentas = asyncHandler(async (req, res, next) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const estadisticas = await VentaProducto.obtenerEstadisticas(fecha_inicio, fecha_fin);
        res.status(200).json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar el estado de pago de una venta
// @route   PATCH /api/ventas/:id/estado-pago
// @access  Private (Admin, Dueño, Empleado)
exports.updateEstadoPago = asyncHandler(async (req, res, next) => {
    try {
        const venta = await VentaProducto.actualizarEstadoPago(req.params.id, req.body);
        if (!venta) {
            return next(new ErrorResponse(`Venta no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Estado de pago actualizado exitosamente',
            data: venta
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
}); 