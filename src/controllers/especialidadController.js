const Especialidad = require('../models/Especialidad');
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

// @desc    Crear una nueva especialidad
// @route   POST /api/especialidades
// @access  Private (Admin, Dueño)
exports.createEspecialidad = asyncHandler(async (req, res, next) => {
    try {
        const especialidad = await Especialidad.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Especialidad creada exitosamente.',
            data: especialidad
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las especialidades
// @route   GET /api/especialidades
// @access  Public
exports.getAllEspecialidades = asyncHandler(async (req, res, next) => {
    try {
        const { solo_activas } = req.query;
        const opciones = {};
        
        if (solo_activas === 'false') {
            opciones.incluirEmpleados = true;
        }

        const especialidades = await Especialidad.obtenerTodas(opciones);

        res.status(200).json({
            success: true,
            count: especialidades.length,
            data: especialidades
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una especialidad por ID
// @route   GET /api/especialidades/:id
// @access  Public
exports.getEspecialidadById = asyncHandler(async (req, res, next) => {
    try {
        const especialidad = await Especialidad.obtenerPorId(req.params.id);

        if (!especialidad) {
            return next(new ErrorResponse(`Especialidad no encontrada con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: especialidad
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una especialidad
// @route   PUT /api/especialidades/:id
// @access  Private (Admin, Dueño)
exports.updateEspecialidad = asyncHandler(async (req, res, next) => {
    try {
        const especialidad = await Especialidad.actualizar(req.params.id, req.body);

        res.status(200).json({
            success: true,
            mensaje: 'Especialidad actualizada exitosamente',
            data: especialidad
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una especialidad
// @route   DELETE /api/especialidades/:id
// @access  Private (Admin, Dueño)
exports.deleteEspecialidad = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Especialidad.eliminar(req.params.id);

        if (!eliminado) {
            return next(new ErrorResponse(`Especialidad no encontrada con el id ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            mensaje: 'Especialidad eliminada exitosamente'
        });
    } catch (error) {
        if (error.message.includes('empleados asociados')) {
            next(new ErrorResponse(error.message, 400));
        } else {
            next(new ErrorResponse(error.message, 500));
        }
    }
});

// @desc    Asignar especialidad a empleado
// @route   POST /api/especialidades/:id/empleados
// @access  Private (Admin, Dueño)
exports.asignarEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const { empleado_id, nivel = 'Intermedio' } = req.body;
        
        await Especialidad.asignarAEmpleado(empleado_id, req.params.id, nivel);

        res.status(201).json({
            success: true,
            mensaje: 'Especialidad asignada al empleado exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Remover especialidad de empleado
// @route   DELETE /api/especialidades/:id/empleados/:empleado_id
// @access  Private (Admin, Dueño)
exports.removerEmpleado = asyncHandler(async (req, res, next) => {
    try {
        await Especialidad.removerDeEmpleado(req.params.empleado_id, req.params.id);

        res.status(200).json({
            success: true,
            mensaje: 'Especialidad removida del empleado exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener empleados por especialidad
// @route   GET /api/especialidades/:id/empleados
// @access  Public
exports.getEmpleadosPorEspecialidad = asyncHandler(async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const empleados = await Especialidad.obtenerEmpleadosPorEspecialidad(req.params.id, {
            orden: 'nombre'
        });

        // Aplicar paginación manual
        const totalEmpleados = empleados.length;
        const empleadosPaginados = empleados.slice(offset, offset + parseInt(limit));

        res.status(200).json({
            success: true,
            count: totalEmpleados,
            totalPages: Math.ceil(totalEmpleados / limit),
            currentPage: parseInt(page),
            data: empleadosPaginados
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Buscar especialidades
// @route   GET /api/especialidades/search
// @access  Public
exports.searchEspecialidades = asyncHandler(async (req, res, next) => {
    try {
        const { q, limit = 20 } = req.query;

        if (!q) {
            return next(new ErrorResponse('Término de búsqueda requerido', 400));
        }

        const especialidades = await Especialidad.buscar(q);

        // Aplicar límite manual
        const especialidadesLimitadas = especialidades.slice(0, parseInt(limit));

        res.status(200).json({
            success: true,
            count: especialidadesLimitadas.length,
            data: especialidadesLimitadas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener estadísticas de especialidades
// @route   GET /api/especialidades/stats
// @access  Private (Admin, Dueño)
exports.getStatsEspecialidades = asyncHandler(async (req, res, next) => {
    try {
        const estadisticas = await Especialidad.obtenerEstadisticas();

        res.status(200).json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
}); 