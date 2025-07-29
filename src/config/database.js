// src/config/database.js
/**
 * Configuración de la conexión a la base de datos MySQL
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true,
  connectTimeout: 10000, // 10 segundos para conectar
  acquireTimeout: 10000  // 10 segundos para adquirir conexión del pool
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para inicializar la base de datos
const inicializarBaseDatos = async () => {
  try {
    // Verificar conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    
    // Verificar que las tablas principales existan
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('usuarios', 'roles', 'clientes', 'empleados', 'citas', 'servicios')
    `, [dbConfig.database]);
    
    if (tables.length < 6) {
      throw new Error('Faltan tablas principales en la base de datos');
    }
    
    console.log('✅ Tablas principales verificadas correctamente');
    
    // Verificar estructura de la tabla usuarios
    const [userColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'usuarios'
    `, [dbConfig.database]);
    
    const requiredColumns = [
      'id', 'firebase_uid', 'email', 'nombre', 'apellido', 
      'telefono', 'foto_perfil', 'rol_id', 'activo', 
      'fecha_registro', 'ultimo_acceso', 'notificacion_correo',
      'notificacion_push', 'notificacion_sms', 'recordatorio_horas_antes',
      'created_at', 'updated_at'
    ];
    
    const existingColumns = userColumns.map(col => col.COLUMN_NAME);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.warn('⚠️ Columnas faltantes en tabla usuarios:', missingColumns);
    }
    
    connection.release();
    console.log('✅ Estructura de base de datos verificada correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    throw error;
  }
};

// Función para cerrar el pool de conexiones
const cerrarConexion = async () => {
  try {
    await pool.end();
    console.log('✅ Conexión a la base de datos cerrada correctamente');
  } catch (error) {
    console.error('❌ Error cerrando la conexión:', error);
  }
};

// Middleware para manejar errores de conexión
const manejarErrorConexion = (error) => {
  console.error('Error de conexión a la base de datos:', error);
  
  if (error.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Conexión perdida. Reintentando...');
  } else if (error.code === 'ER_CON_COUNT_ERROR') {
    console.log('Demasiadas conexiones a la base de datos.');
  } else if (error.code === 'ECONNREFUSED') {
    console.log('Conexión rechazada por la base de datos.');
  } else {
    console.log('Error desconocido de la base de datos.');
  }
};

// Event listeners para el pool
pool.on('connection', (connection) => {
  console.log('Nueva conexión establecida con la base de datos');
  
  connection.on('error', (error) => {
    console.error('Error en conexión individual:', error);
  });
});

pool.on('error', manejarErrorConexion);

// Función utilitaria para ejecutar queries
async function query(sql, params) {
  console.log('SQL:', sql);
  console.log('Parámetros:', params);

  try {
    // Ejecutar la query y obtener resultados
    const [rows] = await pool.execute(sql, params);

    // Logs detallados de la respuesta
    console.log('🔍 [database.query] Query ejecutada exitosamente');
    console.log('🔍 [database.query] Filas retornadas:', rows.length);

    if (rows.length > 0) {
      console.log('🔍 [database.query] Primera fila de ejemplo:', {
        keys: Object.keys(rows[0]),
        sampleData: Object.fromEntries(
          Object.entries(rows[0]).slice(0, 5) // Mostrar primeros 5 campos
        )
      });
    }

    return rows;
  } catch (error) {
    console.error('❌ [database.query] Error ejecutando query:', error);
    console.error('❌ [database.query] SQL que causó el error:', sql);
    console.error('❌ [database.query] Parámetros que causaron el error:', params);
    console.error('❌ [database.query] Código de error MySQL:', error.code);
    console.error('❌ [database.query] Número de error MySQL:', error.errno);
    console.error('❌ [database.query] SQL State:', error.sqlState);
    console.error('❌ [database.query] Stack trace:', error.stack);
    throw error;
  }
}

module.exports = {
  pool,
  inicializarBaseDatos,
  cerrarConexion,
  dbConfig,
  query
};
