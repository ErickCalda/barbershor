import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Chip, Box, IconButton, Tooltip, Alert
} from '@mui/material';
import { Edit, Delete, Add, Visibility } from '@mui/icons-material';
import api from '../api';

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [form, setForm] = useState({ 
    usuario_id: '', 
    titulo: '', 
    biografia: '', 
    fecha_contratacion: '', 
    numero_seguro_social: '', 
    salario_base: '', 
    comision_porcentaje: 0, 
    activo: 1 
  });
  const [editId, setEditId] = useState(null);

  const fetchEmpleados = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 [Empleados] Iniciando fetch de empleados...');
      const res = await api.get('/empleados');
      console.log('🔍 [Empleados] Respuesta completa:', res);
      console.log('🔍 [Empleados] Datos recibidos:', res.data);
      console.log('🔍 [Empleados] Tipo de datos:', typeof res.data);
      console.log('🔍 [Empleados] Es array?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const empleadosData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Empleados] Array de empleados procesado:', empleadosData);
      setEmpleados(empleadosData);
      console.log('🔍 [Empleados] Estado actualizado con', empleadosData.length, 'empleados');
    } catch (error) {
      console.error('❌ [Empleados] Error fetching empleados:', error);
      setError('Error al cargar empleados: ' + (error.response?.data?.mensaje || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      console.log('🔍 [Empleados] Iniciando fetch de usuarios...');
      const res = await api.get('/usuarios');
      console.log('🔍 [Empleados] Usuarios recibidos:', res.data);
      console.log('🔍 [Empleados] Tipo de datos usuarios:', typeof res.data);
      console.log('🔍 [Empleados] Es array usuarios?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const usuariosData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Empleados] Array de usuarios procesado:', usuariosData);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('❌ [Empleados] Error fetching usuarios:', error);
      setError('Error al cargar usuarios: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  useEffect(() => { 
    console.log('🔍 [Empleados] Componente montado, iniciando fetches...');
    fetchEmpleados(); 
    fetchUsuarios();
  }, []);

  const handleOpen = (empleado = null, view = false) => {
    if (empleado) {
      setForm({
        usuario_id: empleado.usuario_id || '',
        titulo: empleado.titulo || '',
        biografia: empleado.biografia || '',
        fecha_contratacion: empleado.fecha_contratacion ? empleado.fecha_contratacion.split('T')[0] : '',
        numero_seguro_social: empleado.numero_seguro_social || '',
        salario_base: empleado.salario_base || '',
        comision_porcentaje: empleado.comision_porcentaje || 0,
        activo: empleado.activo !== undefined ? empleado.activo : 1
      });
      setEditId(empleado.id);
    } else {
      setForm({ 
        usuario_id: '', 
        titulo: '', 
        biografia: '', 
        fecha_contratacion: '', 
        numero_seguro_social: '', 
        salario_base: '', 
        comision_porcentaje: 0, 
        activo: 1 
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
        await api.put(`/empleados/${editId}`, form);
      } else {
        await api.post('/empleados', form);
      }
      handleClose();
      fetchEmpleados();
    } catch (error) {
      console.error('Error saving empleado:', error);
      setError('Error al guardar empleado: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar empleado?')) {
      try {
        await api.delete(`/empleados/${id}`);
        fetchEmpleados();
      } catch (error) {
        console.error('Error deleting empleado:', error);
        setError('Error al eliminar empleado: ' + (error.response?.data?.mensaje || error.message));
      }
    }
  };

  const getUsuarioNombre = (usuarioId) => {
    const usuario = usuarios.find(u => u.id === usuarioId);
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : 'N/A';
  };

  console.log('🔍 [Empleados] Renderizando con', empleados.length, 'empleados:', empleados);

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Empleados</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Nuevo Empleado
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Cargando empleados...</Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total de empleados: {empleados.length}
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Fecha Contratación</TableCell>
                <TableCell>Salario Base</TableCell>
                <TableCell>Comisión</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empleados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay empleados registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                empleados.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.id}</TableCell>
                    <TableCell>{getUsuarioNombre(emp.usuario_id)}</TableCell>
                    <TableCell>{emp.titulo || 'N/A'}</TableCell>
                    <TableCell>{emp.fecha_contratacion ? new Date(emp.fecha_contratacion).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>${emp.salario_base || 0}</TableCell>
                    <TableCell>{emp.comision_porcentaje || 0}%</TableCell>
                    <TableCell>
                      <Chip 
                        label={emp.activo ? 'Activo' : 'Inactivo'} 
                        color={emp.activo ? 'success' : 'error'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" onClick={() => handleOpen(emp, true)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpen(emp)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDelete(emp.id)}>
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
          {viewMode ? 'Ver Empleado' : (editId ? 'Editar Empleado' : 'Nuevo Empleado')}
        </DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Usuario</InputLabel>
              <Select
                name="usuario_id"
                value={form.usuario_id}
                onChange={handleChange}
                disabled={viewMode}
              >
                {usuarios.map(usuario => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.nombre} {usuario.apellido} ({usuario.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Título"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Fecha de Contratación"
              name="fecha_contratacion"
              type="date"
              value={form.fecha_contratacion}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Número de Seguro Social"
              name="numero_seguro_social"
              value={form.numero_seguro_social}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Salario Base"
              name="salario_base"
              type="number"
              value={form.salario_base}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Comisión (%)"
              name="comision_porcentaje"
              type="number"
              value={form.comision_porcentaje}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="activo"
                value={form.activo}
                onChange={handleChange}
                disabled={viewMode}
              >
                <MenuItem value={1}>Activo</MenuItem>
                <MenuItem value={0}>Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Biografía"
            name="biografia"
            value={form.biografia}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            disabled={viewMode}
            sx={{ mt: 2 }}
          />
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
