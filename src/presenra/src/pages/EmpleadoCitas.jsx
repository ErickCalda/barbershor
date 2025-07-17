import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Avatar,
  Badge
} from '@mui/material';
import {
  Schedule,
  Person,
  Event,
  Add,
  Delete,
  Edit,
  Visibility,
  CalendarToday,
  TrendingUp,
  WorkOff
} from '@mui/icons-material';
import api from '../api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EmpleadoCitas() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Datos
  const [citas, setCitas] = useState([]);
  const [ausencias, setAusencias] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [empleadoInfo, setEmpleadoInfo] = useState({});

  // Estados para diálogos
  const [openAusenciaDialog, setOpenAusenciaDialog] = useState(false);
  const [ausenciaData, setAusenciaData] = useState({
    fecha: '',
    motivo: '',
    tipo: 'personal'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar citas del empleado
      const citasResponse = await api.get('/empleado-citas/citas');
      setCitas(citasResponse.data.citas || []);

      // Cargar ausencias
      const ausenciasResponse = await api.get('/empleado-citas/ausencias');
      setAusencias(ausenciasResponse.data.ausencias || []);

      // Cargar estadísticas
      const statsResponse = await api.get('/empleado-citas/estadisticas');
      setEstadisticas(statsResponse.data.data || {});

      // Cargar información del empleado
      const empleadoResponse = await api.get('/empleado-citas/info');
      setEmpleadoInfo(empleadoResponse.data.data.empleado || {});

    } catch (error) {
      setError('Error al cargar datos: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSolicitarAusencia = async () => {
    try {
      setLoading(true);
      await api.post('/empleado-citas/ausencias', ausenciaData);
      setSuccess('Ausencia solicitada exitosamente');
      setOpenAusenciaDialog(false);
      setAusenciaData({ fecha: '', motivo: '', tipo: 'personal' });
      cargarDatos(); // Recargar datos
    } catch (error) {
      setError('Error al solicitar ausencia: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarAusencia = async (ausenciaId) => {
    try {
      setLoading(true);
      await api.delete(`/empleado-citas/ausencias/${ausenciaId}`);
      setSuccess('Ausencia cancelada exitosamente');
      cargarDatos(); // Recargar datos
    } catch (error) {
      setError('Error al cancelar ausencia: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'confirmada':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'cancelada':
        return 'error';
      case 'completada':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderCitas = () => (
    <Grid container spacing={3}>
      {citas.length === 0 ? (
        <Grid item xs={12}>
          <Alert severity="info">
            No tienes citas programadas
          </Alert>
        </Grid>
      ) : (
        citas.map((cita) => (
          <Grid item xs={12} md={6} lg={4} key={cita.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {cita.cliente?.nombre} {cita.cliente?.apellido}
                  </Typography>
                  <Chip 
                    label={cita.estado} 
                    color={getEstadoColor(cita.estado)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <CalendarToday sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  {new Date(cita.fecha).toLocaleDateString('es-ES')}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <Schedule sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  {cita.horario}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <Person sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  {cita.servicios?.map(s => s.nombre).join(', ')}
                </Typography>

                <Typography variant="h6" color="primary" gutterBottom>
                  ${cita.total}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<Visibility />}>
                  Ver Detalles
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  const renderAusencias = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Mis Ausencias
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenAusenciaDialog(true)}
        >
          Solicitar Ausencia
        </Button>
      </Box>

      <List>
        {ausencias.length === 0 ? (
          <Alert severity="info">
            No tienes ausencias registradas
          </Alert>
        ) : (
          ausencias.map((ausencia) => (
            <ListItem key={ausencia.id} divider>
              <ListItemText
                primary={`${new Date(ausencia.fecha).toLocaleDateString('es-ES')} - ${ausencia.tipo}`}
                secondary={ausencia.motivo}
              />
              <ListItemSecondaryAction>
                <Chip 
                  label={ausencia.estado} 
                  color={ausencia.estado === 'aprobada' ? 'success' : 'warning'}
                  size="small"
                  sx={{ mr: 1 }}
                />
                {ausencia.estado === 'pendiente' && (
                  <IconButton
                    edge="end"
                    onClick={() => handleCancelarAusencia(ausencia.id)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );

  const renderEstadisticas = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="h4">
                  {estadisticas.citasCompletadas || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Citas Completadas
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                <Schedule />
              </Avatar>
              <Box>
                <Typography variant="h4">
                  {estadisticas.citasPendientes || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Citas Pendientes
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                <WorkOff />
              </Avatar>
              <Box>
                <Typography variant="h4">
                  {estadisticas.ausenciasAprobadas || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ausencias Aprobadas
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información del Empleado
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Nombre:</strong> {empleadoInfo.nombre} {empleadoInfo.apellido}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {empleadoInfo.email}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Especialidades:</strong> {empleadoInfo.especialidades?.join(', ')}
                </Typography>
                <Typography variant="body1">
                  <strong>Experiencia:</strong> {empleadoInfo.experiencia} años
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Panel de Empleado
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

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Mis Citas" />
          <Tab label="Ausencias" />
          <Tab label="Estadísticas" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {renderCitas()}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderAusencias()}
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              {renderEstadisticas()}
            </TabPanel>
          </>
        )}
      </Paper>

      {/* Diálogo para solicitar ausencia */}
      <Dialog open={openAusenciaDialog} onClose={() => setOpenAusenciaDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Solicitar Ausencia</DialogTitle>
        <DialogContent>
          <TextField
            type="date"
            label="Fecha"
            value={ausenciaData.fecha}
            onChange={(e) => setAusenciaData({ ...ausenciaData, fecha: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de Ausencia</InputLabel>
            <Select
              value={ausenciaData.tipo}
              onChange={(e) => setAusenciaData({ ...ausenciaData, tipo: e.target.value })}
              label="Tipo de Ausencia"
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="medica">Médica</MenuItem>
              <MenuItem value="vacaciones">Vacaciones</MenuItem>
              <MenuItem value="otro">Otro</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Motivo"
            value={ausenciaData.motivo}
            onChange={(e) => setAusenciaData({ ...ausenciaData, motivo: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAusenciaDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSolicitarAusencia} 
            variant="contained"
            disabled={!ausenciaData.fecha || !ausenciaData.motivo}
          >
            Solicitar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 