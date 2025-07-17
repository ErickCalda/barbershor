const Log = require('../models/Log');

module.exports = {
  async listar(req, res) {
    try {
      const opciones = req.query;
      const resultado = await Log.obtenerTodos(opciones);
      res.json(resultado);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const log = await Log.obtenerPorId(id);
      if (!log) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json(log);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async crear(req, res) {
    try {
      const body = { ...req.body };
      if (!body.accion) body.accion = 'ACCION_NO_ESPECIFICADA';
      const nuevo = await Log.crear(body);
      res.status(201).json(nuevo);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const actualizado = await Log.actualizar(id, req.body);
      res.json(actualizado);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await Log.eliminar(id);
      if (!eliminado) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json({ mensaje: 'Eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  }
}; 