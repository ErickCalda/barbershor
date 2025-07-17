import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../api';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fecha_nacimiento: '',
    genero: '',
    notas_preferencias: ''
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 [Clientes] Iniciando fetch de clientes...');
      const res = await api.get('/clientes');
      console.log('🔍 [Clientes] Respuesta completa:', res);
      console.log('🔍 [Clientes] Datos recibidos:', res.data);
      console.log('🔍 [Clientes] Tipo de datos:', typeof res.data);
      console.log('🔍 [Clientes] Es array?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const clientesData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Clientes] Array de clientes procesado:', clientesData);
      setClientes(clientesData);
      console.log('🔍 [Clientes] Estado actualizado con', clientesData.length, 'clientes');
    } catch (error) {
      console.error('❌ [Clientes] Error fetching clientes:', error);
      setError('Error al cargar clientes: ' + (error.response?.data?.mensaje || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        fecha_nacimiento: cliente.fecha_nacimiento ? cliente.fecha_nacimiento.split('T')[0] : '',
        genero: cliente.genero || '',
        notas_preferencias: cliente.notas_preferencias || ''
      });
    } else {
      setEditingCliente(null);
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        fecha_nacimiento: '',
        genero: '',
        notas_preferencias: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCliente(null);
    setFormData({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      fecha_nacimiento: '',
      genero: '',
      notas_preferencias: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.id}`, formData);
      } else {
        await api.post('/clientes', formData);
      }
      handleCloseDialog();
      fetchClientes();
    } catch (error) {
      console.error('Error saving cliente:', error);
      setError('Error al guardar el cliente');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await api.delete(`/clientes/${id}`);
        fetchClientes();
      } catch (error) {
        console.error('Error deleting cliente:', error);
        setError('Error al eliminar el cliente');
      }
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  console.log('🔍 [Clientes] Renderizando con', clientes.length, 'clientes:', clientes);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Total de clientes: {clientes.length}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Género</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay clientes registrados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                  <TableCell>{cliente.nombre || 'N/A'}</TableCell>
                  <TableCell>{cliente.apellido || 'N/A'}</TableCell>
                  <TableCell>{cliente.email || 'N/A'}</TableCell>
                  <TableCell>{cliente.telefono || 'N/A'}</TableCell>
                  <TableCell>{cliente.genero || 'N/A'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(cliente)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(cliente.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField
                name="nombre"
                label="Nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="apellido"
                label="Apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="telefono"
                label="Teléfono"
                value={formData.telefono}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                name="fecha_nacimiento"
                label="Fecha de Nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={handleInputChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormControl fullWidth>
                <InputLabel>Género</InputLabel>
                <Select
                  name="genero"
                  value={formData.genero}
                  onChange={handleInputChange}
                  label="Género"
                >
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Femenino</MenuItem>
                  <MenuItem value="O">Otro</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              name="notas_preferencias"
              label="Notas y Preferencias"
              value={formData.notas_preferencias}
              onChange={handleInputChange}
              multiline
              rows={4}
              fullWidth
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingCliente ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
