// Configuración de Firebase para login con Google y FCM
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configuración de FCM
export const messaging = getMessaging(app);

// Función para obtener el token FCM
export const obtenerTokenFCM = async () => {
  try {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return null;
    }

    // Solicitar permisos de notificación
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permisos de notificación denegados');
      return null;
    }

    // Obtener el token FCM
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });

    if (token) {
      console.log('Token FCM obtenido:', token);
      return token;
    } else {
      console.log('No se pudo obtener el token FCM');
      return null;
    }
  } catch (error) {
    console.error('Error obteniendo token FCM:', error);
    return null;
  }
};

// Función para escuchar mensajes en primer plano
export const escucharMensajesFCM = (callback) => {
  return onMessage(messaging, (payload) => {
    console.log('Mensaje recibido en primer plano:', payload);
    callback(payload);
  });
}; 