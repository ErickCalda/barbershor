-- Script para insertar tokens FCM de prueba
-- Esto permitirá que las notificaciones push funcionen en el entorno de desarrollo

-- Insertar token FCM para el cliente (usuario_id = 2)
INSERT INTO notificaciones_push (usuario_id, token_dispositivo, plataforma, activo) 
VALUES (2, 'fcm_token_cliente_prueba_123', 'web', 1)
ON DUPLICATE KEY UPDATE 
    token_dispositivo = VALUES(token_dispositivo),
    plataforma = VALUES(plataforma),
    activo = VALUES(activo);

-- Insertar token FCM para el empleado (usuario_id = 1)
INSERT INTO notificaciones_push (usuario_id, token_dispositivo, plataforma, activo) 
VALUES (1, 'fcm_token_empleado_prueba_456', 'web', 1)
ON DUPLICATE KEY UPDATE 
    token_dispositivo = VALUES(token_dispositivo),
    plataforma = VALUES(plataforma),
    activo = VALUES(activo);

-- Verificar que se insertaron correctamente
SELECT 
    np.id,
    np.usuario_id,
    u.nombre,
    u.email,
    np.token_dispositivo,
    np.plataforma,
    np.activo
FROM notificaciones_push np
INNER JOIN usuarios u ON np.usuario_id = u.id
WHERE np.activo = 1; 