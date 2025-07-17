const Notificacion = require('../models/Notificacion');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const notificacionService = require('../services/notificacionService');
const { query } = require('../config/database');

// @desc    Crear una nueva notificación
// @route   POST /api/notificaciones
// @access  Private (Admin, Dueño, Empleado)
exports.createNotificacion = asyncHandler(async (req, res, next) => {
    try {
        const notificacion = await Notificacion.crear(req.body);
        res.status(201).json({
            success: true,
            mensaje: 'Notificación creada exitosamente.',
            data: notificacion
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 400));
    }
});

// @desc    Obtener todas las notificaciones
// @route   GET /api/notificaciones
// @access  Private (Admin, Dueño, Empleado)
exports.getAllNotificaciones = asyncHandler(async (req, res, next) => {
    try {
        const notificaciones = await Notificacion.obtenerTodas(req.query);
        res.status(200).json({
            success: true,
            count: notificaciones.length,
            data: notificaciones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener una notificación por ID
// @route   GET /api/notificaciones/:id
// @access  Private (Admin, Dueño, Empleado)
exports.getNotificacionById = asyncHandler(async (req, res, next) => {
    try {
        const notificacion = await Notificacion.obtenerPorId(req.params.id);
        if (!notificacion) {
            return next(new ErrorResponse(`Notificación no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            data: notificacion
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Actualizar una notificación
// @route   PUT /api/notificaciones/:id
// @access  Private (Admin, Dueño, Empleado)
exports.updateNotificacion = asyncHandler(async (req, res, next) => {
    try {
        const notificacion = await Notificacion.actualizar(req.params.id, req.body);
        res.status(200).json({
            success: true,
            mensaje: 'Notificación actualizada exitosamente',
            data: notificacion
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Eliminar una notificación
// @route   DELETE /api/notificaciones/:id
// @access  Private (Admin, Dueño)
exports.deleteNotificacion = asyncHandler(async (req, res, next) => {
    try {
        const eliminado = await Notificacion.eliminar(req.params.id);
        if (!eliminado) {
            return next(new ErrorResponse(`Notificación no encontrada con el id ${req.params.id}`, 404));
        }
        res.status(200).json({
            success: true,
            mensaje: 'Notificación eliminada exitosamente'
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener notificaciones por usuario
// @route   GET /api/notificaciones/usuario/:usuario_id
// @access  Private (Admin, Dueño, Empleado)
exports.getNotificacionesPorUsuario = asyncHandler(async (req, res, next) => {
    try {
        const notificaciones = await Notificacion.obtenerPorUsuario(req.params.usuario_id);
        res.status(200).json({
            success: true,
            count: notificaciones.length,
            data: notificaciones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener notificaciones por tipo
// @route   GET /api/notificaciones/tipo/:tipo
// @access  Private (Admin, Dueño, Empleado)
exports.getNotificacionesPorTipo = asyncHandler(async (req, res, next) => {
    try {
        const notificaciones = await Notificacion.obtenerPorTipo(req.params.tipo);
        res.status(200).json({
            success: true,
            count: notificaciones.length,
            data: notificaciones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener notificaciones no leídas
// @route   GET /api/notificaciones/no-leidas
// @access  Private (Admin, Dueño, Empleado)
exports.getNotificacionesNoLeidas = asyncHandler(async (req, res, next) => {
    try {
        const { usuario_id } = req.query;
        const notificaciones = await Notificacion.obtenerNoLeidas(usuario_id);
        res.status(200).json({
            success: true,
            count: notificaciones.length,
            data: notificaciones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Marcar notificación como leída
// @route   PATCH /api/notificaciones/:id/leer
// @access  Private (Admin, Dueño, Empleado)
exports.marcarComoLeida = asyncHandler(async (req, res, next) => {
    try {
        const notificacion = await Notificacion.marcarComoLeida(req.params.id);
        res.status(200).json({
            success: true,
            mensaje: 'Notificación marcada como leída',
            data: notificacion
        });
    } catch (error) {
        if (error.message.includes('no encontrada')) {
            next(new ErrorResponse(error.message, 404));
        } else {
            next(new ErrorResponse(error.message, 400));
        }
    }
});

// @desc    Marcar todas las notificaciones como leídas
// @route   PATCH /api/notificaciones/leer-todas
// @access  Private (Admin, Dueño, Empleado)
exports.marcarTodasComoLeidas = asyncHandler(async (req, res, next) => {
    try {
        const { usuario_id } = req.body;
        const resultado = await Notificacion.marcarTodasComoLeidas(usuario_id);
        res.status(200).json({
            success: true,
            mensaje: 'Todas las notificaciones marcadas como leídas',
            data: resultado
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Obtener notificaciones por fecha
// @route   GET /api/notificaciones/fecha/:fecha
// @access  Private (Admin, Dueño, Empleado)
exports.getNotificacionesPorFecha = asyncHandler(async (req, res, next) => {
    try {
        const notificaciones = await Notificacion.obtenerPorFecha(req.params.fecha);
        res.status(200).json({
            success: true,
            count: notificaciones.length,
            data: notificaciones
        });
    } catch (error) {
        next(new ErrorResponse(error.message, 500));
    }
});

// @desc    Enviar recordatorio manual para una cita
// @route   POST /api/notificaciones/recordatorio/:citaId
// @access  Private
exports.enviarRecordatorioManual = asyncHandler(async (req, res, next) => {
  try {
    const { citaId } = req.params;
    
    console.log('🔔 [notificacionController.enviarRecordatorioManual] Enviando recordatorio manual para cita:', citaId);
    
    // Verificar que la cita existe
    const citaSql = 'SELECT id FROM citas WHERE id = ?';
    const [cita] = await query(citaSql, [citaId]);
    
    if (!cita) {
      return next(new ErrorResponse('Cita no encontrada', 404));
    }
    
    // Enviar recordatorio
    await notificacionService.enviarNotificacionesRecordatorio(citaId);
    
    // Marcar recordatorio como enviado
    await query('UPDATE citas SET recordatorio_enviado = 1 WHERE id = ?', [citaId]);
    
    res.status(200).json({
      success: true,
      message: 'Recordatorio enviado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ [notificacionController.enviarRecordatorioManual] Error:', error);
    return next(new ErrorResponse('Error al enviar recordatorio', 500));
  }
});

// @desc    Reenviar confirmación de cita
// @route   POST /api/notificaciones/confirmacion/:citaId
// @access  Private
exports.reenviarConfirmacion = asyncHandler(async (req, res, next) => {
  try {
    const { citaId } = req.params;
    
    console.log('🔔 [notificacionController.reenviarConfirmacion] Reenviando confirmación para cita:', citaId);
    
    // Verificar que la cita existe
    const citaSql = 'SELECT id FROM citas WHERE id = ?';
    const [cita] = await query(citaSql, [citaId]);
    
    if (!cita) {
      return next(new ErrorResponse('Cita no encontrada', 404));
    }
    
    // Reenviar confirmación
    await notificacionService.enviarNotificacionesConfirmacion(citaId);
    
    res.status(200).json({
      success: true,
      message: 'Confirmación reenviada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ [notificacionController.reenviarConfirmacion] Error:', error);
    return next(new ErrorResponse('Error al reenviar confirmación', 500));
  }
});

// @desc    Programar recordatorios automáticos
// @route   POST /api/notificaciones/programar-recordatorios
// @access  Private
exports.programarRecordatorios = asyncHandler(async (req, res, next) => {
  try {
    console.log('⏰ [notificacionController.programarRecordatorios] Iniciando programación de recordatorios');
    
    await notificacionService.programarRecordatorios();
    
    res.status(200).json({
      success: true,
      message: 'Recordatorios programados exitosamente'
    });
    
  } catch (error) {
    console.error('❌ [notificacionController.programarRecordatorios] Error:', error);
    return next(new ErrorResponse('Error al programar recordatorios', 500));
  }
});

// @desc    Obtener historial de notificaciones
// @route   GET /api/notificaciones/historial
// @access  Private
exports.getHistorialNotificaciones = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tipo } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    
    if (tipo) {
      whereClause = 'WHERE tipo = ?';
      params.push(tipo);
    }
    
    const sql = `
      SELECT 
        n.*,
        CONCAT(u.nombre, ' ', u.apellido) as usuario_nombre,
        c.id as cita_id,
        CONCAT(cl.nombre, ' ', cl.apellido) as cliente_nombre
      FROM notificaciones n
      LEFT JOIN usuarios u ON n.usuario_id = u.id
      LEFT JOIN citas c ON n.cita_id = c.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limit), offset);
    
    const notificaciones = await query(sql, params);
    
    // Contar total
    const countSql = `
      SELECT COUNT(*) as total
      FROM notificaciones n
      ${whereClause}
    `;
    
    const [countResult] = await query(countSql, tipo ? [tipo] : []);
    const total = countResult.total;
    
    res.status(200).json({
      success: true,
      count: notificaciones.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      data: notificaciones
    });
    
  } catch (error) {
    console.error('❌ [notificacionController.getHistorialNotificaciones] Error:', error);
    return next(new ErrorResponse('Error al obtener historial de notificaciones', 500));
  }
});

// @desc    Actualizar configuración de notificaciones del usuario
// @route   PUT /api/notificaciones/configuracion
// @access  Private
exports.actualizarConfiguracionNotificaciones = asyncHandler(async (req, res, next) => {
  try {
    const { 
      notificacion_correo, 
      notificacion_push, 
      notificacion_sms, 
      recordatorio_horas_antes 
    } = req.body;
    
    const usuarioId = req.usuario.id;
    
    const sql = `
      UPDATE usuarios 
      SET 
        notificacion_correo = ?,
        notificacion_push = ?,
        notificacion_sms = ?,
        recordatorio_horas_antes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(sql, [
      notificacion_correo || 0,
      notificacion_push || 0,
      notificacion_sms || 0,
      recordatorio_horas_antes || 24,
      usuarioId
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Configuración de notificaciones actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ [notificacionController.actualizarConfiguracionNotificaciones] Error:', error);
    return next(new ErrorResponse('Error al actualizar configuración', 500));
  }
});

// @desc    Obtener configuración de notificaciones del usuario
// @route   GET /api/notificaciones/configuracion
// @access  Private
exports.getConfiguracionNotificaciones = asyncHandler(async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;
    
    const sql = `
      SELECT 
        notificacion_correo,
        notificacion_push,
        notificacion_sms,
        recordatorio_horas_antes
      FROM usuarios 
      WHERE id = ?
    `;
    
    const [configuracion] = await query(sql, [usuarioId]);
    
    if (!configuracion) {
      return next(new ErrorResponse('Usuario no encontrado', 404));
    }
    
    res.status(200).json({
      success: true,
      data: configuracion
    });
    
  } catch (error) {
    console.error('❌ [notificacionController.getConfiguracionNotificaciones] Error:', error);
    return next(new ErrorResponse('Error al obtener configuración', 500));
  }
});

// @desc    Registrar token FCM de dispositivo
// @route   POST /api/notificaciones/registrar-token
// @access  Private
exports.registrarTokenFCM = asyncHandler(async (req, res, next) => {
  try {
    const { token_dispositivo, plataforma } = req.body;
    const usuarioId = req.user.id;

    if (!token_dispositivo) {
      return next(new ErrorResponse('Token de dispositivo es requerido', 400));
    }

    console.log('📱 [notificacionController.registrarTokenFCM] Registrando token para usuario:', usuarioId);

    // Verificar si ya existe un token para este usuario
    const tokenExistente = await query(
      'SELECT id FROM notificaciones_push WHERE usuario_id = ? AND token_dispositivo = ?',
      [usuarioId, token_dispositivo]
    );

    if (tokenExistente.length > 0) {
      // Actualizar token existente
      await query(
        'UPDATE notificaciones_push SET activo = 1, updated_at = NOW() WHERE usuario_id = ? AND token_dispositivo = ?',
        [usuarioId, token_dispositivo]
      );
      console.log('✅ [notificacionController.registrarTokenFCM] Token actualizado');
    } else {
      // Insertar nuevo token
      await query(
        'INSERT INTO notificaciones_push (usuario_id, token_dispositivo, plataforma, activo) VALUES (?, ?, ?, 1)',
        [usuarioId, token_dispositivo, plataforma || 'web']
      );
      console.log('✅ [notificacionController.registrarTokenFCM] Nuevo token registrado');
    }

    res.status(200).json({
      success: true,
      message: 'Token FCM registrado exitosamente'
    });
  } catch (error) {
    console.error('❌ [notificacionController.registrarTokenFCM] Error:', error);
    return next(new ErrorResponse('Error al registrar token FCM', 500));
  }
}); 