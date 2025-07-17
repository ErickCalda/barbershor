-- Datos de prueba para el flujo de reservación
-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion) VALUES 
('Cliente', 'Usuario cliente'),
('Empleado', 'Usuario empleado'),
('Admin', 'Usuario administrador')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar usuarios de prueba
INSERT INTO usuarios (firebase_uid, email, nombre, apellido, telefono, rol_id, activo) VALUES 
('cliente_test_1', 'cliente1@test.com', 'Juan', 'Pérez', '123456789', 1, 1),
('empleado_test_1', 'empleado1@test.com', 'María', 'García', '987654321', 2, 1),
('empleado_test_2', 'empleado2@test.com', 'Carlos', 'López', '555666777', 2, 1)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Insertar clientes
INSERT INTO clientes (usuario_id, fecha_nacimiento, genero) VALUES 
(1, '1990-01-15', 'Masculino')
ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id);

-- Insertar empleados
INSERT INTO empleados (usuario_id, titulo, biografia, fecha_contratacion, activo) VALUES 
(2, 'Barbero Senior', 'Especialista en cortes modernos y clásicos', '2023-01-15', 1),
(3, 'Barbero Junior', 'Especialista en coloración y tratamientos', '2023-06-01', 1)
ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id);

-- Insertar categorías de servicios
INSERT INTO categorias_servicios (nombre, descripcion) VALUES 
('Cortes', 'Servicios de corte de cabello'),
('Coloración', 'Servicios de coloración y tintes'),
('Tratamientos', 'Tratamientos capilares')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar servicios
INSERT INTO servicios (categoria_id, nombre, descripcion, duracion, precio, activo) VALUES 
(1, 'Corte Clásico', 'Corte de cabello tradicional', 30, 25.00, 1),
(1, 'Corte Moderno', 'Corte de cabello con técnicas modernas', 45, 35.00, 1),
(2, 'Coloración Completa', 'Coloración completa del cabello', 120, 80.00, 1),
(3, 'Tratamiento Hidratante', 'Tratamiento profundo de hidratación', 60, 45.00, 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar especialidades
INSERT INTO especialidades (nombre, descripcion) VALUES 
('Cortes Clásicos', 'Especialidad en cortes tradicionales'),
('Cortes Modernos', 'Especialidad en cortes contemporáneos'),
('Coloración', 'Especialidad en coloración y tintes'),
('Tratamientos', 'Especialidad en tratamientos capilares')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Relacionar empleados con servicios
INSERT INTO empleado_servicio (empleado_id, servicio_id, puede_realizar) VALUES 
(1, 1, 1), -- Empleado 1 puede hacer Corte Clásico
(1, 2, 1), -- Empleado 1 puede hacer Corte Moderno
(2, 1, 1), -- Empleado 2 puede hacer Corte Clásico
(2, 3, 1), -- Empleado 2 puede hacer Coloración Completa
(2, 4, 1)  -- Empleado 2 puede hacer Tratamiento Hidratante
ON DUPLICATE KEY UPDATE puede_realizar = VALUES(puede_realizar);

-- Relacionar empleados con especialidades
INSERT INTO empleado_especialidad (empleado_id, especialidad_id, nivel) VALUES 
(1, 1, 'Experto'),    -- Empleado 1 es experto en Cortes Clásicos
(1, 2, 'Avanzado'),   -- Empleado 1 es avanzado en Cortes Modernos
(2, 1, 'Intermedio'), -- Empleado 2 es intermedio en Cortes Clásicos
(2, 3, 'Experto'),    -- Empleado 2 es experto en Coloración
(2, 4, 'Avanzado')    -- Empleado 2 es avanzado en Tratamientos
ON DUPLICATE KEY UPDATE nivel = VALUES(nivel);

-- Insertar horarios de empleados
INSERT INTO horarios_empleados (empleado_id, dia_semana, hora_inicio, hora_fin, es_descanso) VALUES 
-- Empleado 1: Lunes a Viernes 9:00-18:00
(1, 1, '09:00:00', '18:00:00', 0), -- Lunes
(1, 2, '09:00:00', '18:00:00', 0), -- Martes
(1, 3, '09:00:00', '18:00:00', 0), -- Miércoles
(1, 4, '09:00:00', '18:00:00', 0), -- Jueves
(1, 5, '09:00:00', '18:00:00', 0), -- Viernes
(1, 6, '09:00:00', '14:00:00', 0), -- Sábado
(1, 7, '00:00:00', '00:00:00', 1), -- Domingo (descanso)

-- Empleado 2: Lunes a Sábado 10:00-19:00
(2, 1, '10:00:00', '19:00:00', 0), -- Lunes
(2, 2, '10:00:00', '19:00:00', 0), -- Martes
(2, 3, '10:00:00', '19:00:00', 0), -- Miércoles
(2, 4, '10:00:00', '19:00:00', 0), -- Jueves
(2, 5, '10:00:00', '19:00:00', 0), -- Viernes
(2, 6, '10:00:00', '16:00:00', 0), -- Sábado
(2, 7, '00:00:00', '00:00:00', 1)  -- Domingo (descanso)
ON DUPLICATE KEY UPDATE hora_inicio = VALUES(hora_inicio), hora_fin = VALUES(hora_fin);

-- Insertar estados de citas
INSERT INTO estados_citas (nombre, descripcion, color) VALUES 
('Pendiente', 'Cita pendiente de confirmación', '#FFA500'),
('Confirmada', 'Cita confirmada', '#008000'),
('En Progreso', 'Cita en curso', '#0000FF'),
('Completada', 'Cita finalizada', '#808080'),
('Cancelada', 'Cita cancelada', '#FF0000'),
('No Presentó', 'Cliente no se presentó', '#FF4500')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar métodos de pago
INSERT INTO metodos_pago (nombre, descripcion, activo) VALUES 
('Efectivo', 'Pago en efectivo', 1),
('Tarjeta de Crédito', 'Pago con tarjeta de crédito', 1),
('Tarjeta de Débito', 'Pago con tarjeta de débito', 1),
('Transferencia', 'Transferencia bancaria', 1),
('PayPal', 'Pago a través de PayPal', 1)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar estados de pago
INSERT INTO estados_pago (nombre, descripcion) VALUES 
('Pendiente', 'Pago pendiente'),
('Procesando', 'Pago en proceso'),
('Completado', 'Pago completado'),
('Fallido', 'Pago fallido'),
('Reembolsado', 'Pago reembolsado'),
('Cancelado', 'Pago cancelado')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre); 