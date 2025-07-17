const CategoriaProducto = require('../models/CategoriaProducto');
const CategoriaServicio = require('../models/CategoriaServicio');
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

// ==================== CATEGORÍAS DE PRODUCTOS ====================

// @desc    Crear una nueva categoría de producto
// @route   POST /api/categorias/productos
// @access  Private (Admin, Dueño)
exports.createCategoriaProducto = asyncHandler(async (req, res, next) => {
    try {
        const categoria = await CategoriaProducto.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Categoría de producto creada exitosamente.',
            data: categoria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las categorías de productos
// @route   GET /api/categorias/productos
// @access  Public
exports.getAllCategoriasProductos = asyncHandler(async (req, res, next) => {
    try {
        const { solo_activas } = req.query;
        const opciones = {};
        
        if (solo_activas === 'false') {
            opciones.incluirProductos = true;
        }

        const categorias = await CategoriaProducto.obtenerTodas(opciones);

        res.status(200).json({
            success: true,
            count: categorias.length,
            data: categorias
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una categoría de producto por ID
// @route   GET /api/categorias/productos/:id
// @access  Public
exports.getCategoriaProductoById = asyncHandler(async (req, res, next) => {
    try {
        const categoria = await CategoriaProducto.obtenerPorId(req.params.id);

        if (!categoria) {
            return next(new ErrorResponse(`Categoría no encontrada con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: categoria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una categoría de producto
// @route   PUT /api/categorias/productos/:id
// @access  Private (Admin, Dueño)
exports.updateCategoriaProducto = asyncHandler(async (req, res, next) => {
    try {
        const categoria = await CategoriaProducto.actualizar(req.params.id, req.body);

        res.status(200).json({
            success: true,
            mensaje: 'Categoría actualizada exitosamente',
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

// @desc    Eliminar una categoría de producto
// @route   DELETE /api/categorias/productos/:id
// @access  Private (Admin, Dueño)
exports.deleteCategoriaProducto = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await CategoriaProducto.eliminar(req.params.id);

        if (!eliminado) {
            return next(new ErrorResponse(`Categoría no encontrada con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            mensaje: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        if (error.message.includes('productos asociados')) {
            next(new ErrorResponse(error.message, 400));
        } else {
            next(new ErrorResponse(error.message, 500));
        }
    }
});

// ==================== CATEGORÍAS DE SERVICIOS ====================

// @desc    Crear una nueva categoría de servicio
// @route   POST /api/categorias/servicios
// @access  Private (Admin, Dueño)
exports.createCategoriaServicio = asyncHandler(async (req, res, next) => {
    try {
        const categoria = await CategoriaServicio.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Categoría de servicio creada exitosamente.',
            data: categoria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las categorías de servicios
// @route   GET /api/categorias/servicios
// @access  Public
exports.getAllCategoriasServicios = asyncHandler(async (req, res, next) => {
    try {
        const { solo_activas } = req.query;
        const opciones = {};
        
        if (solo_activas === 'false') {
            opciones.incluirServicios = true;
        }

        const categorias = await CategoriaServicio.obtenerTodas(opciones);

        res.status(200).json({
            success: true,
            count: categorias.length,
            data: categorias
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una categoría de servicio por ID
// @route   GET /api/categorias/servicios/:id
// @access  Public
exports.getCategoriaServicioById = asyncHandler(async (req, res, next) => {
    try {
        const categoria = await CategoriaServicio.obtenerPorId(req.params.id);

        if (!categoria) {
            return next(new ErrorResponse(`Categoría no encontrada con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: categoria
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una categoría de servicio
// @route   PUT /api/categorias/servicios/:id
// @access  Private (Admin, Dueño)
exports.updateCategoriaServicio = asyncHandler(async (req, res, next) => {
    try {
        const categoria = await CategoriaServicio.actualizar(req.params.id, req.body);

        res.status(200).json({
            success: true,
            mensaje: 'Categoría actualizada exitosamente',
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

// @desc    Eliminar una categoría de servicio
// @route   DELETE /api/categorias/servicios/:id
// @access  Private (Admin, Dueño)
exports.deleteCategoriaServicio = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await CategoriaServicio.eliminar(req.params.id);

        if (!eliminado) {
            return next(new ErrorResponse(`Categoría no encontrada con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            mensaje: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        if (error.message.includes('servicios asociados')) {
            next(new ErrorResponse(error.message, 400));
        } else {
            next(new ErrorResponse(error.message, 500));
        }
    }
});

// ==================== FUNCIONES GENERALES ====================

// @desc    Obtener estadísticas de categorías
// @route   GET /api/categorias/stats
// @access  Private (Admin, Dueño)
exports.getStatsCategorias = asyncHandler(async (req, res, next) => {
    try {
        const [statsProductos, statsServicios] = await Promise.all([
            CategoriaProducto.obtenerEstadisticas(),
            CategoriaServicio.obtenerEstadisticas()
        ]);

        res.status(200).json({
            success: true,
            data: {
                categoriasProductos: statsProductos,
                categoriasServicios: statsServicios
            }
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 