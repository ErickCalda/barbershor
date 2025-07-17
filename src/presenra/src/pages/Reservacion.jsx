import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Person,
  Payment,
  ConfirmationNumber,
  Delete,
  Add,
  Remove
} from '@mui/icons-material';
import api from '../api';

const steps = [
  'Seleccionar Servicios',
  'Elegir Barbero',
  'Seleccionar Horario',
  'Confirmar Reservación'
];

export default function Reservacion() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Datos del flujo
  const [servicios, setServicios] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');

  // Cargar servicios disponibles
  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservacion/servicios');
      console.log('Respuesta del API servicios:', response.data);
      setServicios(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      setError('Error al cargar servicios: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservacion/empleados', {
        params: { servicios: serviciosSeleccionados.map(s => s.id) }
      });
      console.log('Respuesta del API empleados:', response.data);
      setEmpleados(response.data.empleados || []);
    } catch (error) {
      console.error('Error al cargar empleados:', error);
      setError('Error al cargar empleados: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const cargarHorarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reservacion/horarios', {
        params: {
          empleadoId: empleadoSeleccionado,
          fecha: fechaSeleccionada,
          servicios: serviciosSeleccionados.map(s => s.id)
        }
      });
      console.log('Respuesta del API horarios:', response.data);
      setHorarios(response.data.horarios || []);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      setError('Error al cargar horarios: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setError('');
    setSuccess('');

    if (activeStep === 0) {
      if (serviciosSeleccionados.length === 0) {
        setError('Debes seleccionar al menos un servicio');
        return;
      }
      await cargarEmpleados();
    } else if (activeStep === 1) {
      if (!empleadoSeleccionado) {
        setError('Debes seleccionar un barbero');
        return;
      }
    } else if (activeStep === 2) {
      if (!horarioSeleccionado || !fechaSeleccionada) {
        setError('Debes seleccionar fecha y horario');
        return;
      }
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleServicioToggle = (servicio) => {
    setServiciosSeleccionados(prev => {
      const existe = prev.find(s => s.id === servicio.id);
      if (existe) {
        return prev.filter(s => s.id !== servicio.id);
      } else {
        return [...prev, { ...servicio, cantidad: 1 }];
      }
    });
  };

  const handleCantidadChange = (servicioId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    
    setServiciosSeleccionados(prev => 
      prev.map(s => 
        s.id === servicioId 
          ? { ...s, cantidad: nuevaCantidad }
          : s
      )
    );
  };

  const calcularTotal = () => {
    return serviciosSeleccionados.reduce((total, servicio) => {
      return total + (servicio.precio * (servicio.cantidad || 1));
    }, 0);
  };

  const procesarReservacion = async () => {
    try {
      setLoading(true);
      const reservacionData = {
        servicios: serviciosSeleccionados.map(s => ({
          id: s.id,
          cantidad: s.cantidad || 1
        })),
        empleadoId: empleadoSeleccionado,
        fecha: fechaSeleccionada,
        horario: horarioSeleccionado,
        total: calcularTotal()
      };

      await api.post('/reservacion/procesar', reservacionData);
      
      // Obtener detalles del empleado seleccionado
      const empleadoSeleccionadoData = empleados.find(e => e.id === empleadoSeleccionado);
      const nombreEmpleado = empleadoSeleccionadoData ? `${empleadoSeleccionadoData.nombre} ${empleadoSeleccionadoData.apellido}` : 'Barbero';
      
      // Formatear fecha para mostrar
      const fechaFormateada = new Date(fechaSeleccionada).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Crear mensaje de éxito detallado
      const mensajeExito = `
        ¡Reservación creada exitosamente! 🎉
        
        📅 Fecha: ${fechaFormateada}
        ⏰ Hora: ${horarioSeleccionado}
        👨‍💼 Barbero: ${nombreEmpleado}
        ✂️ Servicios: ${serviciosSeleccionados.map(s => s.nombre).join(', ')}
        💰 Total: $${calcularTotal()}
        
        Se ha enviado una confirmación por email con todos los detalles.
      `;
      
      setSuccess(mensajeExito);
      
      // Limpiar formulario
      setTimeout(() => {
        setServiciosSeleccionados([]);
        setEmpleadoSeleccionado('');
        setHorarioSeleccionado('');
        setFechaSeleccionada('');
        setActiveStep(0);
        setSuccess('');
      }, 5000); // Aumentar a 5 segundos para que el usuario pueda leer los detalles

    } catch (error) {
      setError('Error al procesar reservación: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const renderServicios = () => (
    <Grid container spacing={3}>
      {servicios.map((servicio) => {
        const seleccionado = serviciosSeleccionados.find(s => s.id === servicio.id);
        return (
          <Grid item xs={12} sm={6} md={4} key={servicio.id}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: seleccionado ? '2px solid #1976d2' : '1px solid #e0e0e0',
                '&:hover': { borderColor: '#1976d2' }
              }}
              onClick={() => handleServicioToggle(servicio)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {servicio.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {servicio.descripcion}
                </Typography>
                <Typography variant="h6" color="primary">
                  ${servicio.precio}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duración: {servicio.duracion} min
                </Typography>
                {seleccionado && (
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      icon={<CheckCircle />} 
                      label="Seleccionado" 
                      color="primary" 
                      variant="outlined"
                    />
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCantidadChange(servicio.id, (seleccionado.cantidad || 1) - 1);
                        }}
                      >
                        <Remove />
                      </IconButton>
                      <Typography>{seleccionado.cantidad || 1}</Typography>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCantidadChange(servicio.id, (seleccionado.cantidad || 1) + 1);
                        }}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderEmpleados = () => (
    <Grid container spacing={3}>
      {empleados.map((empleado) => (
        <Grid item xs={12} sm={6} md={4} key={empleado.id}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: empleadoSeleccionado === empleado.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
              '&:hover': { borderColor: '#1976d2' }
            }}
            onClick={() => setEmpleadoSeleccionado(empleado.id)}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {empleado.nombre} {empleado.apellido}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {empleado.especialidades?.join(', ')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Experiencia: {empleado.experiencia} años
              </Typography>
              {empleadoSeleccionado === empleado.id && (
                <Chip 
                  icon={<CheckCircle />} 
                  label="Seleccionado" 
                  color="primary" 
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderHorarios = () => (
    <Box>
      <TextField
        type="date"
        label="Fecha"
        value={fechaSeleccionada}
        onChange={(e) => setFechaSeleccionada(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 3, minWidth: 200 }}
      />
      
      {fechaSeleccionada && (
        <Button 
          variant="outlined" 
          onClick={cargarHorarios}
          sx={{ ml: 2 }}
        >
          Cargar Horarios
        </Button>
      )}

      {horarios.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {horarios.map((horario) => (
            <Grid item xs={6} sm={4} md={3} key={horario}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  border: horarioSeleccionado === horario ? '2px solid #1976d2' : '1px solid #e0e0e0',
                  '&:hover': { borderColor: '#1976d2' }
                }}
                onClick={() => setHorarioSeleccionado(horario)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">
                    {horario}
                  </Typography>
                  {horarioSeleccionado === horario && (
                    <Chip 
                      icon={<CheckCircle />} 
                      label="Seleccionado" 
                      color="primary" 
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderConfirmacion = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Resumen de la Reservación
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Servicios Seleccionados:
          </Typography>
          <List>
            {serviciosSeleccionados.map((servicio) => (
              <ListItem key={servicio.id}>
                <ListItemText
                  primary={servicio.nombre}
                  secondary={`Cantidad: ${servicio.cantidad || 1} - $${servicio.precio * (servicio.cantidad || 1)}`}
                />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6">
            Total: ${calcularTotal()}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detalles de la Cita:
          </Typography>
          <Typography>
            <strong>Barbero:</strong> {empleados.find(e => e.id === empleadoSeleccionado)?.nombre} {empleados.find(e => e.id === empleadoSeleccionado)?.apellido}
          </Typography>
          <Typography>
            <strong>Fecha:</strong> {fechaSeleccionada}
          </Typography>
          <Typography>
            <strong>Hora:</strong> {horarioSeleccionado}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderServicios();
      case 1:
        return renderEmpleados();
      case 2:
        return renderHorarios();
      case 3:
        return renderConfirmacion();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Reservar Cita
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Atrás
              </Button>
              <Button
                variant="contained"
                onClick={activeStep === steps.length - 1 ? procesarReservacion : handleNext}
                disabled={loading}
              >
                {activeStep === steps.length - 1 ? 'Confirmar Reservación' : 'Siguiente'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
} 