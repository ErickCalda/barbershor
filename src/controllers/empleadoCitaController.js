const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { query } = require('../config/database');
const Cita = require('../models/Cita');
const AusenciaEmpleado = require('../models/AusenciaEmpleado');

/**
 * @desc    Obtener citas del empleado autenticado
 * @route   GET /api/empleado/citas
 * @access  Private (Empleado)
 */
exports.getMisCitas = asyncHandler(async (req, res, next) => {
  try {
    const empleado_id = req.usuario.empleado_id;
    
    if (!empleado_id) {
      return next(new ErrorResponse('Usuario no es un empleado válido', 400));
    }
    
    const citas = await Cita.obtenerPorEmpleado(empleado_id, req.query);
    
    res.status(200).json({
      success: true,
      count: citas.length,
      data: citas
    });
  } catch (error) {
    console.error('❌ [empleadoCitaController.getMisCitas] Error:', error);
    next(new ErrorResponse('Error al obtener citas', 500));
  }
});

/**
 * @desc    Obtener citas de hoy del empleado
 * @route   GET /api/empleado/citas/hoy
 * @access  Private (Empleado)
 */
exports.getCitasHoy = asyncHandler(async (req, res, next) => {
  try {
    const empleado_id = req.usuario.empleado_id;
    
    if (!empleado_id) {
      return next(new ErrorResponse('Usuario no es un empleado válido', 400));
    }
    
    const sql = `
      SELECT c.*, 
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.telefono as cliente_telefono,
             ec.nombre as estado_nombre,
             ec.color as estado_color,
             GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
      FROM citas c
      INNER JOIN clientes cl ON c.cliente_id = cl.id
      INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      INNER JOIN estados_citas ec ON c.estado_id = ec.id
      LEFT JOIN cita_servicio cs ON c.id = cs.cita_id
      LEFT JOIN servicios s ON cs.servicio_id = s.id
      WHERE c.empleado_id = ? AND DATE(c.fecha_hora_inicio) = CURDATE()
      GROUP BY c.id
      ORDER BY c.fecha_hora_inicio
    `;
    
    const citas = await query(sql, [empleado_id]);
    
    res.status(200).json({
      success: true,
      count: citas.length,
      data: citas
    });
  } catch (error) {
    console.error('❌ [empleadoCitaController.getCitasHoy] Error:', error);
    next(new ErrorResponse('Error al obtener citas de hoy', 500));
  }
});

/**
 * @desc    Obtener citas próximas del empleado
 * @route   GET /api/empleado/citas/proximas
 * @access  Private (Empleado)
 */
exports.getCitasProximas = asyncHandler(async (req, res, next) => {
  try {
    const empleado_id = req.usuario.empleado_id;
    const { dias = 7 } = req.query;
    
    if (!empleado_id) {
      return next(new ErrorResponse('Usuario no es un empleado válido', 400));
    }
    
    const sql = `
      SELECT c.*, 
             CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
             u_cliente.telefono as cliente_telefono,
             ec.nombre as estado_nombre,
             ec.color as estado_color,
             GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
      FROM citas c
      INNER JOIN clientes cl ON c.cliente_id = cl.id
      INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
      INNER JOIN estados_citas ec ON c.estado_id = ec.id
      LEFT JOIN cita_servicio cs ON c.id = cs.cita_id
      LEFT JOIN servicios s ON cs.servicio_id = s.id
      WHERE c.empleado_id = ? 
        AND c.fecha_hora_inicio BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
        AND c.estado_id NOT IN (SELECT id FROM estados_citas WHERE nombre IN ('Cancelada', 'No asistió'))
      GROUP BY c.id
      ORDER BY c.fecha_hora_inicio
    `;
    
    const citas = await query(sql, [empleado_id, dias]);
    
    res.status(200).json({
      success: true,
      count: citas.length,
      data: citas
    });
  } catch (error) {
    console.error('❌ [empleadoCitaController.getCitasProximas] Error:', error);
    next(new ErrorResponse('Error al obtener citas próximas', 500));
  }
});

/**
 * @desc    Solicitar ausencia
 * @route   POST /api/empleado/ausencias
 * @access  Private (Empleado)
 */
exports.solicitarAusencia = asyncHandler(async (req, res, next) => {
  try {
    const empleado_id = req.usuario.empleado_id;
    const { fecha_inicio, fecha_fin, motivo, tipo_ausencia } = req.body;
    
    if (!empleado_id) {
      return next(new ErrorResponse('Usuario no es un empleado válido', 400));
    }
    
    // Validaciones
    if (!fecha_inicio || !fecha_fin || !motivo) {
      return next(new ErrorResponse('fecha_inicio, fecha_fin y motivo son requeridos', 400));
    }
    
    // Verificar que las fechas sean válidas
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (inicio < hoy) {
      return next(new ErrorResponse('No se pueden solicitar ausencias en fechas pasadas', 400));
    }
    
    if (fin < inicio) {
      return next(new ErrorResponse('La fecha de fin debe ser posterior a la fecha de inicio', 400));
    }
    
    // Verificar que no haya citas en ese período
    const citasSql = `
      SELECT COUNT(*) as total_citas
      FROM citas
      WHERE empleado_id = ? 
        AND fecha_hora_inicio BETWEEN ? AND ?
        AND estado_id NOT IN (SELECT id FROM estados_citas WHERE nombre IN ('Cancelada', 'No asistió'))
    `;
    
    const [citasExistentes] = await query(citasSql, [empleado_id, fecha_inicio, fecha_fin]);
    
    if (citasExistentes.total_citas > 0) {
      return next(new ErrorResponse('No se puede solicitar ausencia porque tienes citas agendadas en ese período', 400));
    }
    
    // Crear la solicitud de ausencia
    const ausenciaSql = `
      INSERT INTO ausencias_empleados (empleado_id, fecha_inicio, fecha_fin, motivo, tipo_ausencia, estado, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pendiente', NOW(), NOW())
    `;
    
    const result = await query(ausenciaSql, [empleado_id, fecha_inicio, fecha_fin, motivo, tipo_ausencia || 'personal']);
    
    res.status(201).json({
      success: true,
      message: 'Solicitud de ausencia enviada exitosamente',
      data: {
        id: result.insertId,
        fecha_inicio,
        fecha_fin,
        motivo,
        tipo_ausencia: tipo_ausencia || 'personal',
        estado: 'pendiente'
      }
    });
    
  } catch (error) {
    console.error('❌ [empleadoCitaController.solicitarAusencia] Error:', error);
    next(new ErrorResponse('Error al solicitar ausencia', 500));
  }
});

/**
 * @desc    Obtener ausencias del empleado
 * @route   GET /api/empleado/ausencias
 * @access  Private (Empleado)
 */
exports.getMisAusencias = asyncHandler(async (req, res, next) => {
  try {
    const empleado_id = req.usuario.empleado_id;
    
    if (!empleado_id) {
      return next(new ErrorResponse('Usuario no es un empleado válido', 400));
    }
    
    const ausencias = await AusenciaEmpleado.obtenerPorEmpleado(empleado_id, req.query);
    
    res.status(200).json({
      success: true,
      count: ausencias.length,
      data: ausencias
    });
  } catch (error) {
    console.error('❌ [empleadoCitaController.getMisAusencias] Error:', error);
    next(new ErrorResponse('Error al obtener ausencias', 500));
  }
});

/**
 * @desc    Cancelar solicitud de ausencia
 * @route   PUT /api/empleado/ausencias/:id/cancelar
 * @access  Private (Empleado)
 */
exports.cancelarAusencia = asyncHandler(async (req, res, next) => {
  try {
    const ausencia_id = req.params.id;
    const empleado_id = req.usuario.empleado_id;
    
    if (!empleado_id) {
      return next(new ErrorResponse('Usuario no es un empleado válido', 400));
    }
    
    // Verificar que la ausencia pertenece al empleado
    const ausenciaSql = `
      SELECT * FROM ausencias_empleados 
      WHERE id = ? AND empleado_id = ?
    `;
    
    const [ausencia] = await query(ausenciaSql, [ausencia_id, empleado_id]);
    
    if (!ausencia) {
      return next(new ErrorResponse('Ausencia no encontrada', 404));
    }
    
    // Verificar que se puede cancelar
    if (ausencia.estado !== 'pendiente') {
      return next(new ErrorResponse('Solo se pueden cancelar solicitudes pendientes', 400));
    }
    
    // Actualizar estado
    const actualizarSql = `
      UPDATE ausencias_empleados 
      SET estado = 'cancelada', updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(actualizarSql, [ausencia_id]);
    
    res.status(200).json({
      success: true,
      message: 'Solicitud de ausencia cancelada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ [empleadoCitaController.cancelarAusencia] Error:', error);
    next(new ErrorResponse('Error al cancelar ausencia', 500));
  }
});

/**
 * @desc    Obtener estadísticas del empleado
 * @route   GET /api/empleado/estadisticas
 * @access  Private (Empleado)
 */
exports.getEstadisticas = asyncHandler(async (req, res, next) => {
  try {
    const empleado_id = req.usuario.empleado_id;
    const { periodo = 'mes' } = req.query;
    
    if (!empleado_id) {
      return next(new ErrorResponse('Usuario no es un empleado válido', 400));
    }
    
    let fechaFiltro = '';
    switch (periodo) {
      case 'semana':
        fechaFiltro = 'AND c.fecha_hora_inicio >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
        break;
      case 'dia':
        fechaFiltro = 'AND DATE(c.fecha_hora_inicio) = CURDATE()';
        break;
      default: // mes
        fechaFiltro = 'AND c.fecha_hora_inicio >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
    }
    
    // Estadísticas de citas
    const estadisticasSql = `
      SELECT 
        COUNT(*) as total_citas,
        COUNT(CASE WHEN c.estado_id IN (SELECT id FROM estados_citas WHERE nombre = 'Completada') THEN 1 END) as citas_completadas,
        COUNT(CASE WHEN c.estado_id IN (SELECT id FROM estados_citas WHERE nombre = 'Cancelada') THEN 1 END) as citas_canceladas,
        COUNT(CASE WHEN c.estado_id IN (SELECT id FROM estados_citas WHERE nombre = 'No asistió') THEN 1 END) as citas_no_asistio,
        SUM(c.precio_total) as ingresos_totales
      FROM citas c
      WHERE c.empleado_id = ? ${fechaFiltro}
    `;
    
    const [estadisticas] = await query(estadisticasSql, [empleado_id]);
    
    // Citas de hoy
    const citasHoySql = `
      SELECT COUNT(*) as citas_hoy
      FROM citas
      WHERE empleado_id = ? AND DATE(fecha_hora_inicio) = CURDATE()
        AND estado_id NOT IN (SELECT id FROM estados_citas WHERE nombre IN ('Cancelada', 'No asistió'))
    `;
    
    const [citasHoy] = await query(citasHoySql, [empleado_id]);
    
    // Próximas citas
    const proximasCitasSql = `
      SELECT COUNT(*) as proximas_citas
      FROM citas
      WHERE empleado_id = ? 
        AND fecha_hora_inicio BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND estado_id NOT IN (SELECT id FROM estados_citas WHERE nombre IN ('Cancelada', 'No asistió'))
    `;
    
    const [proximasCitas] = await query(proximasCitasSql, [empleado_id]);
    
    res.status(200).json({
      success: true,
      data: {
        periodo,
        total_citas: estadisticas.total_citas || 0,
        citas_completadas: estadisticas.citas_completadas || 0,
        citas_canceladas: estadisticas.citas_canceladas || 0,
        citas_no_asistio: estadisticas.citas_no_asistio || 0,
        ingresos_totales: estadisticas.ingresos_totales || 0,
        citas_hoy: citasHoy.citas_hoy || 0,
        proximas_citas: proximasCitas.proximas_citas || 0
      }
    });
    
  } catch (error) {
    console.error('❌ [empleadoCitaController.getEstadisticas] Error:', error);
    next(new ErrorResponse('Error al obtener estadísticas', 500));
  }
});

/**
 * @desc    Obtener información del empleado
 * @route   GET /api/empleado-citas/info
 * @access  Private (Empleado)
 */
exports.getInfoEmpleado = asyncHandler(async (req, res, next) => {
  try {
    const empleado_id = req.usuario.empleado_id;
    
    if (!empleado_id) {
      return next(new ErrorResponse('Usuario no es un empleado válido', 400));
    }
    
    const sql = `
      SELECT 
        e.id,
        e.nombre,
        e.apellido,
        e.email,
        e.telefono,
        e.experiencia,
        e.activo,
        GROUP_CONCAT(esp.nombre SEPARATOR ', ') as especialidades
      FROM empleados e
      LEFT JOIN empleados_especialidades ee ON e.id = ee.empleado_id
      LEFT JOIN especialidades esp ON ee.especialidad_id = esp.id
      WHERE e.id = ?
      GROUP BY e.id
    `;
    
    const [empleado] = await query(sql, [empleado_id]);
    
    if (!empleado) {
      return next(new ErrorResponse('Empleado no encontrado', 404));
    }
    
    res.status(200).json({
      success: true,
      data: {
        empleado: {
          id: empleado.id,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          email: empleado.email,
          telefono: empleado.telefono,
          experiencia: empleado.experiencia,
          activo: empleado.activo,
          especialidades: empleado.especialidades ? empleado.especialidades.split(', ') : []
        }
      }
    });
    
  } catch (error) {
    console.error('❌ [empleadoCitaController.getInfoEmpleado] Error:', error);
    next(new ErrorResponse('Error al obtener información del empleado', 500));
  }
}); 