import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Chip, Box, IconButton, Tooltip, Switch, FormControlLabel, Alert
} from '@mui/material';
import { Edit, Delete, Add, Visibility, Schedule } from '@mui/icons-material';
import api from '../api';

export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [form, setForm] = useState({ 
    cliente_id: '', 
    empleado_id: '', 
    servicio_id: '', 
    fecha_hora: '', 
    duracion_minutos: '', 
    estado_id: '', 
    notas: '', 
    precio_total: '', 
    confirmada: 1, 
    recordatorio_enviado: 0 
  });
  const [editId, setEditId] = useState(null);

  const fetchCitas = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 [Citas] Iniciando fetch de citas...');
      const res = await api.get('/citas');
      console.log('🔍 [Citas] Respuesta completa:', res);
      console.log('🔍 [Citas] Datos recibidos:', res.data);
      console.log('🔍 [Citas] Tipo de datos:', typeof res.data);
      console.log('🔍 [Citas] Es array?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const citasData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Citas] Array de citas procesado:', citasData);
      setCitas(citasData);
      console.log('🔍 [Citas] Estado actualizado con', citasData.length, 'citas');
    } catch (error) {
      console.error('❌ [Citas] Error fetching citas:', error);
      setError('Error al cargar citas: ' + (error.response?.data?.mensaje || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      console.log('🔍 [Citas] Iniciando fetch de clientes...');
      const res = await api.get('/clientes');
      console.log('🔍 [Citas] Clientes recibidos:', res.data);
      console.log('🔍 [Citas] Tipo de datos clientes:', typeof res.data);
      console.log('🔍 [Citas] Es array clientes?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const clientesData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Citas] Array de clientes procesado:', clientesData);
      setClientes(clientesData);
    } catch (error) {
      console.error('❌ [Citas] Error fetching clientes:', error);
      setError('Error al cargar clientes: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const fetchEmpleados = async () => {
    try {
      console.log('🔍 [Citas] Iniciando fetch de empleados...');
      const res = await api.get('/empleados');
      console.log('🔍 [Citas] Empleados recibidos:', res.data);
      console.log('🔍 [Citas] Tipo de datos empleados:', typeof res.data);
      console.log('🔍 [Citas] Es array empleados?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const empleadosData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Citas] Array de empleados procesado:', empleadosData);
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('❌ [Citas] Error fetching empleados:', error);
      setError('Error al cargar empleados: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const fetchServicios = async () => {
    try {
      console.log('🔍 [Citas] Iniciando fetch de servicios...');
      const res = await api.get('/servicios');
      console.log('🔍 [Citas] Servicios recibidos:', res.data);
      console.log('🔍 [Citas] Tipo de datos servicios:', typeof res.data);
      console.log('🔍 [Citas] Es array servicios?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const serviciosData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Citas] Array de servicios procesado:', serviciosData);
      setServicios(serviciosData);
    } catch (error) {
      console.error('❌ [Citas] Error fetching servicios:', error);
      setError('Error al cargar servicios: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const fetchEstados = async () => {
    try {
      console.log('🔍 [Citas] Iniciando fetch de estados...');
      const res = await api.get('/estados-cita');
      console.log('🔍 [Citas] Estados recibidos:', res.data);
      console.log('🔍 [Citas] Tipo de datos estados:', typeof res.data);
      console.log('🔍 [Citas] Es array estados?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const estadosData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Citas] Array de estados procesado:', estadosData);
      setEstados(estadosData);
    } catch (error) {
      console.error('❌ [Citas] Error fetching estados:', error);
      setError('Error al cargar estados: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  useEffect(() => { 
    console.log('🔍 [Citas] Componente montado, iniciando fetches...');
    fetchCitas(); 
    fetchClientes();
    fetchEmpleados();
    fetchServicios();
    fetchEstados();
  }, []);

  const handleOpen = (cita = null, view = false) => {
    if (cita) {
      setForm({
        cliente_id: cita.cliente_id || '',
        empleado_id: cita.empleado_id || '',
        servicio_id: cita.servicio_id || '',
        fecha_hora: cita.fecha_hora ? cita.fecha_hora.replace('Z', '').slice(0, 16) : '',
        duracion_minutos: cita.duracion_minutos || '',
        estado_id: cita.estado_id || '',
        notas: cita.notas || '',
        precio_total: cita.precio_total || '',
        confirmada: cita.confirmada !== undefined ? cita.confirmada : 1,
        recordatorio_enviado: cita.recordatorio_enviado !== undefined ? cita.recordatorio_enviado : 0
      });
      setEditId(cita.id);
    } else {
      setForm({ 
        cliente_id: '', 
        empleado_id: '', 
        servicio_id: '', 
        fecha_hora: '', 
        duracion_minutos: '', 
        estado_id: '', 
        notas: '', 
        precio_total: '', 
        confirmada: 1, 
        recordatorio_enviado: 0 
      });
      setEditId(null);
    }
    setViewMode(view);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setViewMode(false);
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/citas/${editId}`, form);
      } else {
        await api.post('/citas', form);
      }
      handleClose();
      fetchCitas();
    } catch (error) {
      console.error('Error saving cita:', error);
      setError('Error al guardar cita: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar cita?')) {
      try {
        await api.delete(`/citas/${id}`);
        fetchCitas();
      } catch (error) {
        console.error('Error deleting cita:', error);
        setError('Error al eliminar cita: ' + (error.response?.data?.mensaje || error.message));
      }
    }
  };

  const getClienteNombre = (clienteId) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'N/A';
  };

  const getEmpleadoNombre = (empleadoId) => {
    const empleado = empleados.find(e => e.id === empleadoId);
    return empleado ? empleado.titulo || 'N/A' : 'N/A';
  };

  const getServicioNombre = (servicioId) => {
    const servicio = servicios.find(s => s.id === servicioId);
    return servicio ? servicio.nombre : 'N/A';
  };

  const getEstadoNombre = (estadoId) => {
    const estado = estados.find(e => e.id === estadoId);
    return estado ? estado.nombre : 'N/A';
  };

  const getEstadoColor = (estadoId) => {
    const estado = estados.find(e => e.id === estadoId);
    if (!estado) return 'default';
    
    switch (estado.nombre?.toLowerCase()) {
      case 'confirmada':
      case 'completada':
        return 'success';
      case 'cancelada':
        return 'error';
      case 'pendiente':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString('es-ES');
  };

  console.log('🔍 [Citas] Renderizando con', citas.length, 'citas:', citas);

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Citas</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Nueva Cita
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Cargando citas...</Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total de citas: {citas.length}
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Empleado</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Fecha y Hora</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Confirmada</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {citas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay citas registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                citas.map(cita => (
                  <TableRow key={cita.id}>
                    <TableCell>{cita.id}</TableCell>
                    <TableCell>{getClienteNombre(cita.cliente_id)}</TableCell>
                    <TableCell>{getEmpleadoNombre(cita.empleado_id)}</TableCell>
                    <TableCell>{getServicioNombre(cita.servicio_id)}</TableCell>
                    <TableCell>{formatDateTime(cita.fecha_hora)}</TableCell>
                    <TableCell>{cita.duracion_minutos || 0} min</TableCell>
                    <TableCell>
                      <Chip 
                        label={getEstadoNombre(cita.estado_id)} 
                        color={getEstadoColor(cita.estado_id)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>${cita.precio_total || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={cita.confirmada ? 'Sí' : 'No'} 
                        color={cita.confirmada ? 'success' : 'warning'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" onClick={() => handleOpen(cita, true)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpen(cita)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDelete(cita.id)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewMode ? 'Ver Cita' : (editId ? 'Editar Cita' : 'Nueva Cita')}
        </DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                name="cliente_id"
                value={form.cliente_id}
                onChange={handleChange}
                disabled={viewMode}
              >
                {clientes.map(cliente => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.nombre} {cliente.apellido}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Empleado</InputLabel>
              <Select
                name="empleado_id"
                value={form.empleado_id}
                onChange={handleChange}
                disabled={viewMode}
              >
                {empleados.map(empleado => (
                  <MenuItem key={empleado.id} value={empleado.id}>
                    {empleado.titulo || 'Sin título'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Servicio</InputLabel>
              <Select
                name="servicio_id"
                value={form.servicio_id}
                onChange={handleChange}
                disabled={viewMode}
              >
                {servicios.map(servicio => (
                  <MenuItem key={servicio.id} value={servicio.id}>
                    {servicio.nombre} - ${servicio.precio}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Fecha y Hora"
              name="fecha_hora"
              type="datetime-local"
              value={form.fecha_hora}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Duración (minutos)"
              name="duracion_minutos"
              type="number"
              value={form.duracion_minutos}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado_id"
                value={form.estado_id}
                onChange={handleChange}
                disabled={viewMode}
              >
                {estados.map(estado => (
                  <MenuItem key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Precio Total"
              name="precio_total"
              type="number"
              value={form.precio_total}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />
          </Box>

          <TextField
            label="Notas"
            name="notas"
            value={form.notas}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            disabled={viewMode}
            sx={{ mt: 2 }}
          />

          <Box display="flex" gap={2} mt={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.confirmada === 1}
                  onChange={(e) => setForm({ ...form, confirmada: e.target.checked ? 1 : 0 })}
                  disabled={viewMode}
                />
              }
              label="Confirmada"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.recordatorio_enviado === 1}
                  onChange={(e) => setForm({ ...form, recordatorio_enviado: e.target.checked ? 1 : 0 })}
                  disabled={viewMode}
                />
              }
              label="Recordatorio Enviado"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cerrar</Button>
          {!viewMode && (
            <Button onClick={handleSubmit} variant="contained">
              {editId ? 'Actualizar' : 'Crear'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}
