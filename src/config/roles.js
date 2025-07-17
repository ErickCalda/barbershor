/**
 * Configuración de roles y permisos del sistema de peluquería
 * Basado en las tablas reales de la base de datos
 */

const ROLES = {
  ADMINISTRADOR: 'administrador',
  DUEÑO: 'dueño',
  EMPLEADO: 'empleado',
  CLIENTE: 'cliente'
};

// Matriz de permisos por tabla y rol
const PERMISOS_TABLAS = {
  // 1. Gestión de usuarios y roles
  usuarios: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R'], // Solo su perfil
    cliente: ['R']   // Solo su perfil
  },
  roles: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: [],
    cliente: []
  },
  logs: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: [],
    empleado: [],
    cliente: []
  },

  // 2. Clientes y empleados
  clientes: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: [],
    cliente: ['R', 'U'] // Su propio registro
  },
  empleados: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R', 'U'], // Su propio registro
    cliente: []
  },
  ausencias_empleados: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R', 'U'], // Sus propias ausencias
    cliente: []
  },
  horarios_empleados: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R', 'U'], // Sus propios horarios
    cliente: []
  },

  // 3. Citas y calendario
  citas: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R', 'U'], // Citas asignadas
    cliente: ['C', 'R', 'U'] // Sus propias citas
  },
  cita_servicio: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R', 'U'], // Citas asignadas
    cliente: []
  },
  estados_citas: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  calendarios_google: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: [],
    empleado: ['R', 'U'], // Su propio calendario
    cliente: []
  },
  eventos_google_calendar: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: [],
    empleado: ['R', 'U'], // Su propio calendario
    cliente: []
  },

  // 4. Catálogo de productos y servicios
  servicios: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R'], // Solo ver
    cliente: ['R']
  },
  categorias_servicios: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  productos: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R'], // Solo ver/venta
    cliente: ['R']
  },
  categorias_productos: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  detalle_venta_producto: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R', 'U'], // Ventas propias
    cliente: []
  },
  ventas_productos: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R', 'U'], // Ventas propias
    cliente: []
  },
  promociones: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R'], // Solo ver
    cliente: ['R'] // Aplicar
  },
  promocion_producto: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: [],
    cliente: []
  },
  promocion_servicio: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: [],
    cliente: []
  },

  // 5. Pagos y facturación
  pagos: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R', 'U'], // Pagos propios
    cliente: ['R'] // Sus pagos
  },
  metodos_pago: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  estados_pago: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },

  // 6. Comunicación (correo y notificaciones)
  plantillas_correo: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  correos_programados: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R'], // Ver pendientes
    cliente: []
  },
  correos_enviados: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R'], // Ver propio
    cliente: []
  },
  notificaciones: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R', 'U'], // Propias
    cliente: ['R', 'U'] // Propias
  },
  notificaciones_push: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R', 'U'], // Propias
    cliente: ['R', 'U'] // Propias
  },
  notificaciones_push_enviadas: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R'], // Propias
    cliente: []
  },

  // 7. Multimedia y galerías
  multimedia: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R'], // Solo ver
    cliente: ['R'] // Solo ver
  },
  tipos_multimedia: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  galerias: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  galeria_multimedia: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: [],
    cliente: []
  },
  categorias_galeria: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  galeria_categoria: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: [],
    cliente: []
  },
  carruseles: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  carrusel_multimedia: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: [],
    cliente: []
  },

  // 8. Configuraciones y otros
  configuraciones: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  configuraciones_google: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: [],
    cliente: []
  },
  especialidades: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R'],
    cliente: ['R']
  },
  empleado_especialidad: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R', 'U'], // Sus propias especialidades
    cliente: []
  },
  empleado_servicio: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R', 'U'], // Sus propios servicios
    cliente: []
  },
  fichas_clientes: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R', 'U'], // Fichas de sus clientes
    cliente: ['R', 'U'] // Su propia ficha
  },
  historial_servicios_cliente: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R'],
    empleado: ['R', 'U'], // Historial de sus clientes
    cliente: ['R'] // Su propio historial
  },
  resenas: {
    administrador: ['C', 'R', 'U', 'D'],
    dueño: ['R', 'U'],
    empleado: ['R', 'U'], // Sus reseñas
    cliente: ['C', 'R', 'U'] // Sus propias reseñas
  }
};

/**
 * Función para verificar si un usuario tiene un permiso específico en una tabla
 * @param {string} userRole - Rol del usuario
 * @param {string} table - Nombre de la tabla
 * @param {string} action - Acción (C, R, U, D)
 * @returns {boolean} - True si tiene permiso, false en caso contrario
 */
const tienePermiso = (userRole, table, action) => {
  if (!PERMISOS_TABLAS[table] || !PERMISOS_TABLAS[table][userRole]) {
    return false;
  }

  return PERMISOS_TABLAS[table][userRole].includes(action);
};

/**
 * Función para obtener todos los permisos de un rol
 * @param {string} userRole - Rol del usuario
 * @returns {Object} - Objeto con todos los permisos del rol
 */
const obtenerPermisosRol = (userRole) => {
  const permisos = {};

  Object.keys(PERMISOS_TABLAS).forEach(table => {
    permisos[table] = {
      crear: tienePermiso(userRole, table, 'C'),
      leer: tienePermiso(userRole, table, 'R'),
      actualizar: tienePermiso(userRole, table, 'U'),
      eliminar: tienePermiso(userRole, table, 'D')
    };
  });

  return permisos;
};

/**
 * Función para verificar si un usuario puede acceder a un recurso específico
 * @param {string} userRole - Rol del usuario
 * @param {string} table - Tabla
 * @param {string} action - Acción
 * @returns {boolean} - True si puede acceder, false en caso contrario
 */
const puedeAcceder = (userRole, table, action) => {
  return tienePermiso(userRole, table, action);
};

/**
 * Middleware para verificar permisos específicos en tablas
 * @param {string} table - Tabla
 * @param {string} action - Acción (C, R, U, D)
 * @returns {Function} - Middleware de Express
 */
const verificarPermiso = (table, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    if (!tienePermiso(req.user.rol_nombre, table, action)) {
      return res.status(403).json({
        success: false,
        message: `No tienes permisos para ${action} en la tabla ${table}`
      });
    }

    next();
  };
};

/**
 * Middleware para verificar permisos de propiedad (solo puede acceder a sus propios registros)
 * @param {string} table - Tabla
 * @param {string} action - Acción
 * @param {Function} getUserId - Función para obtener el ID del usuario propietario
 * @returns {Function} - Middleware de Express
 */
const verificarPropiedad = (table, action, getUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    // Administradores y dueños tienen acceso total
    if (['administrador', 'dueño'].includes(req.user.rol_nombre)) {
      return next();
    }

    // Verificar permiso básico
    if (!tienePermiso(req.user.rol_nombre, table, action)) {
      return res.status(403).json({
        success: false,
        message: `No tienes permisos para ${action} en la tabla ${table}`
      });
    }

    try {
      // Obtener el ID del usuario propietario del registro
      const recordUserId = await getUserId(req);
      
      if (recordUserId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes acceder a tus propios registros'
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando propiedad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Función para obtener permisos específicos de un rol en formato legible
 * @param {string} userRole - Rol del usuario
 * @returns {Object} - Objeto con permisos organizados por módulo
 */
const obtenerPermisosOrganizados = (userRole) => {
  const permisos = obtenerPermisosRol(userRole);
  
  return {
    usuarios: {
      usuarios: permisos.usuarios,
      roles: permisos.roles,
      logs: permisos.logs
    },
    personal: {
      clientes: permisos.clientes,
      empleados: permisos.empleados,
      ausencias_empleados: permisos.ausencias_empleados,
      horarios_empleados: permisos.horarios_empleados
    },
    citas: {
      citas: permisos.citas,
      cita_servicio: permisos.cita_servicio,
      estados_citas: permisos.estados_citas,
      calendarios_google: permisos.calendarios_google,
      eventos_google_calendar: permisos.eventos_google_calendar
    },
    catalogo: {
      servicios: permisos.servicios,
      categorias_servicios: permisos.categorias_servicios,
      productos: permisos.productos,
      categorias_productos: permisos.categorias_productos,
      detalle_venta_producto: permisos.detalle_venta_producto,
      ventas_productos: permisos.ventas_productos,
      promociones: permisos.promociones,
      promocion_producto: permisos.promocion_producto,
      promocion_servicio: permisos.promocion_servicio
    },
    pagos: {
      pagos: permisos.pagos,
      metodos_pago: permisos.metodos_pago,
      estados_pago: permisos.estados_pago
    },
    comunicacion: {
      plantillas_correo: permisos.plantillas_correo,
      correos_programados: permisos.correos_programados,
      correos_enviados: permisos.correos_enviados,
      notificaciones: permisos.notificaciones,
      notificaciones_push: permisos.notificaciones_push,
      notificaciones_push_enviadas: permisos.notificaciones_push_enviadas
    },
    multimedia: {
      multimedia: permisos.multimedia,
      tipos_multimedia: permisos.tipos_multimedia,
      galerias: permisos.galerias,
      galeria_multimedia: permisos.galeria_multimedia,
      categorias_galeria: permisos.categorias_galeria,
      galeria_categoria: permisos.galeria_categoria,
      carruseles: permisos.carruseles,
      carrusel_multimedia: permisos.carrusel_multimedia
    },
    configuracion: {
      configuraciones: permisos.configuraciones,
      configuraciones_google: permisos.configuraciones_google,
      especialidades: permisos.especialidades,
      empleado_especialidad: permisos.empleado_especialidad,
      empleado_servicio: permisos.empleado_servicio,
      fichas_clientes: permisos.fichas_clientes,
      historial_servicios_cliente: permisos.historial_servicios_cliente,
      resenas: permisos.resenas
    }
  };
};

module.exports = {
  ROLES,
  PERMISOS_TABLAS,
  tienePermiso,
  obtenerPermisosRol,
  puedeAcceder,
  verificarPermiso,
  verificarPropiedad,
  obtenerPermisosOrganizados
}; 