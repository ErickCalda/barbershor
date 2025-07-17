import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Empleados from './pages/Empleados';
import Servicios from './pages/Servicios';
import Productos from './pages/Productos';
import Citas from './pages/Citas';
import Clientes from './pages/Clientes';
import Reservacion from './pages/Reservacion';
import EmpleadoCitas from './pages/EmpleadoCitas';

// Crear tema personalizado
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
});

function RequireAuth({ children }) {
  const idToken = localStorage.getItem('idToken');
  return idToken ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/usuarios" element={<RequireAuth><Usuarios /></RequireAuth>} />
        <Route path="/empleados" element={<RequireAuth><Empleados /></RequireAuth>} />
        <Route path="/servicios" element={<RequireAuth><Servicios /></RequireAuth>} />
        <Route path="/productos" element={<RequireAuth><Productos /></RequireAuth>} />
        <Route path="/citas" element={<RequireAuth><Citas /></RequireAuth>} />
        <Route path="/clientes" element={<RequireAuth><Clientes /></RequireAuth>} />
          <Route path="/reservacion" element={<RequireAuth><Reservacion /></RequireAuth>} />
          <Route path="/empleado-citas" element={<RequireAuth><EmpleadoCitas /></RequireAuth>} />
        {/* Placeholders para recursos adicionales */}
        <Route path="/ventas" element={<RequireAuth><div>Ventas (CRUD)</div></RequireAuth>} />
        <Route path="/pagos" element={<RequireAuth><div>Pagos (CRUD)</div></RequireAuth>} />
        <Route path="/configuracion" element={<RequireAuth><div>Configuración</div></RequireAuth>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}
