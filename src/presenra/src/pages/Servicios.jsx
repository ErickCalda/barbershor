import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Chip, Box, IconButton, Tooltip, Switch, FormControlLabel, Alert
} from '@mui/material';
import { Edit, Delete, Add, Visibility } from '@mui/icons-material';
import api from '../api';

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [form, setForm] = useState({ 
    nombre: '', 
    descripcion: '', 
    precio: '', 
    duracion_minutos: '', 
    categoria_id: '', 
    imagen_url: '', 
    activo: 1, 
    destacado: 0, 
    requiere_cita: 1, 
    color_servicio: '#1976d2', 
    icono_servicio: '' 
  });
  const [editId, setEditId] = useState(null);

  const fetchServicios = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 [Servicios] Iniciando fetch de servicios...');
      const res = await api.get('/servicios');
      console.log('🔍 [Servicios] Respuesta completa:', res);
      console.log('🔍 [Servicios] Datos recibidos:', res.data);
      console.log('🔍 [Servicios] Tipo de datos:', typeof res.data);
      console.log('🔍 [Servicios] Es array?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const serviciosData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Servicios] Array de servicios procesado:', serviciosData);
      setServicios(serviciosData);
      console.log('🔍 [Servicios] Estado actualizado con', serviciosData.length, 'servicios');
    } catch (error) {
      console.error('❌ [Servicios] Error fetching servicios:', error);
      setError('Error al cargar servicios: ' + (error.response?.data?.mensaje || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      console.log('🔍 [Servicios] Iniciando fetch de categorías...');
      const res = await api.get('/categorias-servicio');
      console.log('🔍 [Servicios] Categorías recibidas:', res.data);
      console.log('🔍 [Servicios] Tipo de datos categorías:', typeof res.data);
      console.log('🔍 [Servicios] Es array categorías?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const categoriasData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Servicios] Array de categorías procesado:', categoriasData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('❌ [Servicios] Error fetching categorias:', error);
      setError('Error al cargar categorías: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  useEffect(() => { 
    console.log('🔍 [Servicios] Componente montado, iniciando fetches...');
    fetchServicios(); 
    fetchCategorias();
  }, []);

  const handleOpen = (servicio = null, view = false) => {
    if (servicio) {
      setForm({
        nombre: servicio.nombre || '',
        descripcion: servicio.descripcion || '',
        precio: servicio.precio || '',
        duracion_minutos: servicio.duracion_minutos || '',
        categoria_id: servicio.categoria_id || '',
        imagen_url: servicio.imagen_url || '',
        activo: servicio.activo !== undefined ? servicio.activo : 1,
        destacado: servicio.destacado !== undefined ? servicio.destacado : 0,
        requiere_cita: servicio.requiere_cita !== undefined ? servicio.requiere_cita : 1,
        color_servicio: servicio.color_servicio || '#1976d2',
        icono_servicio: servicio.icono_servicio || ''
      });
      setEditId(servicio.id);
    } else {
      setForm({ 
        nombre: '', 
        descripcion: '', 
        precio: '', 
        duracion_minutos: '', 
        categoria_id: '', 
        imagen_url: '', 
        activo: 1, 
        destacado: 0, 
        requiere_cita: 1, 
        color_servicio: '#1976d2', 
        icono_servicio: '' 
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
        await api.put(`/servicios/${editId}`, form);
      } else {
        await api.post('/servicios', form);
      }
      handleClose();
      fetchServicios();
    } catch (error) {
      console.error('Error saving servicio:', error);
      setError('Error al guardar servicio: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar servicio?')) {
      try {
        await api.delete(`/servicios/${id}`);
        fetchServicios();
      } catch (error) {
        console.error('Error deleting servicio:', error);
        setError('Error al eliminar servicio: ' + (error.response?.data?.mensaje || error.message));
      }
    }
  };

  const getCategoriaNombre = (categoriaId) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'N/A';
  };

  console.log('🔍 [Servicios] Renderizando con', servicios.length, 'servicios:', servicios);

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Servicios</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Nuevo Servicio
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Cargando servicios...</Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total de servicios: {servicios.length}
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Duración</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Destacado</TableCell>
                <TableCell>Requiere Cita</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {servicios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay servicios registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                servicios.map(serv => (
                  <TableRow key={serv.id}>
                    <TableCell>{serv.id}</TableCell>
                    <TableCell>{serv.nombre || 'N/A'}</TableCell>
                    <TableCell>{getCategoriaNombre(serv.categoria_id)}</TableCell>
                    <TableCell>${serv.precio || 0}</TableCell>
                    <TableCell>{serv.duracion_minutos || 0} min</TableCell>
                    <TableCell>
                      <Chip 
                        label={serv.activo ? 'Activo' : 'Inactivo'} 
                        color={serv.activo ? 'success' : 'error'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={serv.destacado ? 'Sí' : 'No'} 
                        color={serv.destacado ? 'primary' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={serv.requiere_cita ? 'Sí' : 'No'} 
                        color={serv.requiere_cita ? 'warning' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" onClick={() => handleOpen(serv, true)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpen(serv)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error" onClick={() => handleDelete(serv.id)}>
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
          {viewMode ? 'Ver Servicio' : (editId ? 'Editar Servicio' : 'Nuevo Servicio')}
        </DialogTitle>
        <DialogContent>
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                name="categoria_id"
                value={form.categoria_id}
                onChange={handleChange}
                disabled={viewMode}
              >
                {categorias.map(categoria => (
                  <MenuItem key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Precio"
              name="precio"
              type="number"
              value={form.precio}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
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

            <TextField
              label="URL de Imagen"
              name="imagen_url"
              value={form.imagen_url}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Color del Servicio"
              name="color_servicio"
              type="color"
              value={form.color_servicio}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Icono del Servicio"
              name="icono_servicio"
              value={form.icono_servicio}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />
          </Box>

          <TextField
            label="Descripción"
            name="descripcion"
            value={form.descripcion}
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
                  checked={form.activo === 1}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked ? 1 : 0 })}
                  disabled={viewMode}
                />
              }
              label="Activo"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.destacado === 1}
                  onChange={(e) => setForm({ ...form, destacado: e.target.checked ? 1 : 0 })}
                  disabled={viewMode}
                />
              }
              label="Destacado"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.requiere_cita === 1}
                  onChange={(e) => setForm({ ...form, requiere_cita: e.target.checked ? 1 : 0 })}
                  disabled={viewMode}
                />
              }
              label="Requiere Cita"
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
