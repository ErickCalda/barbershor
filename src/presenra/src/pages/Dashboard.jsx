import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Box, Grid, Paper, Card, CardContent, CardActions } from '@mui/material';
import { 
  People, Work, LocalOffer, Inventory, Schedule, ShoppingCart, 
  Person, Payment, Settings, Logout 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  
  // Estado para pruebas de ventas
  const [ventaId, setVentaId] = useState('');
  const [venta, setVenta] = useState(null);
  const [estadoPago, setEstadoPago] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [notas, setNotas] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/profile')
      .then(res => {
        console.log('Datos completos del usuario:', res.data.usuario);
        setUsuario(res.data.usuario);
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setError('Usuario no encontrado. Contacta al administrador.');
        } else if (err.response?.status === 401) {
          window.location.href = '/login';
        } else {
          setError('Error al cargar el perfil.');
        }
      })
      .finally(() => setLoading(false));

    // Cargar estadísticas básicas
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Aquí podrías hacer llamadas a endpoints de estadísticas si los tienes
      // Por ahora usamos datos de ejemplo
      setStats({
        usuarios: 0,
        empleados: 0,
        servicios: 0,
        productos: 0,
        citas: 0,
        ventas: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      localStorage.removeItem('idToken');
      window.location.href = '/login';
    }
  };

  // Obtener venta por ID
  const handleBuscarVenta = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    try {
      const res = await api.get(`/ventas/${ventaId}`);
      setVenta(res.data.data);
      setEstadoPago(res.data.data.estado_pago_id || '');
      setReferenciaPago(res.data.data.referencia_pago || '');
      setNotas(res.data.data.notas || '');
    } catch (err) {
      setVenta(null);
      setError(err.response?.data?.mensaje || 'Error al buscar venta');
    }
  };

  // Actualizar estado de pago
  const handleActualizarEstado = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    try {
      const res = await api.patch(`/ventas/${ventaId}/estado-pago`, {
        estado_pago_id: estadoPago,
        referencia_pago: referenciaPago,
        notas,
      });
      setMensaje(res.data.mensaje);
      setVenta(res.data.data);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar estado de pago');
    }
  };

  const menuItems = [
    { title: 'Usuarios', icon: <People />, path: '/usuarios', color: '#1976d2' },
    { title: 'Empleados', icon: <Work />, path: '/empleados', color: '#388e3c' },
    { title: 'Servicios', icon: <LocalOffer />, path: '/servicios', color: '#f57c00' },
    { title: 'Productos', icon: <Inventory />, path: '/productos', color: '#7b1fa2' },
    { title: 'Citas', icon: <Schedule />, path: '/citas', color: '#d32f2f' },
    { title: 'Reservación', icon: <Schedule />, path: '/reservacion', color: '#ff9800' },
    { title: 'Mis Citas', icon: <Person />, path: '/empleado-citas', color: '#4caf50' },
    { title: 'Ventas', icon: <ShoppingCart />, path: '/ventas', color: '#1976d2' },
    { title: 'Clientes', icon: <Person />, path: '/clientes', color: '#388e3c' },
    { title: 'Pagos', icon: <Payment />, path: '/pagos', color: '#f57c00' },
    { title: 'Configuración', icon: <Settings />, path: '/configuracion', color: '#7b1fa2' }
  ];

  if (loading) return <Typography>Cargando...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5">Bienvenido, {usuario?.nombre} {usuario?.apellido}</Typography>
            <Typography variant="body1">Email: {usuario?.email}</Typography>
            <Typography variant="body2">Rol: {usuario?.rol_nombre}</Typography>
          </Box>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleLogout}
            startIcon={<Logout />}
          >
            Cerrar sesión
          </Button>
        </Box>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Panel de Administración
      </Typography>

      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid key={item.path} columns={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
              onClick={() => navigate(item.path)}
            >
              <CardContent sx={{ textAlign: 'center', pb: 1 }}>
                <Box sx={{ color: item.color, mb: 1 }}>
                  {item.icon}
                </Box>
                <Typography variant="h6" component="div">
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats[item.title.toLowerCase()] || 0} registros
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                <Button size="small" color="primary">
                  Gestionar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Prueba de API: Ventas
        </Typography>
        <form onSubmit={handleBuscarVenta} style={{ marginBottom: 16 }}>
          <input
            type="number"
            placeholder="ID de venta"
            value={ventaId}
            onChange={e => setVentaId(e.target.value)}
            required
          />
          <button type="submit">Buscar venta</button>
        </form>
        {venta && (
          <div style={{ marginBottom: 16 }}>
            <div><b>ID:</b> {venta.id}</div>
            <div><b>Estado de pago:</b> {venta.estado_pago_id}</div>
            <div><b>Referencia de pago:</b> {venta.referencia_pago}</div>
            <div><b>Notas:</b> {venta.notas}</div>
            <form onSubmit={handleActualizarEstado} style={{ marginTop: 8 }}>
              <input
                type="number"
                placeholder="Nuevo estado de pago"
                value={estadoPago}
                onChange={e => setEstadoPago(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Referencia de pago"
                value={referenciaPago}
                onChange={e => setReferenciaPago(e.target.value)}
              />
              <input
                type="text"
                placeholder="Notas"
                value={notas}
                onChange={e => setNotas(e.target.value)}
              />
              <button type="submit">Actualizar estado de pago</button>
            </form>
          </div>
        )}
        {mensaje && <div style={{ color: 'green' }}>{mensaje}</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </Paper>
    </Container>
  );
} 