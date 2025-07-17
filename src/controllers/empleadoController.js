const { Usuario, Empleado, Cliente, EmpleadoEspecialidad, EmpleadoServicio, HorarioEmpleado, AusenciaEmpleado, Especialidad, Servicio, Rol } = require('../models');
const asyncHandler = require('../middleware/asyncHandler');
// const { errorHandler } = require('./middleware/errorHandler');
// Local ErrorResponse class to replace missing '../utils/errorResponse'
class ErrorResponse extends Error {
    constructor(message, statusCode, errors = null) {
        super(message);
        this.statusCode = statusCode;
        if (errors) this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
// Remover esta línea: const { Op } = require('sequelize');


// @desc    Obtener el perfil completo de un empleado
const getEmpleadoCompleto = async (empleadoId) => {
    return await Empleado.findByPk(empleadoId, {
        include: [
            {
                model: Usuario,
                as: 'usuario',
                attributes: { exclude: ['password'] }
            },
            {
                model: Especialidad,
                as: 'especialidades',
                through: { attributes: [] } 
            },
            {
                model: Servicio,
                as: 'servicios',
                through: { attributes: [] }
            },
            {
                model: HorarioEmpleado,
                as: 'horarios'
            },
            {
                model: AusenciaEmpleado,
                as: 'ausencias'
            }
        ]
    });
};

// @desc    Crear un nuevo empleado
// @route   POST /api/empleados
// @access  Private (Admin, Dueño)
exports.createEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const empleado = await Empleado.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Empleado creado exitosamente.',
            data: empleado
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todos los empleados
// @route   GET /api/empleados
// @access  Private (Admin, Dueño, Empleado)
exports.getAllEmpleados = asyncHandler(async (req, res, next) => {
    const empleados = await Empleado.obtenerTodos(req.query);
    res.status(200).json({
        success: true,
        count: empleados.length,
        data: empleados
    });
});

// @desc    Obtener un empleado por ID
// @route   GET /api/empleados/:id
// @access  Private (Admin, Dueño, Empleado)
exports.getEmpleadoById = asyncHandler(async (req, res, next) => {
    try {
        const empleado = await Empleado.obtenerPorId(req.params.id);
        if (!empleado) {
            return next(new ErrorResponse(`Empleado no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: empleado
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar un empleado
// @route   PUT /api/empleados/:id
// @access  Private (Admin, Dueño)
exports.updateEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const empleado = await Empleado.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Empleado actualizado exitosamente',
            data: empleado
        });
    } catch (error) {
        if (error.message.includes('no encontrado')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar un empleado
// @route   DELETE /api/empleados/:id
// @access  Private (Admin, Dueño)
exports.deleteEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Empleado.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Empleado no encontrado con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Empleado eliminado exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener empleados por especialidad
// @route   GET /api/empleados/especialidad/:especialidad_id
// @access  Public
exports.getEmpleadosPorEspecialidad = asyncHandler(async (req, res, next) => {
    try {
        const empleados = await Empleado.obtenerPorEspecialidad(req.params.especialidad_id);
        res.status(200).json({
            success: true,
            count: empleados.length,
            data: empleados
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener empleados por servicio
// @route   GET /api/empleados/servicio/:servicio_id
// @access  Public
exports.getEmpleadosPorServicio = asyncHandler(async (req, res, next) => {
    try {
        const empleados = await Empleado.obtenerPorServicio(req.params.servicio_id);
        res.status(200).json({
            success: true,
            count: empleados.length,
            data: empleados
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener horarios de un empleado
// @route   GET /api/empleados/:id/horarios
// @access  Private (Admin, Dueño, Empleado)
exports.getHorariosEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const horarios = await HorarioEmpleado.obtenerPorEmpleado(req.params.id);
        res.status(200).json({
            success: true,
            count: horarios.length,
            data: horarios
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener ausencias de un empleado
// @route   GET /api/empleados/:id/ausencias
// @access  Private (Admin, Dueño, Empleado)
exports.getAusenciasEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const ausencias = await AusenciaEmpleado.obtenerPorEmpleado(req.params.id);
        res.status(200).json({
            success: true,
            count: ausencias.length,
            data: ausencias
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener especialidades de un empleado
// @route   GET /api/empleados/:id/especialidades
// @access  Public
exports.getEspecialidadesEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const especialidades = await EmpleadoEspecialidad.obtenerPorEmpleado(req.params.id);
        res.status(200).json({
            success: true,
            count: especialidades.length,
            data: especialidades
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener servicios de un empleado
// @route   GET /api/empleados/:id/servicios
// @access  Public
exports.getServiciosEmpleado = asyncHandler(async (req, res, next) => {
    try {
        const servicios = await EmpleadoServicio.obtenerPorEmpleado(req.params.id);
        res.status(200).json({
            success: true,
            count: servicios.length,
            data: servicios
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// --- Especialidades ---
// @desc    Asignar/Actualizar especialidades a un empleado
// @route   POST /api/empleados/:id/especialidades
// @access  Private (Admin, Dueño)
exports.manageEspecialidades = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { especialidades } = req.body; // Array de IDs

    const empleado = await Empleado.findByPk(id);
    if (!empleado) {
        return next(new ErrorResponse(`Empleado no encontrado con id ${id}`, 404));
    }

    if (!Array.isArray(especialidades)) {
        return next(new ErrorResponse('El campo especialidades debe ser un array de IDs.', 400));
    }

    const especialidadesData = especialidades.map(espId => ({ empleado_id: id, especialidad_id: espId }));

    const t = await sequelize.transaction();
    try {
        // Limpiar especialidades anteriores
        await EmpleadoEspecialidad.destroy({ where: { empleado_id: id }, transaction: t });
        // Insertar las nuevas
        await EmpleadoEspecialidad.bulkCreate(especialidadesData, { transaction: t });
        
        await t.commit();
        
        const empleadoActualizado = await getEmpleadoCompleto(id);
        res.status(200).json({ success: true, data: empleadoActualizado.especialidades });
    } catch (error) {
        await t.rollback();
        next(new ErrorResponse('No se pudieron actualizar las especialidades.', 500));
    }
});


// --- Servicios ---
// @desc    Asignar/Actualizar servicios a un empleado
// @route   POST /api/empleados/:id/servicios
// @access  Private (Admin, Dueño)
exports.manageServicios = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { servicios } = req.body; // Array de IDs

    const empleado = await Empleado.findByPk(id);
    if (!empleado) {
        return next(new ErrorResponse(`Empleado no encontrado con id ${id}`, 404));
    }
    
    if (!Array.isArray(servicios)) {
        return next(new ErrorResponse('El campo servicios debe ser un array de IDs.', 400));
    }

    const serviciosData = servicios.map(srvId => ({ empleado_id: id, servicio_id: srvId }));

    const t = await sequelize.transaction();
    try {
        // Limpiar servicios anteriores
        await EmpleadoServicio.destroy({ where: { empleado_id: id }, transaction: t });
        // Insertar los nuevos
        await EmpleadoServicio.bulkCreate(serviciosData, { transaction: t });
        
        await t.commit();

        const empleadoActualizado = await getEmpleadoCompleto(id);
        res.status(200).json({ success: true, data: empleadoActualizado.servicios });
    } catch (error) {
        await t.rollback();
        next(new ErrorResponse('No se pudieron actualizar los servicios.', 500));
    }
});


// --- Horarios ---
// @desc    Crear o actualizar el horario de un empleado
// @route   POST /api/empleados/:id/horarios
// @access  Private (Admin, Dueño)
exports.upsertHorarioEmpleado = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { horarios } = req.body; // Array de objetos { dia_semana, hora_inicio, hora_fin, es_descanso }

    if (!await Empleado.findByPk(id)) {
        return next(new ErrorResponse(`Empleado no encontrado con id ${id}`, 404));
    }
    
    if (!Array.isArray(horarios)) {
        return next(new ErrorResponse('El campo horarios debe ser un array.', 400));
    }

    const horariosData = horarios.map(h => ({ ...h, empleado_id: id }));

    const t = await sequelize.transaction();
    try {
        await HorarioEmpleado.destroy({ where: { empleado_id: id }, transaction: t });
        await HorarioEmpleado.bulkCreate(horariosData, { transaction: t });
        await t.commit();

        const data = await HorarioEmpleado.findAll({ where: { empleado_id: id }});
        res.status(200).json({ success: true, data });
    } catch (error) {
        await t.rollback();
        next(new ErrorResponse('No se pudo actualizar el horario.', 500, error.errors));
    }
});


// --- Ausencias ---
// @desc    Registrar una nueva ausencia para un empleado
// @route   POST /api/empleados/:id/ausencias
// @access  Private (Admin, Dueño)
exports.addAusenciaEmpleado = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    req.body.empleado_id = id;

    if (!await Empleado.findByPk(id)) {
        return next(new ErrorResponse(`Empleado no encontrado con id ${id}`, 404));
    }

    const ausencia = await AusenciaEmpleado.create(req.body);

    res.status(201).json({
        success: true,
        data: ausencia
    });
});

// @desc    Actualizar una ausencia
// @route   PUT /api/empleados/:id/ausencias/:ausenciaId
// @access  Private (Admin, Dueño)
exports.updateAusenciaEmpleado = asyncHandler(async (req, res, next) => {
    let ausencia = await AusenciaEmpleado.findByPk(req.params.ausenciaId);
    if (!ausencia) {
        return next(new ErrorResponse(`Ausencia no encontrada con id ${req.params.ausenciaId}`, 404));
    }

    ausencia = await ausencia.update(req.body);

    res.status(200).json({
        success: true,
        data: ausencia
    });
});

// @desc    Eliminar una ausencia
// @route   DELETE /api/empleados/:id/ausencias/:ausenciaId
// @access  Private (Admin, Dueño)
exports.deleteAusenciaEmpleado = asyncHandler(async (req, res, next) => {
    const ausencia = await AusenciaEmpleado.findByPk(req.params.ausenciaId);
    if (!ausencia) {
        return next(new ErrorResponse(`Ausencia no encontrada con id ${req.params.ausenciaId}`, 404));
    }
    
    await ausencia.destroy();

    res.status(200).json({ success: true, data: {} });
});
