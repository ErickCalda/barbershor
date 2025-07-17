const EmpleadoServicio = require('../models/EmpleadoServicio');

module.exports = {
  async listar(req, res) {
    try {
      const opciones = req.query;
      const resultado = await EmpleadoServicio.obtenerTodas(opciones);
      res.json(resultado);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async obtenerPorId(req, res) {
    try {
      const { empleado_id, servicio_id } = req.params;
      const relacion = await EmpleadoServicio.obtenerPorId(empleado_id, servicio_id);
      if (!relacion) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json(relacion);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async crear(req, res) {
    try {
      const nuevo = await EmpleadoServicio.crear(req.body);
      res.status(201).json(nuevo);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async actualizar(req, res) {
    try {
      const { empleado_id, servicio_id } = req.params;
      const actualizado = await EmpleadoServicio.actualizar(empleado_id, servicio_id, req.body);
      res.json(actualizado);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async eliminar(req, res) {
    try {
      const { empleado_id, servicio_id } = req.params;
      const eliminado = await EmpleadoServicio.eliminar(empleado_id, servicio_id);
      if (!eliminado) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json({ mensaje: 'Eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  }
}; 