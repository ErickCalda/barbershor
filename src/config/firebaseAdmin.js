const admin = require('firebase-admin');
require('dotenv').config();

/**
 * Firebase Admin SDK initialization
 * Inicializa Firebase Admin SDK usando variables de entorno
 */
const initializeFirebaseAdmin = () => {
  // Si ya está inicializado, no hacer nada
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin SDK ya está inicializado');
    return admin.apps[0];
  }

  try {
    // Verificar que las variables de entorno necesarias existan
    const requiredEnvVars = [
      'GOOGLE_TYPE',
      'GOOGLE_PROJECT_ID',
      'GOOGLE_PRIVATE_KEY_ID',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_CLIENT_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.log('⚠️ Firebase Admin SDK: Variables de entorno faltantes:', missingVars.join(', '));
      console.log('💡 Para usar notificaciones push, necesitas configurar las credenciales de Firebase en el archivo .env');
      return null;
    }

    // Crear objeto de credenciales desde variables de entorno
    const serviceAccount = {
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: process.env.GOOGLE_AUTH_URI,
      token_uri: process.env.GOOGLE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
    };

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK inicializado correctamente');
    return app;
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
    console.log('💡 Para usar notificaciones push, necesitas las credenciales de servicio de Firebase');
    return null;
  }
};

// Inicializar Firebase Admin SDK
const firebaseApp = initializeFirebaseAdmin();

module.exports = { admin, firebaseApp }; 