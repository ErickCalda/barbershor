import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Box } from '@mui/material';
import api from '../api';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', rol_id: 3 });
  const [editId, setEditId] = useState(null);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 [Usuarios] Iniciando fetch de usuarios...');
      const res = await api.get('/usuarios');
      console.log('🔍 [Usuarios] Respuesta completa:', res);
      console.log('🔍 [Usuarios] Datos recibidos:', res.data);
      console.log('🔍 [Usuarios] Tipo de datos:', typeof res.data);
      console.log('🔍 [Usuarios] Es array?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const usuariosData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Usuarios] Array de usuarios procesado:', usuariosData);
      setUsuarios(usuariosData);
      console.log('🔍 [Usuarios] Estado actualizado con', usuariosData.length, 'usuarios');
    } catch (error) {
      console.error('❌ [Usuarios] Error fetching usuarios:', error);
      setError('Error al cargar usuarios: ' + (error.response?.data?.mensaje || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    console.log('🔍 [Usuarios] Componente montado, iniciando fetch...');
    fetchUsuarios(); 
  }, []);

  const handleOpen = (usuario = null) => {
    if (usuario) {
      setForm(usuario);
      setEditId(usuario.id);
    } else {
      setForm({ nombre: '', apellido: '', email: '', password: '', rol_id: 3 });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editId) {
        await api.put(`/usuarios/${editId}`, form);
      } else {
        await api.post('/usuarios', form);
      }
      handleClose();
      fetchUsuarios();
    } catch (error) {
      console.error('Error saving usuario:', error);
      setError('Error al guardar usuario: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar usuario?')) {
      try {
        await api.delete(`/usuarios/${id}`);
        fetchUsuarios();
      } catch (error) {
        console.error('Error deleting usuario:', error);
        setError('Error al eliminar usuario: ' + (error.response?.data?.mensaje || error.message));
      }
    }
  };

  console.log('🔍 [Usuarios] Renderizando con', usuarios.length, 'usuarios:', usuarios);

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Usuarios</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>Nuevo Usuario</Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Cargando usuarios...</Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total de usuarios: {usuarios.length}
          </Typography>
          
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay usuarios registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.nombre || 'N/A'}</TableCell>
                    <TableCell>{u.apellido || 'N/A'}</TableCell>
                    <TableCell>{u.email || 'N/A'}</TableCell>
                    <TableCell>{u.rol_nombre || 'N/A'}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleOpen(u)}>Editar</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(u.id)}>Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} fullWidth />
          <TextField margin="dense" label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
          {!editId && <TextField margin="dense" label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} fullWidth />}
          <TextField margin="dense" label="Rol ID" name="rol_id" value={form.rol_id} onChange={handleChange} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 