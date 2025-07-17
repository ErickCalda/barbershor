const { query } = require('../config/database');

/**
 * Middleware para validar datos de entrada
 */
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

/**
 * Validar que una cita existe y pertenece al usuario
 */
const validateCitaOwnership = async (req, res, next) => {
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

    // Verificar si el usuario es el cliente o empleado de la cita, o si es admin/dueño
    if (req.user.rol_nombre === 'administrador' || req.user.rol_nombre === 'dueño') {
      req.cita = cita;
      return next();
    }

    if (cita.cliente_usuario_id === userId || cita.empleado_usuario_id === userId) {
      req.cita = cita;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a esta cita'
    });

  } catch (error) {
    console.error('Error validando propiedad de cita:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Validar que un servicio existe y está activo
 */
const validateService = async (req, res, next) => {
  try {
    const servicioId = req.params.servicioId || req.body.servicio_id;

    const servicioQuery = `
      SELECT s.*, cs.nombre as categoria_nombre
      FROM servicios s
      INNER JOIN categorias_servicios cs ON s.categoria_id = cs.id
      WHERE s.id = ? AND s.activo = 1
    `;

    const servicios = await query(servicioQuery, [servicioId]);

    if (servicios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado o inactivo'
      });
    }

    req.servicio = servicios[0];
    next();

  } catch (error) {
    console.error('Error validando servicio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Validar que un empleado existe y está activo
 */
const validateEmployee = async (req, res, next) => {
  try {
    const empleadoId = req.params.empleadoId || req.body.empleado_id;

    const empleadoQuery = `
      SELECT e.*, u.nombre, u.apellido, u.email, u.telefono
      FROM empleados e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      WHERE e.id = ? AND e.activo = 1 AND u.activo = 1
    `;

    const empleados = await query(empleadoQuery, [empleadoId]);

    if (empleados.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado o inactivo'
      });
    }

    req.empleado = empleados[0];
    next();

  } catch (error) {
    console.error('Error validando empleado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Validar que un cliente existe
 */
const validateClient = async (req, res, next) => {
  try {
    const clienteId = req.params.clienteId || req.body.cliente_id;

    const clienteQuery = `
      SELECT c.*, u.nombre, u.apellido, u.email, u.telefono
      FROM clientes c
      INNER JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ? AND u.activo = 1
    `;

    const clientes = await query(clienteQuery, [clienteId]);

    if (clientes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    req.cliente = clientes[0];
    next();

  } catch (error) {
    console.error('Error validando cliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Validar disponibilidad de horario para una cita
 */
const validateAvailability = async (req, res, next) => {
  try {
    const { empleado_id, fecha_hora_inicio, fecha_hora_fin, cita_id_excluir } = req.body;

    // Verificar que el empleado esté disponible en ese horario
    const disponibilidadQuery = `
      SELECT COUNT(*) as citas_existentes
      FROM citas
      WHERE empleado_id = ? 
        AND estado_id NOT IN (5, 6) -- Excluir citas canceladas y no asistió
        AND (
          (fecha_hora_inicio BETWEEN ? AND ?) OR
          (fecha_hora_fin BETWEEN ? AND ?) OR
          (? BETWEEN fecha_hora_inicio AND fecha_hora_fin) OR
          (? BETWEEN fecha_hora_inicio AND fecha_hora_fin)
        )
        ${cita_id_excluir ? 'AND id != ?' : ''}
    `;

    const params = [empleado_id, fecha_hora_inicio, fecha_hora_fin, fecha_hora_inicio, fecha_hora_fin, fecha_hora_inicio, fecha_hora_fin];
    if (cita_id_excluir) {
      params.push(cita_id_excluir);
    }

    const result = await query(disponibilidadQuery, params);

    if (result[0].citas_existentes > 0) {
      return res.status(409).json({
        success: false,
        message: 'El empleado no está disponible en el horario seleccionado'
      });
    }

    next();

  } catch (error) {
    console.error('Error validando disponibilidad:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Validar que el usuario tiene permisos para acceder a recursos específicos
 */
const validateResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params[`${resourceType}Id`] || req.body[`${resource_type}_id`];

      let query = '';
      let params = [];

      switch (resourceType) {
        case 'cita':
          query = `
            SELECT COUNT(*) as count
            FROM citas c
            INNER JOIN clientes cl ON c.cliente_id = cl.id
            INNER JOIN empleados e ON c.empleado_id = e.id
            WHERE c.id = ? AND (cl.usuario_id = ? OR e.usuario_id = ?)
          `;
          params = [resourceId, userId, userId];
          break;
        
        case 'cliente':
          query = `
            SELECT COUNT(*) as count
            FROM clientes
            WHERE id = ? AND usuario_id = ?
          `;
          params = [resourceId, userId];
          break;
        
        case 'empleado':
          query = `
            SELECT COUNT(*) as count
            FROM empleados
            WHERE id = ? AND usuario_id = ?
          `;
          params = [resourceId, userId];
          break;
        
        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de recurso no válido'
          });
      }

      const result = await query(query, params);

      if (result[0].count === 0 && !['administrador', 'dueño'].includes(req.user.rol_nombre)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso'
        });
      }

      next();

    } catch (error) {
      console.error(`Error validando acceso a ${resourceType}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

module.exports = {
  validateInput,
  validateCitaOwnership,
  validateService,
  validateEmployee,
  validateClient,
  validateAvailability,
  validateResourceAccess
}; 