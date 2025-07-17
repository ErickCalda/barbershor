import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, obtenerTokenFCM } from '../firebase';
import { registrarTokenFCM } from '../api';

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Guarda el idToken de Google
      localStorage.setItem('idToken', idToken);
      
      // Obtener y registrar token FCM
      try {
        const fcmToken = await obtenerTokenFCM();
        if (fcmToken) {
          await registrarTokenFCM(fcmToken);
          console.log('Token FCM registrado exitosamente');
        }
      } catch (fcmError) {
        console.warn('No se pudo registrar token FCM:', fcmError);
        // No bloquear el login si falla el registro del token FCM
      }
      
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Error en el login: ' + (error.message || ''));
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Box textAlign="center">
        <Typography variant="h4" gutterBottom>
          Iniciar sesión
        </Typography>
        <Button variant="contained" color="primary" onClick={handleLogin}>
          Iniciar sesión con Google
        </Button>
      </Box>
    </Container>
  );
} 