const { query } = require('../config/database');
const { tienePermiso } = require('../config/roles');

/**
 * Middleware para verificar que un usuario puede acceder a sus propios registros
 * Basado en las tablas reales de la base de datos
 */

/**
 * Verificar propiedad de citas
 */
const verificarPropiedadCita = async (req, res, next) => {
  try {
    const citaId = req.params.citaId || req.body.cita_id;
    const userId = req.user.id;

    const citaQuery = `
      SELECT c.*, cl.usuario_id as cliente_usuario_id, e.usuario_id as empleado_usuario_id
      FROM citas c
      INNER JOIN clientes cl ON c.cliente_id = cl.id
      INNER JOIN empleados e ON c.empleado_id = e.id
      WHERE c.id = ?
    `;

    const citas = await query(citaQuery, [citaId]);

    if (citas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const cita = citas[0];

    // Administradores y dueños tienen acceso total
    if (['administrador', 'dueño'].includes(req.user.rol_nombre)) {
      req.cita = cita;
      return next();
    }

    // Verificar si el usuario es el cliente o empleado de la cita
    if (cita.cliente_usuario_id === userId || cita.empleado_usuario_id === userId) {
      req.cita = cita;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a esta cita'
    });

  } catch (error) {
    console.error('Error verificando propiedad de cita:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar propiedad de pagos
 */
const verificarPropiedadPago = async (req, res, next) => {
  try {
    const pagoId = req.params.pagoId || req.body.pago_id;
    const userId = req.user.id;

    const pagoQuery = `
      SELECT p.*, c.cliente_id, c.empleado_id, cl.usuario_id as cliente_usuario_id, e.usuario_id as empleado_usuario_id
      FROM pagos p
      INNER JOIN citas c ON p.cita_id = c.id
      INNER JOIN clientes cl ON c.cliente_id = cl.id
      INNER JOIN empleados e ON c.empleado_id = e.id
      WHERE p.id = ?
    `;

    const pagos = await query(pagoQuery, [pagoId]);

    if (pagos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    const pago = pagos[0];

    // Administradores y dueños tienen acceso total
    if (['administrador', 'dueño'].includes(req.user.rol_nombre)) {
      req.pago = pago;
      return next();
    }

    // Verificar si el usuario es el cliente o empleado del pago
    if (pago.cliente_usuario_id === userId || pago.empleado_usuario_id === userId) {
      req.pago = pago;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a este pago'
    });

  } catch (error) {
    console.error('Error verificando propiedad de pago:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar propiedad de ventas
 */
const verificarPropiedadVenta = async (req, res, next) => {
  try {
    const ventaId = req.params.ventaId || req.body.venta_id;
    const userId = req.user.id;

    const ventaQuery = `
      SELECT vp.*, e.usuario_id as empleado_usuario_id
      FROM ventas_productos vp
      INNER JOIN empleados e ON vp.empleado_id = e.id
      WHERE vp.id = ?
    `;

    const ventas = await query(ventaQuery, [ventaId]);

    if (ventas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    const venta = ventas[0];

    // Administradores y dueños tienen acceso total
    if (['administrador', 'dueño'].includes(req.user.rol_nombre)) {
      req.venta = venta;
      return next();
    }

    // Verificar si el usuario es el empleado que realizó la venta
    if (venta.empleado_usuario_id === userId) {
      req.venta = venta;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a esta venta'
    });

  } catch (error) {
    console.error('Error verificando propiedad de venta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar propiedad de notificaciones
 */
const verificarPropiedadNotificacion = async (req, res, next) => {
  try {
    const notificacionId = req.params.notificacionId || req.body.notificacion_id;
    const userId = req.user.id;

    const notificacionQuery = `
      SELECT * FROM notificaciones WHERE id = ? AND usuario_id = ?
    `;

    const notificaciones = await query(notificacionQuery, [notificacionId, userId]);

    if (notificaciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    req.notificacion = notificaciones[0];
    next();

  } catch (error) {
    console.error('Error verificando propiedad de notificación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar propiedad de reseñas
 */
const verificarPropiedadResena = async (req, res, next) => {
  try {
    const resenaId = req.params.resenaId || req.body.resena_id;
    const userId = req.user.id;

    const resenaQuery = `
      SELECT r.*, cl.usuario_id as cliente_usuario_id, e.usuario_id as empleado_usuario_id
      FROM resenas r
      INNER JOIN clientes cl ON r.cliente_id = cl.id
      INNER JOIN empleados e ON r.empleado_id = e.id
      WHERE r.id = ?
    `;

    const resenas = await query(resenaQuery, [resenaId]);

    if (resenas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }

    const resena = resenas[0];

    // Administradores y dueños tienen acceso total
    if (['administrador', 'dueño'].includes(req.user.rol_nombre)) {
      req.resena = resena;
      return next();
    }

    // Verificar si el usuario es el cliente o empleado de la reseña
    if (resena.cliente_usuario_id === userId || resena.empleado_usuario_id === userId) {
      req.resena = resena;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a esta reseña'
    });

  } catch (error) {
    console.error('Error verificando propiedad de reseña:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar propiedad de horarios de empleado
 */
const verificarPropiedadHorario = async (req, res, next) => {
  try {
    const horarioId = req.params.horarioId || req.body.horario_id;
    const userId = req.user.id;

    const horarioQuery = `
      SELECT he.*, e.usuario_id as empleado_usuario_id
      FROM horarios_empleados he
      INNER JOIN empleados e ON he.empleado_id = e.id
      WHERE he.id = ?
    `;

    const horarios = await query(horarioQuery, [horarioId]);

    if (horarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }

    const horario = horarios[0];

    // Administradores y dueños tienen acceso total
    if (['administrador', 'dueño'].includes(req.user.rol_nombre)) {
      req.horario = horario;
      return next();
    }

    // Verificar si el usuario es el empleado del horario
    if (horario.empleado_usuario_id === userId) {
      req.horario = horario;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a este horario'
    });

  } catch (error) {
    console.error('Error verificando propiedad de horario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar propiedad de ausencias de empleado
 */
const verificarPropiedadAusencia = async (req, res, next) => {
  try {
    const ausenciaId = req.params.ausenciaId || req.body.ausencia_id;
    const userId = req.user.id;

    const ausenciaQuery = `
      SELECT ae.*, e.usuario_id as empleado_usuario_id
      FROM ausencias_empleados ae
      INNER JOIN empleados e ON ae.empleado_id = e.id
      WHERE ae.id = ?
    `;

    const ausencias = await query(ausenciaQuery, [ausenciaId]);

    if (ausencias.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ausencia no encontrada'
      });
    }

    const ausencia = ausencias[0];

    // Administradores y dueños tienen acceso total
    if (['administrador', 'dueño'].includes(req.user.rol_nombre)) {
      req.ausencia = ausencia;
      return next();
    }

    // Verificar si el usuario es el empleado de la ausencia
    if (ausencia.empleado_usuario_id === userId) {
      req.ausencia = ausencia;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a esta ausencia'
    });

  } catch (error) {
    console.error('Error verificando propiedad de ausencia:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar propiedad de fichas de cliente
 */
const verificarPropiedadFichaCliente = async (req, res, next) => {
  try {
    const fichaId = req.params.fichaId || req.body.ficha_id;
    const userId = req.user.id;

    const fichaQuery = `
      SELECT fc.*, cl.usuario_id as cliente_usuario_id
      FROM fichas_clientes fc
      INNER JOIN clientes cl ON fc.cliente_id = cl.id
      WHERE fc.id = ?
    `;

    const fichas = await query(fichaQuery, [fichaId]);

    if (fichas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ficha no encontrada'
      });
    }

    const ficha = fichas[0];

    // Administradores y dueños tienen acceso total
    if (['administrador', 'dueño'].includes(req.user.rol_nombre)) {
      req.ficha = ficha;
      return next();
    }

    // Empleados pueden acceder a fichas de sus clientes
    if (req.user.rol_nombre === 'empleado') {
      // Aquí podrías agregar lógica adicional para verificar si el empleado tiene citas con este cliente
      req.ficha = ficha;
      return next();
    }

    // Clientes solo pueden acceder a su propia ficha
    if (req.user.rol_nombre === 'cliente' && ficha.cliente_usuario_id === userId) {
      req.ficha = ficha;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a esta ficha'
    });

  } catch (error) {
    console.error('Error verificando propiedad de ficha:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware genérico para verificar propiedad basado en tabla y campo de usuario
 * @param {string} table - Nombre de la tabla
 * @param {string} userIdField - Campo que contiene el ID del usuario
 * @returns {Function} - Middleware de Express
 */
const verificarPropiedadGenerico = (table, userIdField) => {
  return async (req, res, next) => {
    try {
      const recordId = req.params[`${table}Id`] || req.body[`${table}_id`];
      const userId = req.user.id;

      const query = `
        SELECT * FROM ${table} WHERE id = ? AND ${userIdField} = ?
      `;

      const records = await query(query, [recordId, userId]);

      if (records.length === 0) {
        return res.status(404).json({
          success: false,
          message: `${table} no encontrado`
        });
      }

      req[table] = records[0];
      next();

    } catch (error) {
      console.error(`Error verificando propiedad de ${table}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

module.exports = {
  verificarPropiedadCita,
  verificarPropiedadPago,
  verificarPropiedadVenta,
  verificarPropiedadNotificacion,
  verificarPropiedadResena,
  verificarPropiedadHorario,
  verificarPropiedadAusencia,
  verificarPropiedadFichaCliente,
  verificarPropiedadGenerico
}; 