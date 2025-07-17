const PlantillaCorreo = require('../models/PlantillaCorreo');

module.exports = {
  async listar(req, res) {
    try {
      const opciones = req.query;
      const resultado = await PlantillaCorreo.obtenerTodas(opciones);
      res.json(resultado);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const plantilla = await PlantillaCorreo.obtenerPorId(id);
      if (!plantilla) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json(plantilla);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async crear(req, res) {
    try {
      const nuevo = await PlantillaCorreo.crear(req.body);
      res.status(201).json(nuevo);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const actualizado = await PlantillaCorreo.actualizar(id, req.body);
      res.json(actualizado);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await PlantillaCorreo.eliminar(id);
      if (!eliminado) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json({ mensaje: 'Eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  }
}; 