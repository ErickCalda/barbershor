const { query } = require('../config/database');
const { google } = require('googleapis');
const emailService = require('./emailService');
const googleCalendarService = require('./googleCalendarService');
const notificacionPushService = require('./notificacionPushService');
const { formatearFechaHora } = require('../utils/dateUtils');

/**
 * Servicio para manejar notificaciones y Google Calendar
 */
class NotificacionService {
  
  /**
   * Enviar notificación de confirmación de cita
   * @param {Object} datos - Datos de la cita
   */
  static async enviarNotificacionConfirmacionCita(datos) {
    try {
      const { usuario_id, cita_id, fecha_hora_inicio, empleado_id, servicio_id } = datos;
      
      // Obtener información adicional
      const infoSql = `
        SELECT 
          CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
          CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
          s.nombre as servicio_nombre,
          s.precio as servicio_precio
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u ON cl.usuario_id = u.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios eu ON e.usuario_id = eu.id
        INNER JOIN servicios s ON s.id = ?
        WHERE c.id = ?
      `;
      
      const [info] = await query(infoSql, [servicio_id, cita_id]);
      
      if (!info) {
        throw new Error('No se pudo obtener información de la cita');
      }
      
      // Crear notificación
      const notificacionSql = `
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos_adicionales, leida, created_at, updated_at)
        VALUES (?, 'cita_confirmada', ?, ?, ?, 0, NOW(), NOW())
      `;
      
      const titulo = 'Cita Confirmada';
      const fecha = formatearFechaHora(fecha_hora_inicio, 'corta');
      const hora = formatearFechaHora(fecha_hora_inicio, 'solo_hora');
      const mensaje = `Tu cita para ${info.servicio_nombre} con ${info.empleado_nombre} ha sido confirmada para el ${fecha} a las ${hora}.`;
      const datosAdicionales = JSON.stringify({
        cita_id,
        fecha_hora_inicio,
        empleado_nombre: info.empleado_nombre,
        servicio_nombre: info.servicio_nombre,
        precio: info.servicio_precio
      });
      
      await query(notificacionSql, [usuario_id, titulo, mensaje, datosAdicionales]);
      
      console.log('✅ Notificación de confirmación de cita enviada');
      
    } catch (error) {
      console.error('❌ Error enviando notificación de confirmación:', error);
      throw error;
    }
  }
  
  /**
   * Programar correo de confirmación
   * @param {Object} datos - Datos de la cita
   */
  static async programarCorreoConfirmacion(datos) {
    try {
      const { usuario_id, cita_id, fecha_hora_inicio, empleado_id, servicio_id } = datos;
      
      // Obtener información adicional
      const infoSql = `
        SELECT 
          u.email as cliente_email,
          CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
          CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
          s.nombre as servicio_nombre,
          s.precio as servicio_precio
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u ON cl.usuario_id = u.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios eu ON e.usuario_id = eu.id
        INNER JOIN servicios s ON s.id = ?
        WHERE c.id = ?
      `;
      
      const [info] = await query(infoSql, [servicio_id, cita_id]);
      
      if (!info) {
        throw new Error('No se pudo obtener información de la cita');
      }
      
      // Programar correo
      const correoSql = `
        INSERT INTO correos_programados (usuario_id, tipo_plantilla, datos_adicionales, estado, fecha_programada, created_at, updated_at)
        VALUES (?, 'confirmacion_cita', ?, 'pendiente', NOW(), NOW(), NOW())
      `;
      
      const datosCorreo = JSON.stringify({
        cita_id,
        fecha_hora_inicio,
        empleado_nombre: info.empleado_nombre,
        servicio_nombre: info.servicio_nombre,
        precio: info.servicio_precio,
        cliente_email: info.cliente_email,
        cliente_nombre: info.cliente_nombre
      });
      
      await query(correoSql, [usuario_id, datosCorreo]);
      
      console.log('✅ Correo de confirmación programado');
      
    } catch (error) {
      console.error('❌ Error programando correo de confirmación:', error);
      throw error;
    }
  }
  
  /**
   * Crear evento en Google Calendar
   * @param {Object} datos - Datos de la cita
   */
  static async crearEventoGoogleCalendar(datos) {
    try {
      const { usuario_id, cita_id, fecha_hora_inicio, fecha_hora_fin, empleado_id, servicio_id } = datos;
      
      // Verificar si el usuario tiene Google Calendar configurado
      const calendarioSql = `
        SELECT cg.calendar_id, cg.access_token, cg.refresh_token
        FROM calendarios_google cg
        WHERE cg.usuario_id = ? AND cg.activo = 1
      `;
      
      const calendarios = await query(calendarioSql, [usuario_id]);
      
      if (calendarios.length === 0) {
        console.log('⚠️ Usuario no tiene Google Calendar configurado');
        return;
      }
      
      const calendario = calendarios[0];
      
      // Obtener información de la cita
      const infoSql = `
        SELECT 
          CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
          CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
          s.nombre as servicio_nombre,
          s.precio as servicio_precio
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u ON cl.usuario_id = u.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios eu ON e.usuario_id = eu.id
        INNER JOIN servicios s ON s.id = ?
        WHERE c.id = ?
      `;
      
      const [info] = await query(infoSql, [servicio_id, cita_id]);
      
      if (!info) {
        throw new Error('No se pudo obtener información de la cita');
      }
      
      // Configurar Google Calendar API
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      
      oauth2Client.setCredentials({
        access_token: calendario.access_token,
        refresh_token: calendario.refresh_token
      });
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      // Crear evento
      const evento = {
        summary: `Cita: ${info.servicio_nombre}`,
        description: `Cita con ${info.empleado_nombre} para ${info.servicio_nombre}. Precio: $${info.servicio_precio}`,
        start: {
          dateTime: fecha_hora_inicio,
          timeZone: 'America/Mexico_City'
        },
        end: {
          dateTime: fecha_hora_fin,
          timeZone: 'America/Mexico_City'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 horas antes
            { method: 'popup', minutes: 60 } // 1 hora antes
          ]
        }
      };
      
      const response = await calendar.events.insert({
        calendarId: calendario.calendar_id,
        resource: evento
      });
      
      // Guardar referencia del evento
      const eventoCalendarioSql = `
        INSERT INTO eventos_google_calendar (usuario_id, cita_id, tipo_evento, datos_evento, event_id_calendar, estado, created_at, updated_at)
        VALUES (?, ?, 'cita_confirmada', ?, ?, 'creado', NOW(), NOW())
      `;
      
      const datosEvento = JSON.stringify({
        fecha_hora_inicio,
        fecha_hora_fin,
        empleado_nombre: info.empleado_nombre,
        servicio_nombre: info.servicio_nombre,
        precio: info.servicio_precio
      });
      
      await query(eventoCalendarioSql, [usuario_id, cita_id, datosEvento, response.data.id]);
      
      console.log('✅ Evento creado en Google Calendar:', response.data.id);
      
    } catch (error) {
      console.error('❌ Error creando evento en Google Calendar:', error);
      
      // Registrar el error pero no fallar la transacción
      const errorSql = `
        INSERT INTO eventos_google_calendar (usuario_id, cita_id, tipo_evento, datos_evento, estado, error_mensaje, created_at, updated_at)
        VALUES (?, ?, 'cita_confirmada', ?, 'error', ?, NOW(), NOW())
      `;
      
      try {
        await query(errorSql, [datos.usuario_id, datos.cita_id, JSON.stringify(datos), error.message]);
      } catch (dbError) {
        console.error('❌ Error guardando error de Google Calendar:', dbError);
      }
    }
  }
  
  /**
   * Enviar notificación de recordatorio
   * @param {Object} datos - Datos de la cita
   */
  static async enviarRecordatorioCita(datos) {
    try {
      const { usuario_id, cita_id, fecha_hora_inicio } = datos;
      
      // Obtener información de la cita
      const infoSql = `
        SELECT 
          CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
          CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
          s.nombre as servicio_nombre
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u ON cl.usuario_id = u.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios eu ON e.usuario_id = eu.id
        INNER JOIN cita_servicio cs ON c.id = cs.cita_id
        INNER JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.id = ?
      `;
      
      const [info] = await query(infoSql, [cita_id]);
      
      if (!info) {
        throw new Error('No se pudo obtener información de la cita');
      }
      
      // Crear notificación de recordatorio
      const notificacionSql = `
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos_adicionales, leida, created_at, updated_at)
        VALUES (?, 'recordatorio_cita', ?, ?, ?, 0, NOW(), NOW())
      `;
      
      const titulo = 'Recordatorio de Cita';
      const hora = formatearFechaHora(fecha_hora_inicio, 'solo_hora');
      const mensaje = `Recordatorio: Tienes una cita mañana para ${info.servicio_nombre} con ${info.empleado_nombre} a las ${hora}.`;
      const datosAdicionales = JSON.stringify({
        cita_id,
        fecha_hora_inicio,
        empleado_nombre: info.empleado_nombre,
        servicio_nombre: info.servicio_nombre
      });
      
      await query(notificacionSql, [usuario_id, titulo, mensaje, datosAdicionales]);
      
      console.log('✅ Recordatorio de cita enviado');
      
    } catch (error) {
      console.error('❌ Error enviando recordatorio de cita:', error);
      throw error;
    }
  }
  
  /**
   * Enviar notificación de cancelación
   * @param {Object} datos - Datos de la cita cancelada
   */
  static async enviarNotificacionCancelacion(datos) {
    try {
      const { usuario_id, cita_id, fecha_hora_inicio, motivo_cancelacion } = datos;
      
      // Obtener información de la cita
      const infoSql = `
        SELECT 
          CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
          CONCAT(eu.nombre, ' ', eu.apellido) as empleado_nombre,
          s.nombre as servicio_nombre
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u ON cl.usuario_id = u.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios eu ON e.usuario_id = eu.id
        INNER JOIN cita_servicio cs ON c.id = cs.cita_id
        INNER JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.id = ?
      `;
      
      const [info] = await query(infoSql, [cita_id]);
      
      if (!info) {
        throw new Error('No se pudo obtener información de la cita');
      }
      
      // Crear notificación de cancelación
      const notificacionSql = `
        INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, datos_adicionales, leida, created_at, updated_at)
        VALUES (?, 'cita_cancelada', ?, ?, ?, 0, NOW(), NOW())
      `;
      
      const titulo = 'Cita Cancelada';
      const mensaje = `Tu cita para ${info.servicio_nombre} con ${info.empleado_nombre} ha sido cancelada.${motivo_cancelacion ? ` Motivo: ${motivo_cancelacion}` : ''}`;
      const datosAdicionales = JSON.stringify({
        cita_id,
        fecha_hora_inicio,
        empleado_nombre: info.empleado_nombre,
        servicio_nombre: info.servicio_nombre,
        motivo_cancelacion
      });
      
      await query(notificacionSql, [usuario_id, titulo, mensaje, datosAdicionales]);
      
      console.log('✅ Notificación de cancelación enviada');
      
    } catch (error) {
      console.error('❌ Error enviando notificación de cancelación:', error);
      throw error;
    }
  }

  async enviarNotificacionesConfirmacion(citaId) {
    try {
      console.log('🔔 [notificacionService.enviarNotificacionesConfirmacion] Enviando todas las notificaciones para cita:', citaId);
      
      const promesas = [];
      
      // Enviar email de confirmación
      promesas.push(
        emailService.enviarConfirmacionCita(citaId)
          .catch(error => console.error('❌ Error enviando email:', error))
      );
      
      // Crear evento en Google Calendar
      promesas.push(
        googleCalendarService.crearEventoCita(citaId)
          .catch(error => console.error('❌ Error creando evento en Google Calendar:', error))
      );
      
      // Enviar notificación push al cliente
      promesas.push(
        notificacionPushService.enviarNotificacionConfirmacion(citaId)
          .catch(error => console.error('❌ Error enviando notificación push al cliente:', error))
      );
      
      // Enviar notificación push al empleado
      promesas.push(
        notificacionPushService.enviarNotificacionEmpleado(citaId)
          .catch(error => console.error('❌ Error enviando notificación push al empleado:', error))
      );
      
      await Promise.allSettled(promesas);
      
      console.log('✅ [notificacionService.enviarNotificacionesConfirmacion] Todas las notificaciones procesadas');
      
    } catch (error) {
      console.error('❌ [notificacionService.enviarNotificacionesConfirmacion] Error general:', error);
      throw error;
    }
  }

  async enviarNotificacionesRecordatorio(citaId) {
    try {
      console.log('🔔 [notificacionService.enviarNotificacionesRecordatorio] Enviando recordatorios para cita:', citaId);
      
      const promesas = [];
      
      // Enviar email de recordatorio
      promesas.push(
        emailService.enviarRecordatorioCita(citaId)
          .catch(error => console.error('❌ Error enviando email de recordatorio:', error))
      );
      
      // Enviar notificación push de recordatorio
      promesas.push(
        notificacionPushService.enviarNotificacionRecordatorio(citaId)
          .catch(error => console.error('❌ Error enviando notificación push de recordatorio:', error))
      );
      
      await Promise.allSettled(promesas);
      
      console.log('✅ [notificacionService.enviarNotificacionesRecordatorio] Recordatorios enviados');
      
    } catch (error) {
      console.error('❌ [notificacionService.enviarNotificacionesRecordatorio] Error general:', error);
      throw error;
    }
  }

  async actualizarNotificacionesCita(citaId) {
    try {
      console.log('🔔 [notificacionService.actualizarNotificacionesCita] Actualizando notificaciones para cita:', citaId);
      
      // Actualizar evento en Google Calendar
      await googleCalendarService.actualizarEventoCita(citaId)
        .catch(error => console.error('❌ Error actualizando evento en Google Calendar:', error));
      
      console.log('✅ [notificacionService.actualizarNotificacionesCita] Notificaciones actualizadas');
      
    } catch (error) {
      console.error('❌ [notificacionService.actualizarNotificacionesCita] Error general:', error);
      throw error;
    }
  }

  async cancelarNotificacionesCita(citaId) {
    try {
      console.log('🔔 [notificacionService.cancelarNotificacionesCita] Cancelando notificaciones para cita:', citaId);
      
      // Cancelar evento en Google Calendar
      await googleCalendarService.cancelarEventoCita(citaId)
        .catch(error => console.error('❌ Error cancelando evento en Google Calendar:', error));
      
      console.log('✅ [notificacionService.cancelarNotificacionesCita] Notificaciones canceladas');
      
    } catch (error) {
      console.error('❌ [notificacionService.cancelarNotificacionesCita] Error general:', error);
      throw error;
    }
  }

  async programarRecordatorios() {
    try {
      console.log('⏰ [notificacionService.programarRecordatorios] Programando recordatorios automáticos');
      
      // Obtener citas para mañana
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const citasSql = `
        SELECT c.id
        FROM citas c
        INNER JOIN estados_citas ec ON c.estado_id = ec.id
        WHERE DATE(c.fecha) = ? 
          AND ec.nombre IN ('Confirmada', 'Pendiente')
          AND c.recordatorio_enviado = 0
      `;
      
      const citas = await query(citasSql, [tomorrowStr]);
      
      console.log(`📅 [notificacionService.programarRecordatorios] Encontradas ${citas.length} citas para recordar`);
      
      for (const cita of citas) {
        try {
          await this.enviarNotificacionesRecordatorio(cita.id);
          
          // Marcar recordatorio como enviado
          await query('UPDATE citas SET recordatorio_enviado = 1 WHERE id = ?', [cita.id]);
          
        } catch (error) {
          console.error(`❌ Error enviando recordatorio para cita ${cita.id}:`, error);
        }
      }
      
      console.log('✅ [notificacionService.programarRecordatorios] Recordatorios programados completados');
      
    } catch (error) {
      console.error('❌ [notificacionService.programarRecordatorios] Error general:', error);
      throw error;
    }
  }
}

module.exports = new NotificacionService(); 