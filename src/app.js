// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Importar configuraciones
const { inicializarBaseDatos } = require('./config/database');
const { admin } = require('./config/firebaseAdmin');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const citaRoutes = require('./routes/citaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const especialidadRoutes = require('./routes/especialidadRoutes');
const ausenciaEmpleadoRoutes = require('./routes/ausenciaEmpleadoRoutes');
const carruselRoutes = require('./routes/carruselRoutes');
const categoriaGaleriaRoutes = require('./routes/categoriaGaleriaRoutes');
const galeriaRoutes = require('./routes/galeriaRoutes');
const promocionRoutes = require('./routes/promocionRoutes');
const resenaRoutes = require('./routes/resenaRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const horarioEmpleadoRoutes = require('./routes/horarioEmpleadoRoutes');
const fichaClienteRoutes = require('./routes/fichaClienteRoutes');
const multimediaRoutes = require('./routes/multimediaRoutes');
const calendarioGoogleRoutes = require('./routes/calendarioGoogleRoutes');
const configuracionGoogleRoutes = require('./routes/configuracionGoogleRoutes');
const correoEnviadoRoutes = require('./routes/correoEnviadoRoutes');
const correoProgramadoRoutes = require('./routes/correoProgramadoRoutes');
const detalleVentaProductoRoutes = require('./routes/detalleVentaProductoRoutes');
const empleadoEspecialidadRoutes = require('./routes/empleadoEspecialidadRoutes');
const empleadoServicioRoutes = require('./routes/empleadoServicioRoutes');
const eventoGoogleCalendarRoutes = require('./routes/eventoGoogleCalendarRoutes');
const historialServicioClienteRoutes = require('./routes/historialServicioClienteRoutes');
const notificacionPushEnviadaRoutes = require('./routes/notificacionPushEnviadaRoutes');
const plantillaCorreoRoutes = require('./routes/plantillaCorreoRoutes');
const logRoutes = require('./routes/logRoutes');
const tipoMultimediaRoutes = require('./routes/tipoMultimediaRoutes');
const notificacionPushRoutes = require('./routes/notificacionPushRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const rolRoutes = require('./routes/rolRoutes');
const metodoPagoRoutes = require('./routes/metodoPagoRoutes');
const estadoPagoRoutes = require('./routes/estadoPagoRoutes');
const estadoCitaRoutes = require('./routes/estadoCitaRoutes');
const ventaProductoRoutes = require('./routes/ventaProductoRoutes');
const categoriaServicioRoutes = require('./routes/categoriaServicioRoutes');
const categoriaProductoRoutes = require('./routes/categoriaProductoRoutes');
const reservacionRoutes = require('./routes/reservacionRoutes');
const empleadoCitaRoutes = require('./routes/empleadoCitaRoutes');

// Importar middleware
const { errorHandler } = require('./middleware/errorHandler');
const asyncHandler = require('./middleware/asyncHandler');

const app = express();

// Configuración de rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 100, // límite de 100 requests por ventana
//   message: {
//     success: false,
//     mensaje: 'Demasiadas solicitudes desde esta IP, inténtalo de nuevo más tarde.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Configuración de rate limiting para autenticación
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutos
//   max: 5, // límite de 5 intentos de login por ventana
//   message: {
//     success: false,
//     mensaje: 'Demasiados intentos de autenticación, inténtalo de nuevo más tarde.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Configuración de CORS
app.use(cors({
  origin: ['https://fronten-berveria.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));



// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
  
}

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Middleware para servir archivos estáticos (imágenes)
app.use('/uploads', express.static('uploads'));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting general
// app.use(limiter);

// Inicializar servicios
const inicializarServicios = async () => {
  try {
    // Inicializar base de datos
    await inicializarBaseDatos();
    
    console.log('✅ Todos los servicios inicializados correctamente');
  } catch (error) {
    console.error('❌ Error inicializando servicios:', error);
    process.exit(1);
  }
};

// Rutas de autenticación con rate limiting específico
// app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auth', authRoutes);

// Rutas principales de la aplicación
app.use('/api/empleados', empleadoRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/especialidades', especialidadRoutes);
app.use('/api/ausencias-empleado', ausenciaEmpleadoRoutes);
app.use('/api/carruseles', carruselRoutes);
app.use('/api/categorias-galeria', categoriaGaleriaRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/promociones', promocionRoutes);
app.use('/api/resenas', resenaRoutes);
app.use('/api/configuraciones', configuracionRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/horarios-empleado', horarioEmpleadoRoutes);
app.use('/api/fichas-cliente', fichaClienteRoutes);
app.use('/api/multimedia', multimediaRoutes);
app.use('/api/calendarios-google', calendarioGoogleRoutes);
app.use('/api/configuraciones-google', configuracionGoogleRoutes);
app.use('/api/correos-enviados', correoEnviadoRoutes);
app.use('/api/correos-programados', correoProgramadoRoutes);
app.use('/api/detalles-venta-producto', detalleVentaProductoRoutes);
app.use('/api/empleados-especialidad', empleadoEspecialidadRoutes);
app.use('/api/empleados-servicio', empleadoServicioRoutes);
app.use('/api/eventos-google-calendar', eventoGoogleCalendarRoutes);
app.use('/api/historial-servicio-cliente', historialServicioClienteRoutes);
app.use('/api/notificaciones-push-enviadas', notificacionPushEnviadaRoutes);
app.use('/api/plantillas-correo', plantillaCorreoRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/tipos-multimedia', tipoMultimediaRoutes);
app.use('/api/notificaciones-push', notificacionPushRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/metodos-pago', metodoPagoRoutes);
app.use('/api/estados-pago', estadoPagoRoutes);
app.use('/api/estados-cita', estadoCitaRoutes);
app.use('/api/ventas-producto', ventaProductoRoutes);
app.use('/api/categorias-servicio', categoriaServicioRoutes);
app.use('/api/categorias-producto', categoriaProductoRoutes);
app.use('/api/reservacion', reservacionRoutes);
app.use('/api/empleado-citas', empleadoCitaRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    mensaje: 'API de Barbería funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      empleados: '/api/empleados',
      servicios: '/api/servicios',
      clientes: '/api/clientes',
      citas: '/api/citas',
      productos: '/api/productos',
      categorias: '/api/categorias',
      ventas: '/api/ventas',
      especialidades: '/api/especialidades',
      ausenciasEmpleado: '/api/ausencias-empleado',
      carruseles: '/api/carruseles',
      categoriasGaleria: '/api/categorias-galeria',
      galeria: '/api/galeria',
      promociones: '/api/promociones',
      resenas: '/api/resenas',
      configuraciones: '/api/configuraciones',
      pagos: '/api/pagos',
      notificaciones: '/api/notificaciones',
      horariosEmpleado: '/api/horarios-empleado',
      fichasCliente: '/api/fichas-cliente',
      multimedia: '/api/multimedia'
    }
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    mensaje: 'Bienvenido a la API de Barbería',
    endpoints: {
      auth: '/api/auth',
      empleados: '/api/empleados',
      servicios: '/api/servicios',
      clientes: '/api/clientes',
      citas: '/api/citas',
      productos: '/api/productos',
      categorias: '/api/categorias',
      ventas: '/api/ventas',
      especialidades: '/api/especialidades',
      ausenciasEmpleado: '/api/ausencias-empleado',
      carruseles: '/api/carruseles',
      categoriasGaleria: '/api/categorias-galeria',
      galeria: '/api/galeria',
      promociones: '/api/promociones',
      resenas: '/api/resenas',
      configuraciones: '/api/configuraciones',
      pagos: '/api/pagos',
      notificaciones: '/api/notificaciones',
      horariosEmpleado: '/api/horarios-empleado',
      fichasCliente: '/api/fichas-cliente',
      multimedia: '/api/multimedia',
      health: '/api/health'
    },
    documentation: 'Documentación disponible en /api/docs'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    mensaje: `Ruta ${req.originalUrl} no encontrada`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Configuración del puerto
const PORT = process.env.PORT || 5000;

// Inicializar aplicación
const iniciarServidor = async () => {
  try {
    await inicializarServicios();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
      console.log(`📱 API disponible en http://localhost:${PORT}`);
      console.log(`🔐 Endpoints de autenticación en http://localhost:${PORT}/api/auth`);
      console.log(`👥 Gestión de empleados en http://localhost:${PORT}/api/empleados`);
      console.log(`✂️ Gestión de servicios en http://localhost:${PORT}/api/servicios`);
      console.log(`👤 Gestión de clientes en http://localhost:${PORT}/api/clientes`);
      console.log(`📅 Gestión de citas en http://localhost:${PORT}/api/citas`);
      console.log(`🛍️ Gestión de productos en http://localhost:${PORT}/api/productos`);
      console.log(`📂 Gestión de categorías en http://localhost:${PORT}/api/categorias`);
      console.log(`💰 Gestión de ventas en http://localhost:${PORT}/api/ventas`);
      console.log(`🎯 Gestión de especialidades en http://localhost:${PORT}/api/especialidades`);
      console.log(`📋 Gestión de ausencias en http://localhost:${PORT}/api/ausencias-empleado`);
      console.log(`🖼️ Gestión de carruseles en http://localhost:${PORT}/api/carruseles`);
      console.log(`📁 Gestión de categorías de galería en http://localhost:${PORT}/api/categorias-galeria`);
      console.log(`🖼️ Gestión de galería en http://localhost:${PORT}/api/galeria`);
      console.log(`🎉 Gestión de promociones en http://localhost:${PORT}/api/promociones`);
      console.log(`⭐ Gestión de reseñas en http://localhost:${PORT}/api/resenas`);
      console.log(`⚙️ Gestión de configuraciones en http://localhost:${PORT}/api/configuraciones`);
      console.log(`💳 Gestión de pagos en http://localhost:${PORT}/api/pagos`);
      console.log(`🔔 Gestión de notificaciones en http://localhost:${PORT}/api/notificaciones`);
      console.log(`⏰ Gestión de horarios en http://localhost:${PORT}/api/horarios-empleado`);
      console.log(`📋 Gestión de fichas de clientes en http://localhost:${PORT}/api/fichas-cliente`);
      console.log(`📁 Gestión de multimedia en http://localhost:${PORT}/api/multimedia`);
      console.log(`💚 Health check en http://localhost:${PORT}/api/health`);
    });

    // Manejar errores del servidor
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: El puerto ${PORT} ya está en uso.`);
        console.log(`💡 Soluciones:`);
        console.log(`   1. Terminar el proceso que usa el puerto ${PORT}:`);
        console.log(`      Windows: netstat -ano | findstr :${PORT} && taskkill /PID <PID> /F`);
        console.log(`      Linux/Mac: lsof -ti:${PORT} | xargs kill -9`);
        console.log(`   2. Usar un puerto diferente: PORT=${PORT + 1} npm start`);
        console.log(`   3. Esperar unos segundos y reintentar`);
        process.exit(1);
      } else {
        console.error('❌ Error del servidor:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

// Iniciar servidor
iniciarServidor();

module.exports = app;
