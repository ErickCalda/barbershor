const EstadoCita = require('../models/EstadoCita');

module.exports = {
  async listar(req, res) {
    try {
      const opciones = req.query;
      const resultado = await EstadoCita.obtenerTodos(opciones);
      res.status(200).json({
        success: true,
        data: resultado
      });
    } catch (error) {
      console.error('Error en listar estados de cita:', error);
      res.status(500).json({ 
        success: false,
        mensaje: error.message 
      });
    }
  },

  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const estado = await EstadoCita.obtenerPorId(id);
      if (!estado) {
        return res.status(404).json({ 
          success: false,
          mensaje: 'Estado de cita no encontrado' 
        });
      }
      res.status(200).json({
        success: true,
        data: estado
      });
    } catch (error) {
      console.error('Error en obtener estado de cita por ID:', error);
      res.status(500).json({ 
        success: false,
        mensaje: error.message 
      });
    }
  },

  async crear(req, res) {
    try {
      const nuevo = await EstadoCita.crear(req.body);
      res.status(201).json({
        success: true,
        data: nuevo
      });
    } catch (error) {
      console.error('Error en crear estado de cita:', error);
      res.status(400).json({ 
        success: false,
        mensaje: error.message 
      });
    }
  },

  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const actualizado = await EstadoCita.actualizar(id, req.body);
      res.status(200).json({
        success: true,
        data: actualizado
      });
    } catch (error) {
      console.error('Error en actualizar estado de cita:', error);
      res.status(400).json({ 
        success: false,
        mensaje: error.message 
      });
    }
  },

  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await EstadoCita.eliminar(id);
      if (!eliminado) {
        return res.status(404).json({ 
          success: false,
          mensaje: 'Estado de cita no encontrado' 
        });
      }
      res.status(200).json({ 
        success: true,
        mensaje: 'Estado de cita eliminado correctamente' 
      });
    } catch (error) {
      console.error('Error en eliminar estado de cita:', error);
      res.status(500).json({ 
        success: false,
        mensaje: error.message 
      });
    }
  }
}; 