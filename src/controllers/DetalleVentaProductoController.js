const DetalleVentaProducto = require('../models/DetalleVentaProducto');

module.exports = {
  async listar(req, res) {
    try {
      const opciones = req.query;
      const resultado = await DetalleVentaProducto.obtenerTodos(opciones);
      res.json(resultado);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async obtenerPorId(req, res) {
    try {
      const { venta_id, producto_id } = req.params;
      const detalle = await DetalleVentaProducto.obtenerPorId(venta_id, producto_id);
      if (!detalle) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json(detalle);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async crear(req, res) {
    try {
      const nuevo = await DetalleVentaProducto.crear(req.body);
      res.status(201).json(nuevo);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async actualizar(req, res) {
    try {
      const { venta_id, producto_id } = req.params;
      const actualizado = await DetalleVentaProducto.actualizar(venta_id, producto_id, req.body);
      res.json(actualizado);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async eliminar(req, res) {
    try {
      const { venta_id, producto_id } = req.params;
      const eliminado = await DetalleVentaProducto.eliminar(venta_id, producto_id);
      if (!eliminado) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json({ mensaje: 'Eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  }
}; 