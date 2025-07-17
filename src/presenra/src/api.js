import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar el idToken de Google a cada petición
api.interceptors.request.use((config) => {
  const idToken = localStorage.getItem('idToken');
  if (idToken) {
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
});

// Función para obtener el token actualizado
const getCurrentToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token fresco
    const token = await user.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error obteniendo token:', error);
    throw error;
  }
};

// Función para verificar si el token está válido
export const verifyToken = async () => {
  try {
    const token = await getCurrentToken();
    const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verificando token:', error);
    return { success: false, code: 'TOKEN_ERROR' };
  }
};

// Función para renovar token automáticamente
const refreshTokenIfNeeded = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }
    
    // Verificar si el token está próximo a expirar (5 minutos antes)
    const tokenResult = await user.getIdTokenResult();
    const expirationTime = tokenResult.expirationTime;
    const currentTime = new Date();
    const timeUntilExpiration = new Date(expirationTime) - currentTime;
    
    // Si el token expira en menos de 5 minutos, renovarlo
    if (timeUntilExpiration < 5 * 60 * 1000) {
      console.log('🔄 Renovando token de Firebase...');
      await user.getIdToken(true);
      console.log('✅ Token renovado exitosamente');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error renovando token:', error);
    return false;
  }
};

// Función para hacer peticiones con manejo automático de tokens
export const apiRequest = async (endpoint, options = {}) => {
  try {
    // Renovar token si es necesario
    await refreshTokenIfNeeded();
    
    // Obtener token actual
    const token = await getCurrentToken();
    
    // Configurar headers
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Hacer la petición
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    // Si el token expiró, intentar renovar y reintentar
    if (response.status === 401) {
      const errorData = await response.json();
      
      if (errorData.code === 'TOKEN_EXPIRED') {
        console.log('🔄 Token expirado, renovando...');
        
        // Renovar token
        const user = auth.currentUser;
        if (user) {
          await user.getIdToken(true);
          
          // Reintentar la petición con el nuevo token
          const newToken = await getCurrentToken();
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${newToken}`
            }
          });
          
          return retryResponse;
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error en apiRequest:', error);
    throw error;
  }
};

// Función para registrar token FCM
export const registrarTokenFCM = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notificaciones/registrar-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        token_dispositivo: token,
        plataforma: 'web'
      })
    });

    if (response.ok) {
      console.log('Token FCM registrado exitosamente');
      return true;
    } else {
      console.error('Error registrando token FCM');
      return false;
    }
  } catch (error) {
    console.error('Error registrando token FCM:', error);
    return false;
  }
};

export default api; 