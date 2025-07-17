// Importar modelos
const Usuario = require('./Usuario');
const Empleado = require('./Empleado');
const Cliente = require('./Cliente');
const EmpleadoEspecialidad = require('./EmpleadoEspecialidad');
const EmpleadoServicio = require('./EmpleadoServicio');
const HorarioEmpleado = require('./HorarioEmpleado');
const AusenciaEmpleado = require('./AusenciaEmpleado');
const Especialidad = require('./Especialidad');
const Servicio = require('./Servicio');
const Rol = require('./Rol');

// Exportar modelos
module.exports = {
  Usuario,
  Empleado,
  Cliente,
  EmpleadoEspecialidad,
  EmpleadoServicio,
  HorarioEmpleado,
  AusenciaEmpleado,
  Especialidad,
  Servicio,
  Rol
};