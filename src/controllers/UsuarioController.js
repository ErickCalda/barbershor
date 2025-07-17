const Usuario = require('../models/Usuario');

module.exports = {
  async listar(req, res) {
    console.log('🔍 [UsuarioController.listar] Iniciando endpoint /api/usuarios');
    console.log('🔍 [UsuarioController.listar] Query params:', req.query);
    
    try {
      const filtros = req.query;
      console.log('🔍 [UsuarioController.listar] Llamando a Usuario.obtenerTodos con filtros:', filtros);
      
      const resultado = await Usuario.obtenerTodos(filtros);
      console.log('🔍 [UsuarioController.listar] Usuario.obtenerTodos completado exitosamente');
      console.log('🔍 [UsuarioController.listar] Resultado obtenido:', {
        cantidad: resultado.length,
        primerUsuario: resultado.length > 0 ? {
          id: resultado[0].id,
          nombre: resultado[0].nombre,
          apellido: resultado[0].apellido,
          email: resultado[0].email
        } : null
      });
      
      console.log('🔍 [UsuarioController.listar] Enviando respuesta exitosa');
      res.json(resultado);
    } catch (error) {
      console.error('❌ [UsuarioController.listar] Error capturado:', error);
      console.error('❌ [UsuarioController.listar] Mensaje de error:', error.message);
      console.error('❌ [UsuarioController.listar] Stack trace:', error.stack);
      res.status(500).json({ mensaje: error.message });
    }
  },

  async obtenerPorId(req, res) {
    console.log('🔍 [UsuarioController.obtenerPorId] Iniciando con ID:', req.params.id);
    
    try {
      const { id } = req.params;
      const usuario = await Usuario.obtenerPorId(id);
      if (!usuario) {
        console.log('🔍 [UsuarioController.obtenerPorId] Usuario no encontrado');
        return res.status(404).json({ mensaje: 'No encontrado' });
      }
      console.log('🔍 [UsuarioController.obtenerPorId] Usuario encontrado:', {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido
      });
      res.json(usuario);
    } catch (error) {
      console.error('❌ [UsuarioController.obtenerPorId] Error:', error);
      res.status(500).json({ mensaje: error.message });
    }
  },

  async crear(req, res) {
    console.log('🔍 [UsuarioController.crear] Iniciando con datos:', req.body);
    
    try {
      const nuevo = await Usuario.crear(req.body);
      console.log('🔍 [UsuarioController.crear] Usuario creado exitosamente:', {
        id: nuevo.id,
        nombre: nuevo.nombre,
        apellido: nuevo.apellido
      });
      res.status(201).json(nuevo);
    } catch (error) {
      console.error('❌ [UsuarioController.crear] Error:', error);
      res.status(400).json({ mensaje: error.message });
    }
  },

  async actualizar(req, res) {
    console.log('🔍 [UsuarioController.actualizar] Iniciando con ID:', req.params.id);
    console.log('🔍 [UsuarioController.actualizar] Datos a actualizar:', req.body);
    
    try {
      const { id } = req.params;
      const actualizado = await Usuario.actualizar(id, req.body);
      console.log('🔍 [UsuarioController.actualizar] Usuario actualizado exitosamente');
      res.json(actualizado);
    } catch (error) {
      console.error('❌ [UsuarioController.actualizar] Error:', error);
      res.status(400).json({ mensaje: error.message });
    }
  },

  async eliminar(req, res) {
    console.log('🔍 [UsuarioController.eliminar] Iniciando con ID:', req.params.id);
    
    try {
      const { id } = req.params;
      const eliminado = await Usuario.eliminar(id);
      if (!eliminado) {
        console.log('🔍 [UsuarioController.eliminar] Usuario no encontrado');
        return res.status(404).json({ mensaje: 'No encontrado' });
      }
      console.log('🔍 [UsuarioController.eliminar] Usuario eliminado exitosamente');
      res.json({ mensaje: 'Eliminado correctamente' });
    } catch (error) {
      console.error('❌ [UsuarioController.eliminar] Error:', error);
      res.status(500).json({ mensaje: error.message });
    }
  },


  async obtenerPorFirebaseUid(req, res) {
    const { firebase_uid } = req.params;
    try {
      const usuario = await Usuario.obtenerPorFirebaseUid(firebase_uid);
      if (!usuario) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }
      res.json(usuario);
    } catch (error) {
      console.error("[UsuarioController.obtenerPorFirebaseUid]", error);
      res.status(500).json({ mensaje: error.message });
    }
  }
  


  


  
}; 