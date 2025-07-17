const NotificacionPushEnviada = require('../models/NotificacionPushEnviada');

module.exports = {
  async listar(req, res) {
    try {
      const opciones = req.query;
      const resultado = await NotificacionPushEnviada.obtenerTodas(opciones);
      res.json(resultado);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const notificacion = await NotificacionPushEnviada.obtenerPorId(id);
      if (!notificacion) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json(notificacion);
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  },

  async crear(req, res) {
    try {
      const nuevo = await NotificacionPushEnviada.crear(req.body);
      res.status(201).json(nuevo);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const actualizado = await NotificacionPushEnviada.actualizar(id, req.body);
      res.json(actualizado);
    } catch (error) {
      res.status(400).json({ mensaje: error.message });
    }
  },

  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await NotificacionPushEnviada.eliminar(id);
      if (!eliminado) return res.status(404).json({ mensaje: 'No encontrado' });
      res.json({ mensaje: 'Eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ mensaje: error.message });
    }
  }
}; 