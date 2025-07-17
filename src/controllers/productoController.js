const Producto = require('../models/Producto');
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

// @desc    Crear un nuevo producto
// @route   POST /api/productos
// @access  Private (Admin, Dueño)
exports.createProducto = asyncHandler(async (req, res, next) => {
    try {
        const producto = await Producto.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Producto creado exitosamente.',
            data: producto
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todos los productos
// @route   GET /api/productos
// @access  Public
exports.getAllProductos = asyncHandler(async (req, res, next) => {
    try {
        console.log('Parámetros recibidos en req.query:', req.query);
        const resultado = await Producto.obtenerTodos(req.query);
        console.log('Respuesta de Producto.obtenerTodos:', resultado);
        res.status(200).json({
            success: true,
            count: resultado.productos.length,
            data: resultado.productos,
            paginacion: resultado.paginacion
        });
    } catch (error) {
        console.error('Error en getAllProductos:', error);
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener un producto por ID
// @route   GET /api/productos/:id
// @access  Public
exports.getProductoById = asyncHandler(async (req, res, next) => {
    try {
        const producto = await Producto.obtenerPorId(req.params.id);

        if (!producto) {
            return next(new ErrorResponse(`Producto no encontrado con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: producto
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar un producto
// @route   PUT /api/productos/:id
// @access  Private (Admin, Dueño)
exports.updateProducto = asyncHandler(async (req, res, next) => {
    try {
        const producto = await Producto.actualizar(req.params.id, req.body);

        res.status(200).json({
            success: true,
            mensaje: 'Producto actualizado exitosamente',
            data: producto
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar (desactivar) un producto
// @route   DELETE /api/productos/:id
// @access  Private (Admin, Dueño)
exports.deleteProducto = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Producto.eliminar(req.params.id);

        if (!eliminado) {
            return next(new ErrorResponse(`Producto no encontrado con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            mensaje: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar stock de un producto
// @route   PATCH /api/productos/:id/stock
// @access  Private (Admin, Dueño, Empleado)
exports.updateStock = asyncHandler(async (req, res, next) => {
    try {
        const { cantidad, tipo } = req.body;
        const nuevoStock = await Producto.actualizarStock(req.params.id, cantidad, tipo);

        res.status(200).json({
            success: true,
            mensaje: 'Stock actualizado exitosamente',
            data: { stock: nuevoStock }
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener productos por categoría
// @route   GET /api/productos/categoria/:categoria_id
// @access  Public
exports.getProductosPorCategoria = asyncHandler(async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const productos = await Producto.obtenerPorCategoria(req.params.categoria_id, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.status(200).json({
            success: true,
            count: productos.length,
            data: productos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener productos con stock bajo
// @route   GET /api/productos/stock-bajo
// @access  Private (Admin, Dueño)
exports.getProductosStockBajo = asyncHandler(async (req, res, next) => {
    try {
        const { limite = 10 } = req.query;
        const productos = await Producto.obtenerConStockBajo(parseInt(limite));

        res.status(200).json({
            success: true,
            count: productos.length,
            data: productos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Buscar productos
// @route   GET /api/productos/search
// @access  Public
exports.searchProductos = asyncHandler(async (req, res, next) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q) {
            return next(new ErrorResponse('Término de búsqueda requerido', 400));
        }

        const productos = await Producto.buscar(q, parseInt(limit));

        res.status(200).json({
            success: true,
            count: productos.length,
            data: productos
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener estadísticas de productos
// @route   GET /api/productos/stats
// @access  Private (Admin, Dueño)
exports.getStatsProductos = asyncHandler(async (req, res, next) => {
    try {
        const estadisticas = await Producto.obtenerEstadisticas();

        res.status(200).json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 