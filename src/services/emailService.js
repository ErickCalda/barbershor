const nodemailer = require('nodemailer');
const { query } = require('../config/database');
const { formatearFechaParaEmail, formatearRangoFechas } = require('../utils/dateUtils');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async enviarConfirmacionCita(citaId) {
    try {
      console.log('📧 [emailService.enviarConfirmacionCita] Enviando confirmación para cita:', citaId);
      
      // Obtener información de la cita
      const citaSql = `
        SELECT 
          c.id,
          c.fecha_hora_inicio,
          c.fecha_hora_fin,
          CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
          u_cliente.email as cliente_email,
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

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: cita.cliente_email,
        subject: '✅ Confirmación de Cita - BarberShot',
        html: this.generarTemplateConfirmacion(cita)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ [emailService.enviarConfirmacionCita] Email enviado exitosamente');
      
      return result;
    } catch (error) {
      console.error('❌ [emailService.enviarConfirmacionCita] Error:', error);
      throw error;
    }
  }

  async enviarRecordatorioCita(citaId) {
    try {
      console.log('📧 [emailService.enviarRecordatorioCita] Enviando recordatorio para cita:', citaId);
      
      // Obtener información de la cita
      const citaSql = `
        SELECT 
          c.id,
          c.fecha_hora_inicio,
          c.fecha_hora_fin,
          CONCAT(u_cliente.nombre, ' ', u_cliente.apellido) as cliente_nombre,
          u_cliente.email as cliente_email,
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

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: cita.cliente_email,
        subject: '⏰ Recordatorio de Cita - BarberShot',
        html: this.generarTemplateRecordatorio(cita)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ [emailService.enviarRecordatorioCita] Email enviado exitosamente');
      
      return result;
    } catch (error) {
      console.error('❌ [emailService.enviarRecordatorioCita] Error:', error);
      throw error;
    }
  }

  generarTemplateConfirmacion(cita) {
    console.log('📧 [emailService] Datos de cita recibidos:', {
      fecha_hora_inicio: cita.fecha_hora_inicio,
      fecha_hora_fin: cita.fecha_hora_fin,
      tipo_inicio: typeof cita.fecha_hora_inicio,
      tipo_fin: typeof cita.fecha_hora_fin
    });
    
    const fechaFormateada = formatearFechaParaEmail(cita.fecha_hora_inicio);
    const rangoHoras = formatearRangoFechas(cita.fecha_hora_inicio, cita.fecha_hora_fin);
    
    console.log('📧 [emailService] Fecha formateada:', fechaFormateada);
    console.log('📧 [emailService] Rango horas:', rangoHoras);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmación de Cita</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .button { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✂️ BarberShot</h1>
            <h2>✅ Confirmación de Cita</h2>
          </div>
          
          <div class="content">
            <p>Hola <strong>${cita.cliente_nombre}</strong>,</p>
            
            <p>Tu cita ha sido confirmada exitosamente. Aquí están los detalles:</p>
            
            <div class="details">
              <h3>📅 Detalles de la Cita</h3>
              <p><strong>Fecha:</strong> ${fechaFormateada.fecha}</p>
              <p><strong>Hora:</strong> ${rangoHoras.rangoCompleto}</p>
              <p><strong>Barbero:</strong> ${cita.empleado_nombre}</p>
              <p><strong>Servicios:</strong> ${cita.servicios}</p>
            </div>
            
            <p>Te esperamos en nuestro local. Si necesitas cancelar o modificar tu cita, contáctanos con anticipación.</p>
            
            <p>¡Gracias por elegir BarberShot!</p>
          </div>
          
          <div class="footer">
            <p>BarberShot - Tu estilo, nuestra pasión</p>
            <p>📧 info@barbershot.com | 📞 (123) 456-7890</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generarTemplateRecordatorio(cita) {
    const fechaFormateada = formatearFechaParaEmail(cita.fecha_hora_inicio);
    const rangoHoras = formatearRangoFechas(cita.fecha_hora_inicio, cita.fecha_hora_fin);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recordatorio de Cita</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .button { background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✂️ BarberShot</h1>
            <h2>⏰ Recordatorio de Cita</h2>
          </div>
          
          <div class="content">
            <p>Hola <strong>${cita.cliente_nombre}</strong>,</p>
            
            <p>Te recordamos que tienes una cita programada para mañana:</p>
            
            <div class="details">
              <h3>📅 Detalles de la Cita</h3>
              <p><strong>Fecha:</strong> ${fechaFormateada.fecha}</p>
              <p><strong>Hora:</strong> ${rangoHoras.rangoCompleto}</p>
              <p><strong>Barbero:</strong> ${cita.empleado_nombre}</p>
              <p><strong>Servicios:</strong> ${cita.servicios}</p>
            </div>
            
            <p>Por favor, llega 10 minutos antes de tu hora programada.</p>
            
            <p>¡Te esperamos!</p>
          </div>
          
          <div class="footer">
            <p>BarberShot - Tu estilo, nuestra pasión</p>
            <p>📧 info@barbershot.com | 📞 (123) 456-7890</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService(); 
