const { admin } = require('../config/firebaseAdmin');
const { query } = require('../config/database');
const emailService = require('./emailService');
const { formatearFechaHora } = require('../utils/dateUtils');

class NotificacionPushService {
  constructor() {
    try {
      // Verificar si Firebase Admin está inicializado
      if (admin.apps.length > 0) {
        this.messaging = admin.messaging();
        this.firebaseAvailable = true;
        console.log('✅ NotificacionPushService: Firebase Admin SDK disponible');
      } else {
        this.firebaseAvailable = false;
        console.log('⚠️ NotificacionPushService: Firebase Admin SDK no disponible');
      }
    } catch (error) {
      this.firebaseAvailable = false;
      console.log('⚠️ NotificacionPushService: Error al inicializar Firebase Admin SDK');
    }
  }

  async enviarNotificacionConfirmacion(citaId) {
    try {
      console.log('📱 [notificacionPushService.enviarNotificacionConfirmacion] Enviando confirmación para cita:', citaId);
      
      // Verificar si Firebase está disponible
      if (!this.firebaseAvailable) {
        console.log('⚠️ [notificacionPushService.enviarNotificacionConfirmacion] Firebase no disponible, saltando notificación push');
        return;
      }
      
      // Obtener información de la cita
      const citaSql = `
        SELECT 
          c.id,
          c.fecha_hora_inicio,
          c.cliente_id,
          u_cliente.nombre as cliente_nombre,
          CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
          GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
        INNER JOIN cita_servicio cs ON c.id = cs.cita_id
        INNER JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.id = ?
        GROUP BY c.id
      `;
      
      const [cita] = await query(citaSql, [citaId]);
      
      if (!cita) {
        throw new Error('Cita no encontrada');
      }

      // Obtener tokens FCM del cliente desde la tabla notificaciones_push
      const tokensSql = `
        SELECT np.token_dispositivo 
        FROM notificaciones_push np
        INNER JOIN clientes cl ON np.usuario_id = cl.usuario_id
        WHERE cl.id = ? AND np.activo = 1 AND np.token_dispositivo IS NOT NULL
      `;
      const tokens = await query(tokensSql, [cita.cliente_id]);
      
      if (tokens.length === 0) {
        console.log('⚠️ [notificacionPushService.enviarNotificacionConfirmacion] No se encontraron tokens FCM para el cliente');
        return;
      }

      const fcmTokens = tokens.map(t => t.token_dispositivo);
      const fecha = formatearFechaHora(cita.fecha_hora_inicio, 'corta');
      const hora = formatearFechaHora(cita.fecha_hora_inicio, 'solo_hora');

      const message = {
        notification: {
          title: '✅ Cita Confirmada',
          body: `Tu cita con ${cita.empleado_nombre} para ${fecha} a las ${hora} ha sido confirmada`
        },
        data: {
          tipo: 'confirmacion_cita',
          citaId: cita.id.toString(),
          fecha: fecha,
          hora: hora,
          empleado: cita.empleado_nombre,
          servicios: cita.servicios
        },
        tokens: fcmTokens
      };

      const response = await this.messaging.sendMulticast(message);
      
      console.log('✅ [notificacionPushService.enviarNotificacionConfirmacion] Notificación enviada exitosamente');
      console.log('📊 Respuesta:', {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      // Limpiar tokens inválidos
      if (response.failureCount > 0) {
        const tokensToDelete = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            tokensToDelete.push(fcmTokens[idx]);
          }
        });
        
        if (tokensToDelete.length > 0) {
          await this.limpiarTokensInvalidos(tokensToDelete);
        }
      }

      return response;
    } catch (error) {
      console.error('❌ [notificacionPushService.enviarNotificacionConfirmacion] Error:', error);
      // No lanzar error, solo log
      return;
    }
  }

  async enviarNotificacionRecordatorio(citaId) {
    try {
      console.log('📱 [notificacionPushService.enviarNotificacionRecordatorio] Enviando recordatorio para cita:', citaId);
      
      // Verificar si Firebase está disponible
      if (!this.firebaseAvailable) {
        console.log('⚠️ [notificacionPushService.enviarNotificacionRecordatorio] Firebase no disponible, saltando notificación push');
        return;
      }
      
      // Obtener información de la cita y tokens del cliente
      const citaSql = `
        SELECT 
          c.id,
          c.fecha_hora_inicio,
          c.cliente_id,
          u_cliente.nombre as cliente_nombre,
          CONCAT(u_empleado.nombre, ' ', u_empleado.apellido) as empleado_nombre,
          GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
        INNER JOIN cita_servicio cs ON c.id = cs.cita_id
        INNER JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.id = ?
        GROUP BY c.id
      `;
      
      const [cita] = await query(citaSql, [citaId]);
      
      if (!cita) {
        throw new Error('Cita no encontrada');
      }

      // Obtener tokens FCM del cliente desde la tabla notificaciones_push
      const tokensSql = `
        SELECT np.token_dispositivo 
        FROM notificaciones_push np
        INNER JOIN clientes cl ON np.usuario_id = cl.usuario_id
        WHERE cl.id = ? AND np.activo = 1 AND np.token_dispositivo IS NOT NULL
      `;
      const tokens = await query(tokensSql, [cita.cliente_id]);
      
      if (tokens.length === 0) {
        console.log('⚠️ [notificacionPushService.enviarNotificacionRecordatorio] No se encontraron tokens FCM para el cliente');
        return;
      }

      const fcmTokens = tokens.map(t => t.token_dispositivo);
      const fecha = formatearFechaHora(cita.fecha_hora_inicio, 'corta');
      const hora = formatearFechaHora(cita.fecha_hora_inicio, 'solo_hora');

      const message = {
        notification: {
          title: '⏰ Recordatorio de Cita',
          body: `Recuerda tu cita mañana con ${cita.empleado_nombre} a las ${hora}`
        },
        data: {
          tipo: 'recordatorio_cita',
          citaId: cita.id.toString(),
          fecha: fecha,
          hora: hora,
          empleado: cita.empleado_nombre,
          servicios: cita.servicios
        },
        tokens: fcmTokens
      };

      const response = await this.messaging.sendMulticast(message);
      
      console.log('✅ [notificacionPushService.enviarNotificacionRecordatorio] Notificación enviada exitosamente');
      console.log('📊 Respuesta:', {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return response;
    } catch (error) {
      console.error('❌ [notificacionPushService.enviarNotificacionRecordatorio] Error:', error);
      // No lanzar error, solo log
      return;
    }
  }

  async enviarNotificacionEmpleado(citaId) {
    try {
      console.log('📱 [notificacionPushService.enviarNotificacionEmpleado] Enviando notificación al empleado para cita:', citaId);
      
      // Obtener información de la cita y tokens del empleado
      const citaSql = `
        SELECT 
          c.id,
          c.fecha_hora_inicio,
          c.empleado_id,
          u_cliente.nombre as cliente_nombre,
          u_empleado.nombre as empleado_nombre,
          u_empleado.email as empleado_email,
          GROUP_CONCAT(s.nombre SEPARATOR ', ') as servicios
        FROM citas c
        INNER JOIN clientes cl ON c.cliente_id = cl.id
        INNER JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
        INNER JOIN empleados e ON c.empleado_id = e.id
        INNER JOIN usuarios u_empleado ON e.usuario_id = u_empleado.id
        INNER JOIN cita_servicio cs ON c.id = cs.cita_id
        INNER JOIN servicios s ON cs.servicio_id = s.id
        WHERE c.id = ?
        GROUP BY c.id
      `;
      
      const [cita] = await query(citaSql, [citaId]);
      
      if (!cita) {
        throw new Error('Cita no encontrada');
      }

      // Obtener tokens FCM del empleado desde la tabla notificaciones_push
      const tokensSql = `
        SELECT np.token_dispositivo 
        FROM notificaciones_push np
        INNER JOIN empleados e ON np.usuario_id = e.usuario_id
        WHERE e.id = ? AND np.activo = 1 AND np.token_dispositivo IS NOT NULL
      `;
      const tokens = await query(tokensSql, [cita.empleado_id]);
      
      if (tokens.length === 0) {
        console.log('⚠️ [notificacionPushService.enviarNotificacionEmpleado] No se encontraron tokens FCM para el empleado. Enviando correo electrónico.');
        // Enviar correo electrónico al empleado
        if (cita.empleado_email) {
          const fecha = formatearFechaHora(cita.fecha_hora_inicio, 'corta');
          const hora = formatearFechaHora(cita.fecha_hora_inicio, 'solo_hora');
          const asunto = '📅 Nueva Cita Asignada';
          const mensaje = `Tienes una cita con ${cita.cliente_nombre} el ${fecha} a las ${hora}. Servicios: ${cita.servicios}`;
          await emailService.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cita.empleado_email,
            subject: asunto,
            html: `<p>${mensaje}</p>`
          });
          console.log('✅ [notificacionPushService.enviarNotificacionEmpleado] Correo enviado al empleado.');
        } else {
          console.log('❌ [notificacionPushService.enviarNotificacionEmpleado] El empleado no tiene correo registrado.');
        }
        return;
      }

      // Verificar si Firebase está disponible para notificaciones push
      if (!this.firebaseAvailable) {
        console.log('⚠️ [notificacionPushService.enviarNotificacionEmpleado] Firebase no disponible, enviando solo correo electrónico.');
        // Enviar correo electrónico al empleado como respaldo
        if (cita.empleado_email) {
          const fecha = formatearFechaHora(cita.fecha_hora_inicio, 'corta');
          const hora = formatearFechaHora(cita.fecha_hora_inicio, 'solo_hora');
          const asunto = '📅 Nueva Cita Asignada';
          const mensaje = `Tienes una cita con ${cita.cliente_nombre} el ${fecha} a las ${hora}. Servicios: ${cita.servicios}`;
          await emailService.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cita.empleado_email,
            subject: asunto,
            html: `<p>${mensaje}</p>`
          });
          console.log('✅ [notificacionPushService.enviarNotificacionEmpleado] Correo enviado al empleado.');
        }
        return;
      }

      const fcmTokens = tokens.map(t => t.token_dispositivo);
      const fecha = formatearFechaHora(cita.fecha_hora_inicio, 'corta');
      const hora = formatearFechaHora(cita.fecha_hora_inicio, 'solo_hora');

      const message = {
        notification: {
          title: '📅 Nueva Cita Asignada',
          body: `Tienes una cita con ${cita.cliente_nombre} el ${fecha} a las ${hora}`
        },
        data: {
          tipo: 'nueva_cita_empleado',
          citaId: cita.id.toString(),
          fecha: fecha,
          hora: hora,
          cliente: cita.cliente_nombre,
          servicios: cita.servicios
        },
        tokens: fcmTokens
      };

      const response = await this.messaging.sendMulticast(message);
      
      console.log('✅ [notificacionPushService.enviarNotificacionEmpleado] Notificación enviada exitosamente');
      console.log('📊 Respuesta:', {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return response;
    } catch (error) {
      console.error('❌ [notificacionPushService.enviarNotificacionEmpleado] Error:', error);
      // No lanzar error, solo log
      return;
    }
  }

  async limpiarTokensInvalidos(tokens) {
    try {
      for (const token of tokens) {
        await query('UPDATE usuarios SET fcm_token = NULL WHERE fcm_token = ?', [token]);
      }
      console.log('✅ [notificacionPushService.limpiarTokensInvalidos] Tokens inválidos limpiados');
    } catch (error) {
      console.error('❌ [notificacionPushService.limpiarTokensInvalidos] Error:', error);
    }
  }
}

module.exports = new NotificacionPushService(); 