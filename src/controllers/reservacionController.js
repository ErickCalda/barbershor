const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { query } = require('../config/database');
const Servicio = require('../models/Servicio');
const Empleado = require('../models/Empleado');
const Cita = require('../models/Cita');
const Cliente = require('../models/Cliente');
const HorarioEmpleado = require('../models/HorarioEmpleado');
const AusenciaEmpleado = require('../models/AusenciaEmpleado');
const EmpleadoServicio = require('../models/EmpleadoServicio');
const Pago = require('../models/Pago');
const Notificacion = require('../models/Notificacion');
const CorreoProgramado = require('../models/CorreoProgramado');
const EventoGoogleCalendar = require('../models/EventoGoogleCalendar');
const notificacionService = require('../services/notificacionService');
const { verificarDisponibilidadEmpleado } = require('./ausenciaEmpleadoController');


/**
 * @desc    Obtener servicios disponibles para reservación
 * @route   GET /api/reservacion/servicios
 * @access  Public
 */
exports.getServiciosDisponibles = asyncHandler(async (req, res, next) => {
  try {
    console.log('🔍 [reservacionController.getServiciosDisponibles] Iniciando...');
    
    const sql = `
      SELECT s.*, cs.nombre as categoria_nombre
      FROM servicios s
      LEFT JOIN categorias_servicios cs ON s.categoria_id = cs.id
      WHERE s.activo = 1
      ORDER BY cs.nombre, s.nombre
    `;
    
    const servicios = await query(sql);
    
    console.log('🔍 [reservacionController.getServiciosDisponibles] Servicios encontrados:', servicios.length);
    
    res.status(200).json({
      success: true,
      count: servicios.length,
      data: servicios
    });
  } catch (error) {
    console.error('❌ [reservacionController.getServiciosDisponibles] Error:', error);
    next(new ErrorResponse('Error al obtener servicios disponibles', 500));
  }
});

/**
 * @desc    Obtener empleados disponibles para servicios seleccionados
 * @route   GET /api/reservacion/empleados
 * @access  Public
 */
exports.getEmpleadosDisponibles = asyncHandler(async (req, res, next) => {
  try {
    const { fecha, hora_inicio, hora_fin } = req.query;

    console.log('🔍 [reservacionController.getEmpleadosDisponibles] Parámetros:', { fecha, hora_inicio, hora_fin });

    let sql = `
      SELECT DISTINCT 
        e.id,
        u.nombre,
        u.apellido,
        u.email,
        u.telefono,
        u.foto_perfil,
        u.rol_id,
        r.nombre AS rol_nombre,
        e.titulo,
        e.biografia,
        e.activo,
        GROUP_CONCAT(esp.nombre SEPARATOR ', ') as especialidades
      FROM empleados e
      INNER JOIN usuarios u ON e.usuario_id = u.id
      INNER JOIN roles r ON u.rol_id = r.id
      LEFT JOIN empleado_especialidad ee ON e.id = ee.empleado_id
      LEFT JOIN especialidades esp ON ee.especialidad_id = esp.id
      WHERE e.activo = 1 
        AND u.activo = 1
        AND u.rol_id = 2
    `;

    // Si se proporcionan fecha y horario, filtrar empleados ocupados y ausentes
    if (fecha && hora_inicio && hora_fin) {
      sql += `
        AND e.id NOT IN (
          SELECT c.empleado_id
          FROM citas c
          WHERE DATE(CONVERT_TZ(c.fecha_hora_inicio, '+00:00', '-05:00')) = ?
            AND c.estado_id NOT IN (
              SELECT id FROM estados_citas 
              WHERE nombre IN ('Cancelada', 'No Asistió', 'Pendiente')
            )
            AND (
              (TIME(CONVERT_TZ(c.fecha_hora_inicio, '+00:00', '-05:00')) < ? AND TIME(CONVERT_TZ(c.fecha_hora_fin, '+00:00', '-05:00')) > ?)
              OR (TIME(CONVERT_TZ(c.fecha_hora_inicio, '+00:00', '-05:00')) < ? AND TIME(CONVERT_TZ(c.fecha_hora_fin, '+00:00', '-05:00')) > ?)
              OR (TIME(CONVERT_TZ(c.fecha_hora_inicio, '+00:00', '-05:00')) >= ? AND TIME(CONVERT_TZ(c.fecha_hora_fin, '+00:00', '-05:00')) <= ?)
            )
        )
        AND e.id NOT IN (
          SELECT ae.empleado_id
          FROM ausencias_empleados ae
          WHERE ae.motivo IN ('Vacaciones', 'Enfermedad', 'Permiso', 'Otro')
            AND ae.aprobada = 1
            AND (
              (ae.fecha_inicio < ? AND ae.fecha_fin > ?) OR
              (ae.fecha_inicio < ? AND ae.fecha_fin > ?) OR
              (ae.fecha_inicio >= ? AND ae.fecha_fin <= ?)
            )
        )
      `;
    }

    sql += `
      GROUP BY e.id
      ORDER BY u.nombre, u.apellido
    `;

    let empleados;
    if (fecha && hora_inicio && hora_fin) {
      // Convertir a UTC para comparación con ausencias
      const fechaInicioUTC = new Date(`${fecha}T${hora_inicio}:00-05:00`).toISOString().slice(0, 19).replace('T', ' ');
      const fechaFinUTC = new Date(`${fecha}T${hora_fin}:00-05:00`).toISOString().slice(0, 19).replace('T', ' ');
      
      empleados = await query(sql, [
        fecha, // para filtro de citas
        hora_fin, hora_inicio, 
        hora_fin, hora_inicio, 
        hora_inicio, hora_fin,
        fechaFinUTC, fechaInicioUTC,  // para filtro de ausencias - solapamiento tipo 1
        fechaFinUTC, fechaInicioUTC,  // para filtro de ausencias - solapamiento tipo 2
        fechaInicioUTC, fechaFinUTC   // para filtro de ausencias - solapamiento tipo 3
      ]);
    } else {
      empleados = await query(sql);
    }

    console.log('🔍 [reservacionController.getEmpleadosDisponibles] Empleados encontrados:', empleados.length);

    res.status(200).json({
      success: true,
      count: empleados.length,
      empleados
    });
  } catch (error) {
    console.error('❌ [reservacionController.getEmpleadosDisponibles] Error:', error);
    return next(new ErrorResponse('Error al obtener empleados disponibles', 500));
  }
});

/**
 * @desc    Obtener horarios disponibles para un empleado en una fecha
 * @route   GET /api/reservacion/horarios
 * @access  Public
 */
exports.getHorariosDisponibles = asyncHandler(async (req, res, next) => {
  try {
    const { empleadoId, fecha, servicios } = req.query;

    console.log('🔍 [reservacionController.getHorariosDisponibles] Parámetros:', { empleadoId, fecha, servicios });

    if (!empleadoId || !fecha || !servicios) {
      return next(new ErrorResponse('empleadoId, fecha y servicios son requeridos', 400));
    }

    // Convertir empleadoId a entero para evitar errores en la consulta SQL
    const empleadoIdInt = parseInt(empleadoId);
    console.log('👨‍🔧 Consultando horarios para empleado ID:', empleadoIdInt);

    const [year, month, day] = fecha.split("-").map(Number);
    const fechaLocal = new Date(year, month - 1, day);
    const diaSemana = fechaLocal.getDay();

    let horariosDisponibles = [];
    if (diaSemana === 0) {
      horariosDisponibles = [
        { inicio: '09:30', fin: '10:00' },
        { inicio: '10:00', fin: '10:30' },
        { inicio: '10:30', fin: '11:00' },
        { inicio: '11:00', fin: '11:30' },
        { inicio: '11:30', fin: '12:00' },
        { inicio: '12:00', fin: '12:30' },
        { inicio: '12:30', fin: '13:00' },
        { inicio: '13:00', fin: '13:30' },
        { inicio: '13:30', fin: '14:00' }
      ];
    } else {
      horariosDisponibles = [
        { inicio: '09:15', fin: '09:45' },
        { inicio: '09:45', fin: '10:15' },
        { inicio: '10:15', fin: '10:45' },
        { inicio: '10:45', fin: '11:15' },
        { inicio: '11:15', fin: '11:45' },
        { inicio: '11:45', fin: '12:15' },
        { inicio: '12:15', fin: '12:45' },
        { inicio: '14:15', fin: '14:45' },
        { inicio: '14:45', fin: '15:15' },
        { inicio: '15:15', fin: '15:45' },
        { inicio: '15:45', fin: '16:15' },
        { inicio: '16:15', fin: '16:45' },
        { inicio: '16:45', fin: '17:15' },
        { inicio: '17:15', fin: '17:45' },
        { inicio: '17:45', fin: '18:15' },
        { inicio: '18:15', fin: '18:45' }
      ];
    }

    // Calcular ventana del día en UTC con base -05:00
    const inicioDiaUTC = new Date(`${fecha}T00:00:00-05:00`).toISOString().slice(0, 19).replace('T', ' ');
    const finDiaUTC = new Date(`${fecha}T23:59:59-05:00`).toISOString().slice(0, 19).replace('T', ' ');

    // Calcular el horario de trabajo del día (primer y último horario disponible)
    const primerHorarioHora = horariosDisponibles[0].inicio;
    const ultimoHorarioHora = horariosDisponibles[horariosDisponibles.length - 1].fin;
    
    const primerHorarioUTC = new Date(`${fecha}T${primerHorarioHora}:00-05:00`).toISOString().slice(0, 19).replace('T', ' ');
    const ultimoHorarioUTC = new Date(`${fecha}T${ultimoHorarioHora}:00-05:00`).toISOString().slice(0, 19).replace('T', ' ');

    // NO marcar empleadoAusente automáticamente aquí
    // En su lugar, vamos a filtrar los horarios específicos donde hay ausencia
    // y solo marcar ausente si no quedan horarios disponibles

    const sqlHorariosOcupados = `
      SELECT 
        TIME(CONVERT_TZ(fecha_hora_inicio, '+00:00', '-05:00')) as hora_inicio,
        TIME(CONVERT_TZ(fecha_hora_fin, '+00:00', '-05:00')) as hora_fin
      FROM citas
      WHERE empleado_id = ? 
        AND DATE(CONVERT_TZ(fecha_hora_inicio, '+00:00', '-05:00')) = ?
        AND estado_id NOT IN (
          SELECT id FROM estados_citas 
          WHERE nombre IN ('Cancelada', 'No Presentó', 'Pendiente')
        )
    `;

    const horariosOcupados = await query(sqlHorariosOcupados, [empleadoIdInt, fecha]);

    console.log('🔍 [reservacionController.getHorariosDisponibles] Horarios ocupados:', horariosOcupados);
    console.log('🔍 [reservacionController.getHorariosDisponibles] SQL para horarios ocupados:', sqlHorariosOcupados);

    // Consultar ausencias por horas específicas que se solapan con el día
    const sqlAusencias = `
      SELECT 
        fecha_inicio,
        fecha_fin
      FROM ausencias_empleados
      WHERE empleado_id = ? 
        AND aprobada = 1
        AND motivo IN ('Vacaciones', 'Enfermedad', 'Permiso', 'Otro')
        AND (
          (fecha_inicio <= ? AND fecha_fin >= ?) OR  -- Ausencia cubre todo el día
          (fecha_inicio <= ? AND fecha_fin >= ?) OR  -- Ausencia empieza antes y termina durante el día
          (fecha_inicio >= ? AND fecha_fin <= ?)     -- Ausencia está completamente dentro del día
        )
    `;

    const ausencias = await query(sqlAusencias, [
      empleadoIdInt, 
      finDiaUTC, inicioDiaUTC,      // Ausencia cubre todo el día
      finDiaUTC, inicioDiaUTC,      // Ausencia empieza antes y termina durante
      inicioDiaUTC, finDiaUTC       // Ausencia está completamente dentro del día
    ]);
    console.log('🔍 [reservacionController.getHorariosDisponibles] Ausencias del empleado:', ausencias);
    console.log('🔍 [reservacionController.getHorariosDisponibles] SQL para ausencias:', sqlAusencias);
    console.log('🔍 [reservacionController.getHorariosDisponibles] Fecha consultada:', fecha);
    console.log('🔍 [reservacionController.getHorariosDisponibles] Ventana del día:', { inicioDiaUTC, finDiaUTC });
    console.log('🔍 [reservacionController.getHorariosDisponibles] Horario de trabajo:', { primerHorarioHora, ultimoHorarioHora });
    
    // Debug: Mostrar cada ausencia procesada
    ausencias.forEach((ausencia, index) => {
      const ausenciaInicio = new Date(ausencia.fecha_inicio);
      const ausenciaFin = new Date(ausencia.fecha_fin);
      const ausenciaInicioLocal = new Date(ausenciaInicio.getTime() - 5 * 60 * 60 * 1000);
      const ausenciaFinLocal = new Date(ausenciaFin.getTime() - 5 * 60 * 60 * 1000);
      
      console.log(`🔍 [AUSENCIA ${index + 1}]`, {
        original: { inicio: ausencia.fecha_inicio, fin: ausencia.fecha_fin },
        local: { 
          inicio: ausenciaInicioLocal.toISOString(), 
          fin: ausenciaFinLocal.toISOString() 
        },
        diaInicio: ausenciaInicioLocal.toISOString().split('T')[0],
        diaFin: ausenciaFinLocal.toISOString().split('T')[0],
        afectaFecha: ausenciaInicioLocal.toISOString().split('T')[0] === fecha || 
                    ausenciaFinLocal.toISOString().split('T')[0] === fecha ||
                    (new Date(fecha) >= new Date(ausenciaInicioLocal.toISOString().split('T')[0]) && 
                     new Date(fecha) <= new Date(ausenciaFinLocal.toISOString().split('T')[0])),
        horaInicio: ausenciaInicioLocal.toTimeString().slice(0, 5),
        horaFin: ausenciaFinLocal.toTimeString().slice(0, 5),
        horaInicioMinutos: horaATotalMinutos(ausenciaInicioLocal.toTimeString().slice(0, 5)),
        horaFinMinutos: horaATotalMinutos(ausenciaFinLocal.toTimeString().slice(0, 5))
      });
    });

    // Función para convertir 'HH:MM' a minutos totales para comparación numérica
    const horaATotalMinutos = (hora) => {
      const [h, m] = hora.split(":").map(Number);
      return h * 60 + m;
    };

    // Función para verificar si un horario está afectado por una ausencia
    const horarioEstaEnAusencia = (inicioHorario, finHorario, ausencia) => {
      // Convertir las fechas de ausencia de UTC a hora local de Ecuador
      const ausenciaInicio = new Date(ausencia.fecha_inicio);
      const ausenciaFin = new Date(ausencia.fecha_fin);
      
      // Convertir a hora local de Ecuador (UTC-5)
      const ausenciaInicioLocal = new Date(ausenciaInicio.getTime() - 5 * 60 * 60 * 1000);
      const ausenciaFinLocal = new Date(ausenciaFin.getTime() - 5 * 60 * 60 * 1000);
      
      // Extraer solo la fecha (sin hora) para comparar días
      const ausenciaInicioDia = ausenciaInicioLocal.toISOString().split('T')[0];
      const ausenciaFinDia = ausenciaFinLocal.toISOString().split('T')[0];
      
      // Si la ausencia no afecta a este día, retornar false
      if (fecha < ausenciaInicioDia || fecha > ausenciaFinDia) {
        return false;
      }
      
      // Extraer las horas de la ausencia
      const horaInicioAusencia = ausenciaInicioLocal.toTimeString().slice(0, 5);
      const horaFinAusencia = ausenciaFinLocal.toTimeString().slice(0, 5);
      
      // Convertir a minutos para comparación
      const inicioMinutos = horaATotalMinutos(inicioHorario);
      const finMinutos = horaATotalMinutos(finHorario);
      const ausenciaInicioMinutos = horaATotalMinutos(horaInicioAusencia);
      const ausenciaFinMinutos = horaATotalMinutos(horaFinAusencia);
      
      // Si es el día de inicio de la ausencia, ocultar desde la hora de inicio
      if (fecha === ausenciaInicioDia) {
        // Solo ocultar si el horario empieza DESPUÉS de la hora de inicio de ausencia
        return inicioMinutos >= ausenciaInicioMinutos;
      }
      
      // Si es el día de fin de la ausencia, ocultar hasta la hora de fin
      if (fecha === ausenciaFinDia) {
        // Solo ocultar si el horario termina ANTES de la hora de fin de ausencia
        return finMinutos <= ausenciaFinMinutos;
      }
      
      // Si es un día intermedio, ocultar todo el día
      if (fecha > ausenciaInicioDia && fecha < ausenciaFinDia) {
        return true;
      }
      
      // Para el mismo día (inicio y fin), verificar solapamiento de horas
      if (ausenciaInicioDia === ausenciaFinDia && fecha === ausenciaInicioDia) {
        return (inicioMinutos < ausenciaFinMinutos && finMinutos > ausenciaInicioMinutos);
      }
      
      return false;
    };

    const horariosLibres = horariosDisponibles.filter(horario => {
      const inicioHorario = horaATotalMinutos(horario.inicio);
      const finHorario = horaATotalMinutos(horario.fin);

      // Verificar si hay citas ocupadas que se solapan
      const hayCitasOcupadas = horariosOcupados.some(ocupado => {
        const inicioOcupado = horaATotalMinutos(ocupado.hora_inicio);
        const finOcupado = horaATotalMinutos(ocupado.hora_fin);

        return (
          inicioHorario < finOcupado && finHorario > inicioOcupado
        );
      });

      // Verificar si hay ausencias que se solapan
      const hayAusencias = ausencias.some(ausencia => {
        const resultado = horarioEstaEnAusencia(horario.inicio, horario.fin, ausencia);
        if (resultado) {
          console.log(`🕐 [HORARIO] ${horario.inicio}-${horario.fin} afectado por ausencia:`, {
            horario: `${horario.inicio}-${horario.fin}`,
            ausencia: `${ausencia.fecha_inicio} a ${ausencia.fecha_fin}`,
            fechaConsultada: fecha,
            resultado: resultado,
            horarioMinutos: `${horaATotalMinutos(horario.inicio)}-${horaATotalMinutos(horario.fin)}`
          });
        }
        return resultado;
      });

      // Log para debuggear cada horario
      if (hayAusencias) {
        console.log(`🕐 [HORARIO] ${horario.inicio}-${horario.fin} oculto por ausencia`);
      } else if (hayCitasOcupadas) {
        console.log(`🕐 [HORARIO] ${horario.inicio}-${horario.fin} oculto por cita ocupada`);
      } else {
        console.log(`🕐 [HORARIO] ${horario.inicio}-${horario.fin} DISPONIBLE`);
      }

      // El horario está disponible si no hay citas ocupadas Y no hay ausencias
      return !hayCitasOcupadas && !hayAusencias;
    });

    console.log('🔍 [reservacionController.getHorariosDisponibles] Horarios disponibles filtrados:', horariosLibres);
    console.log('🔍 [reservacionController.getHorariosDisponibles] Resumen:', {
      totalHorarios: horariosDisponibles.length,
      horariosOcupados: horariosOcupados.length,
      ausencias: ausencias.length,
      horariosDisponibles: horariosLibres.length,
      fechaConsultada: fecha,
      horariosOcultos: horariosDisponibles.length - horariosLibres.length
    });

    // Solo marcar empleadoAusente si realmente no quedan horarios disponibles
    if (horariosLibres.length === 0) {
      console.log('🔍 [reservacionController.getHorariosDisponibles] No hay horarios disponibles, marcando empleadoAusente: true');
      console.log('🔍 [reservacionController.getHorariosDisponibles] Razón: Todos los horarios fueron ocultados por ausencias o citas ocupadas');
      return res.status(200).json({ 
        success: true, 
        empleadoAusente: true, 
        horarios: [], 
        count: 0,
        mensaje: 'El empleado no tiene horarios disponibles en la fecha seleccionada'
      });
    }

    console.log('🔍 [reservacionController.getHorariosDisponibles] Hay horarios disponibles, retornando horarios normales');
    console.log('🔍 [reservacionController.getHorariosDisponibles] Horarios disponibles:', horariosLibres.map(h => `${h.inicio}-${h.fin}`));
    console.log('🔍 [reservacionController.getHorariosDisponibles] Horarios ocultos:', horariosDisponibles.filter(h => !horariosLibres.includes(h)).map(h => `${h.inicio}-${h.fin}`));
    res.status(200).json({
      success: true,
      count: horariosLibres.length,
      horarios: horariosLibres
    });

  } catch (error) {
    console.error('❌ [reservacionController.getHorariosDisponibles] Error:', error);
    next(new ErrorResponse('Error al obtener horarios disponibles', 500));
  }
});


/**
 * @desc    Procesar pago y crear cita
 * @route   POST /api/reservacion/procesar
 * @access  Private (Cliente)
 */
exports.procesarReservacion = asyncHandler(async (req, res, next) => {
  try {
    const { empleadoId, servicios, fecha, horario, total } = req.body;
    let clienteId = req.usuario?.cliente_id;

    console.log('🔍 [reservacionController.procesarReservacion] Iniciando procesamiento...');
    console.log('🔍 [reservacionController.procesarReservacion] Datos recibidos:', { empleadoId, servicios, fecha, horario, total });

    // Validaciones básicas
    if (!empleadoId || !servicios || !fecha || !horario || !total) {
      return next(new ErrorResponse('Todos los campos son requeridos', 400));
    }
    if (!Array.isArray(servicios) || servicios.length === 0) {
      return next(new ErrorResponse('Debe seleccionar al menos un servicio', 400));
    }

    // Validar cliente
    if (!clienteId) {
      const clienteExistenteSql = 'SELECT id FROM clientes WHERE usuario_id = ?';
      const [clienteExistente] = await query(clienteExistenteSql, [req.usuario.id]);
      if (clienteExistente) {
        clienteId = clienteExistente.id;
      } else {
        const insertClienteSql = `INSERT INTO clientes (usuario_id, fecha_nacimiento, genero) VALUES (?, NULL, NULL)`;
        const result = await query(insertClienteSql, [req.usuario.id]);
        clienteId = result.insertId;
      }
    }
    if (!clienteId) {
      return next(new ErrorResponse('No se pudo identificar al cliente', 400));
    }

    // Calcular duración total correctamente
    const duracionTotal = servicios.reduce((totalDuracion, servicio) => {
      const duracion = Number(servicio.duracion) || 30;
      const cantidad = Number(servicio.cantidad) || 1;
      return totalDuracion + (duracion * cantidad);
    }, 0);

    // Calcular fechas y horas
    const { inicio: horaInicio } = horario;
    if (!horaInicio) {
      return next(new ErrorResponse('El horario seleccionado es inválido', 400));
    }
    const inicio = new Date(`${fecha}T${horaInicio}:00-05:00`);
    const fin = new Date(inicio.getTime() + duracionTotal * 60000);
    const fechaHoraInicio = inicio.toISOString().slice(0, 19).replace('T', ' ');
    const fechaHoraFin = fin.toISOString().slice(0, 19).replace('T', ' ');

    console.log('🔍 [reservacionController.procesarReservacion] Horarios calculados:', {
      horaInicio,
      duracionTotal,
      fechaHoraInicio,
      fechaHoraFin
    });

    // Verificar conflictos de citas existentes con solapamiento real
    const verificarDisponibilidadSql = `
      SELECT COUNT(*) as conflictos
      FROM citas
      WHERE empleado_id = ?
        AND fecha_hora_inicio < ? 
        AND fecha_hora_fin > ?
        AND estado_id NOT IN (
          SELECT id FROM estados_citas WHERE nombre IN ('Cancelada', 'No Presentó', 'Pendiente')
        )
        AND DATE(CONVERT_TZ(fecha_hora_inicio, '+00:00', '-05:00')) = ?
    `;

    const [verificacion] = await query(verificarDisponibilidadSql, [
      empleadoId,
      fechaHoraFin,
      fechaHoraInicio,
      fecha,
    ]);

    console.log('🔍 [reservacionController.procesarReservacion] Verificación de citas:', verificacion);

    if (verificacion.conflictos > 0) {
      return next(new ErrorResponse('El empleado no está disponible en ese horario (conflicto con otra cita)', 400));
    }

    // Verificar ausencias del empleado con tiempo de solapamiento
    const sqlVerificarAusencias = `
      SELECT COUNT(*) as total
      FROM ausencias_empleados
      WHERE empleado_id = ?
        AND motivo IN ('Vacaciones', 'Enfermedad', 'Permiso', 'Otro')
        AND (
          (fecha_inicio < ? AND fecha_fin > ?) OR
          (fecha_inicio < ? AND fecha_fin > ?) OR
          (fecha_inicio >= ? AND fecha_fin <= ?)
        )
    `;
    
    const [verificacionAusencias] = await query(sqlVerificarAusencias, [
      empleadoId, 
      fechaHoraFin, fechaHoraInicio,  // Solapamiento tipo 1: ausencia cubre la cita
      fechaHoraFin, fechaHoraInicio,  // Solapamiento tipo 2: ausencia empieza antes y termina durante
      fechaHoraInicio, fechaHoraFin   // Solapamiento tipo 3: ausencia está completamente dentro de la cita
    ]);
    
    console.log('🔍 [reservacionController.procesarReservacion] Verificación de ausencias:', verificacionAusencias);
    
    if (verificacionAusencias.total > 0) {
      return next(new ErrorResponse('El empleado no está disponible en ese horario debido a una ausencia', 400));
    }

    // Crear cita
    const insertCitaSql = `
      INSERT INTO citas (cliente_id, empleado_id, fecha_hora_inicio, fecha_hora_fin, estado_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, NOW(), NOW())
    `;
    const resultadoCita = await query(insertCitaSql, [clienteId, empleadoId, fechaHoraInicio, fechaHoraFin]);
    const citaId = resultadoCita.insertId;

    console.log('🔍 [reservacionController.procesarReservacion] Cita creada con ID:', citaId);

    // Crear pago
    const insertPagoSql = `
      INSERT INTO pagos (cita_id, monto_total, metodo_pago_id, estado_pago_id, created_at, updated_at)
      VALUES (?, ?, 1, 1, NOW(), NOW())
    `;
    await query(insertPagoSql, [citaId, total]);

    // Insertar servicios de la cita
    for (const servicio of servicios) {
      const precioServicioSql = 'SELECT precio FROM servicios WHERE id = ?';
      const [servicioData] = await query(precioServicioSql, [servicio.id]);
      if (!servicioData) continue;
      const precioUnitario = servicioData.precio;
      const insertDetalleSql = `
        INSERT INTO cita_servicio (cita_id, servicio_id, precio_aplicado, descuento, notas)
        VALUES (?, ?, ?, 0.00, NULL)
      `;
      await query(insertDetalleSql, [citaId, servicio.id, precioUnitario]);
    }

    // Notificación (no detiene el flujo si falla)
    try {
      await notificacionService.enviarNotificacionesConfirmacion(citaId);
    } catch (e) {
      console.warn('No se pudo enviar la notificación de confirmación:', e);
    }

    console.log('🔍 [reservacionController.procesarReservacion] Reservación procesada exitosamente');

    res.status(200).json({
      success: true,
      message: 'Reservación procesada exitosamente',
      data: { citaId, fecha, horaInicio, total }
    });
  } catch (error) {
    console.error('❌ [reservacionController.procesarReservacion] Error:', error);
    return next(new ErrorResponse('Error al procesar la reservación', 500));
  }
});

/**
 * @desc    Obtener citas del cliente
 * @route   GET /api/reservacion/mis-citas
 * @access  Private (Cliente)
 */
exports.getMisCitas = asyncHandler(async (req, res, next) => {
  try {
    let clienteId = req.usuario.cliente_id;

    // Si el usuario no es cliente, verificar si existe un registro
    if (!clienteId) {
      const clienteSql = 'SELECT id FROM clientes WHERE usuario_id = ?';
      const [cliente] = await query(clienteSql, [req.usuario.id]);

      if (!cliente) {
        // Si no existe cliente, devolver array vacío
        return res.status(200).json({
          success: true,
          count: 0,
          citas: []
        });
      }

      clienteId = cliente.id;
    }

    const sql = `
SELECT
  c.id,
  c.cliente_id,
  c.empleado_id,
  DATE_FORMAT(CONVERT_TZ(c.fecha_hora_inicio, '+00:00', '-05:00'), '%Y-%m-%dT%H:%i:%s') AS fecha_hora_inicio,
  DATE_FORMAT(CONVERT_TZ(c.fecha_hora_fin, '+00:00', '-05:00'), '%Y-%m-%dT%H:%i:%s') AS fecha_hora_fin,
  CONCAT(u.nombre, ' ', u.apellido) AS empleado_nombre,
  u.foto_perfil AS empleado_foto,
  ec.nombre AS estado_nombre,
  ec.color AS estado_color,
  GROUP_CONCAT(s.nombre SEPARATOR ', ') AS servicios
FROM citas c
INNER JOIN empleados e ON c.empleado_id = e.id
INNER JOIN usuarios u ON e.usuario_id = u.id
INNER JOIN estados_citas ec ON c.estado_id = ec.id
LEFT JOIN cita_servicio cs ON c.id = cs.cita_id
LEFT JOIN servicios s ON cs.servicio_id = s.id
WHERE c.cliente_id = ?
GROUP BY c.id, c.cliente_id, c.empleado_id, fecha_hora_inicio, fecha_hora_fin, empleado_nombre, empleado_foto, estado_nombre, estado_color
ORDER BY fecha_hora_inicio DESC;
`;

    const citas = await query(sql, [clienteId]);

    res.status(200).json({
      success: true,
      count: citas.length,
      citas: citas.map(cita => ({
        ...cita,
        servicios: cita.servicios ? cita.servicios.split(', ') : []
      }))
    });
  } catch (error) {
    console.error('❌ [reservacionController.getMisCitas] Error:', error);
    next(new ErrorResponse('Error al obtener citas', 500));
  }
});

/**
 * @desc    Cancelar cita del cliente
 * @route   PUT /api/reservacion/cancelar/:id
 * @access  Private (Cliente)
 */
exports.cancelarCita = asyncHandler(async (req, res, next) => {
  try {
    const citaId = req.params.id;
    let clienteId = req.usuario.cliente_id;
    
    // Si el usuario no es cliente, verificar si existe un registro
    if (!clienteId) {
      const clienteSql = 'SELECT id FROM clientes WHERE usuario_id = ?';
      const [cliente] = await query(clienteSql, [req.usuario.id]);
      
      if (!cliente) {
        return next(new ErrorResponse('Usuario no es un cliente válido', 400));
      }
      
      clienteId = cliente.id;
    }
    
    // Verificar que la cita pertenece al cliente
    const citaSql = `
      SELECT * FROM citas 
      WHERE id = ? AND cliente_id = ?
    `;
    
    const [cita] = await query(citaSql, [citaId, clienteId]);
    
    if (!cita) {
      return next(new ErrorResponse('Cita no encontrada', 404));
    }
    
    // Actualizar estado a cancelada
    const actualizarSql = `
      UPDATE citas 
      SET estado_id = (SELECT id FROM estados_citas WHERE nombre = 'Cancelada'),
          updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(actualizarSql, [citaId]);
    
    res.status(200).json({
      success: true,
      message: 'Cita cancelada exitosamente'
    });
  } catch (error) {
    console.error('❌ [reservacionController.cancelarCita] Error:', error);
    next(new ErrorResponse('Error al cancelar la cita', 500));
  }
});