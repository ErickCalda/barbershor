import React, { useEffect, useState } from 'react';
import { 
  Container, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Chip, Box, IconButton, Tooltip, Switch, FormControlLabel, Alert
} from '@mui/material';
import { Edit, Delete, Add, Visibility } from '@mui/icons-material';
import api from '../api';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [form, setForm] = useState({ 
    nombre: '', 
    descripcion: '', 
    precio: '', 
    precio_venta: '', 
    stock: '', 
    stock_minimo: '', 
    categoria_id: '', 
    imagen_url: '', 
    codigo_barras: '', 
    marca: '', 
    modelo: '', 
    activo: 1, 
    destacado: 0, 
    es_servicio: 0, 
    color_producto: '#1976d2', 
    icono_producto: '' 
  });
  const [editId, setEditId] = useState(null);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 [Productos] Iniciando fetch de productos...');
      const res = await api.get('/productos');
      console.log('🔍 [Productos] Respuesta completa:', res);
      console.log('🔍 [Productos] Datos recibidos:', res.data);
      console.log('🔍 [Productos] Tipo de datos:', typeof res.data);
      console.log('🔍 [Productos] Es array?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const productosData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Productos] Array de productos procesado:', productosData);
      setProductos(productosData);
      console.log('🔍 [Productos] Estado actualizado con', productosData.length, 'productos');
    } catch (error) {
      console.error('❌ [Productos] Error fetching productos:', error);
      setError('Error al cargar productos: ' + (error.response?.data?.mensaje || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      console.log('🔍 [Productos] Iniciando fetch de categorías...');
      const res = await api.get('/categorias-producto');
      console.log('🔍 [Productos] Categorías recibidas:', res.data);
      console.log('🔍 [Productos] Tipo de datos categorías:', typeof res.data);
      console.log('🔍 [Productos] Es array categorías?', Array.isArray(res.data));
      
      // El backend devuelve los datos directamente en res.data, no en res.data.data
      const categoriasData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      console.log('🔍 [Productos] Array de categorías procesado:', categoriasData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('❌ [Productos] Error fetching categorias:', error);
      setError('Error al cargar categorías: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  useEffect(() => { 
    console.log('🔍 [Productos] Componente montado, iniciando fetches...');
    fetchProductos(); 
    fetchCategorias();
  }, []);

  const handleOpen = (producto = null, view = false) => {
    if (producto) {
      setForm({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || '',
        precio_venta: producto.precio_venta || '',
        stock: producto.stock || '',
        stock_minimo: producto.stock_minimo || '',
        categoria_id: producto.categoria_id || '',
        imagen_url: producto.imagen_url || '',
        codigo_barras: producto.codigo_barras || '',
        marca: producto.marca || '',
        modelo: producto.modelo || '',
        activo: producto.activo !== undefined ? producto.activo : 1,
        destacado: producto.destacado !== undefined ? producto.destacado : 0,
        es_servicio: producto.es_servicio !== undefined ? producto.es_servicio : 0,
        color_producto: producto.color_producto || '#1976d2',
        icono_producto: producto.icono_producto || ''
      });
      setEditId(producto.id);
    } else {
      setForm({ 
        nombre: '', 
        descripcion: '', 
        precio: '', 
        precio_venta: '', 
        stock: '', 
        stock_minimo: '', 
        categoria_id: '', 
        imagen_url: '', 
        codigo_barras: '', 
        marca: '', 
        modelo: '', 
        activo: 1, 
        destacado: 0, 
        es_servicio: 0, 
        color_producto: '#1976d2', 
        icono_producto: '' 
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
        await api.put(`/productos/${editId}`, form);
      } else {
        await api.post('/productos', form);
      }
      handleClose();
      fetchProductos();
    } catch (error) {
      console.error('Error saving producto:', error);
      setError('Error al guardar producto: ' + (error.response?.data?.mensaje || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar producto?')) {
      try {
        await api.delete(`/productos/${id}`);
        fetchProductos();
      } catch (error) {
        console.error('Error deleting producto:', error);
        setError('Error al eliminar producto: ' + (error.response?.data?.mensaje || error.message));
      }
    }
  };

  const getCategoriaNombre = (categoriaId) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'N/A';
  };

  const getStockStatus = (stock, stockMinimo) => {
    if (stock <= 0) return { label: 'Sin Stock', color: 'error' };
    if (stock <= stockMinimo) return { label: 'Stock Bajo', color: 'warning' };
    return { label: 'En Stock', color: 'success' };
  };

  console.log('🔍 [Productos] Renderizando con', productos.length, 'productos:', productos);

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Productos</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Nuevo Producto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography>Cargando productos...</Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Total de productos: {productos.length}
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Precio Venta</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Estado Stock</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Destacado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No hay productos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                productos.map(prod => {
                  const stockStatus = getStockStatus(prod.stock, prod.stock_minimo);
                  return (
                    <TableRow key={prod.id}>
                      <TableCell>{prod.id}</TableCell>
                      <TableCell>{prod.nombre || 'N/A'}</TableCell>
                      <TableCell>{getCategoriaNombre(prod.categoria_id)}</TableCell>
                      <TableCell>${prod.precio || 0}</TableCell>
                      <TableCell>${prod.precio_venta || 0}</TableCell>
                      <TableCell>{prod.stock || 0}</TableCell>
                      <TableCell>
                        <Chip 
                          label={stockStatus.label} 
                          color={stockStatus.color} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={prod.activo ? 'Activo' : 'Inactivo'} 
                          color={prod.activo ? 'success' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={prod.destacado ? 'Sí' : 'No'} 
                          color={prod.destacado ? 'primary' : 'default'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver detalles">
                          <IconButton size="small" onClick={() => handleOpen(prod, true)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleOpen(prod)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton size="small" color="error" onClick={() => handleDelete(prod.id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewMode ? 'Ver Producto' : (editId ? 'Editar Producto' : 'Nuevo Producto')}
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
              label="Precio de Venta"
              name="precio_venta"
              type="number"
              value={form.precio_venta}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Stock"
              name="stock"
              type="number"
              value={form.stock}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Stock Mínimo"
              name="stock_minimo"
              type="number"
              value={form.stock_minimo}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Código de Barras"
              name="codigo_barras"
              value={form.codigo_barras}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Marca"
              name="marca"
              value={form.marca}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Modelo"
              name="modelo"
              value={form.modelo}
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
              label="Color del Producto"
              name="color_producto"
              type="color"
              value={form.color_producto}
              onChange={handleChange}
              fullWidth
              disabled={viewMode}
            />

            <TextField
              label="Icono del Producto"
              name="icono_producto"
              value={form.icono_producto}
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
                  checked={form.es_servicio === 1}
                  onChange={(e) => setForm({ ...form, es_servicio: e.target.checked ? 1 : 0 })}
                  disabled={viewMode}
                />
              }
              label="Es Servicio"
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
