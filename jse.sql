-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: peluqueria_db
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ausencias_empleados`
--

DROP TABLE IF EXISTS `ausencias_empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ausencias_empleados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empleado_id` int NOT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime NOT NULL,
  `motivo` enum('Vacaciones','Enfermedad','Permiso','Otro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `empleado_id` (`empleado_id`),
  CONSTRAINT `ausencias_empleados_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_fechas_ausencia` CHECK ((`fecha_inicio` < `fecha_fin`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calendarios_google`
--

DROP TABLE IF EXISTS `calendarios_google`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendarios_google` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `calendar_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID del calendario en Google Calendar',
  `nombre_calendario` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_acceso` text COLLATE utf8mb4_unicode_ci COMMENT 'Token OAuth para acceso al calendario',
  `token_refresco` text COLLATE utf8mb4_unicode_ci COMMENT 'Token de refresco para OAuth',
  `expiracion_token` datetime DEFAULT NULL,
  `sincronizacion_activa` tinyint(1) DEFAULT '1',
  `ultima_sincronizacion` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calendario_usuario` (`usuario_id`),
  CONSTRAINT `calendarios_google_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carrusel_multimedia`
--

DROP TABLE IF EXISTS `carrusel_multimedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrusel_multimedia` (
  `carrusel_id` int NOT NULL,
  `multimedia_id` int NOT NULL,
  `orden` int DEFAULT '0' COMMENT 'Orden de aparición en el carrusel',
  `titulo_overlay` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Título que aparece sobre la imagen/video',
  `descripcion_overlay` text COLLATE utf8mb4_unicode_ci COMMENT 'Descripción que aparece sobre la imagen/video',
  `boton_texto` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Texto del botón CTA',
  `boton_enlace` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Enlace del botón CTA',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`carrusel_id`,`multimedia_id`),
  KEY `multimedia_id` (`multimedia_id`),
  CONSTRAINT `carrusel_multimedia_ibfk_1` FOREIGN KEY (`carrusel_id`) REFERENCES `carruseles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `carrusel_multimedia_ibfk_2` FOREIGN KEY (`multimedia_id`) REFERENCES `multimedia` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carruseles`
--

DROP TABLE IF EXISTS `carruseles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carruseles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `velocidad_transicion` int DEFAULT '5000' COMMENT 'Tiempo en milisegundos entre diapositivas',
  `tipo_transicion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'fade' COMMENT 'Tipo de animación (fade, slide, etc.)',
  `activo` tinyint(1) DEFAULT '1',
  `ubicacion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Página o sección donde se muestra (inicio, servicios, etc.)',
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_carrusel_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categorias_galeria`
--

DROP TABLE IF EXISTS `categorias_galeria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_galeria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen_portada` int DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `imagen_portada` (`imagen_portada`),
  CONSTRAINT `categorias_galeria_ibfk_1` FOREIGN KEY (`imagen_portada`) REFERENCES `multimedia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categorias_productos`
--

DROP TABLE IF EXISTS `categorias_productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categorias_servicios`
--

DROP TABLE IF EXISTS `categorias_servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias_servicios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cita_servicio`
--

DROP TABLE IF EXISTS `cita_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cita_servicio` (
  `cita_id` int NOT NULL,
  `servicio_id` int NOT NULL,
  `precio_aplicado` decimal(10,2) NOT NULL COMMENT 'Precio al momento de la cita',
  `descuento` decimal(10,2) DEFAULT '0.00',
  `notas` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`cita_id`,`servicio_id`),
  KEY `servicio_id` (`servicio_id`),
  CONSTRAINT `cita_servicio_ibfk_1` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cita_servicio_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `fecha_hora_inicio` datetime NOT NULL,
  `fecha_hora_fin` datetime NOT NULL,
  `estado_id` int NOT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `recordatorio_enviado` tinyint(1) DEFAULT '0',
  `recordatorio_correo_enviado` tinyint(1) DEFAULT '0',
  `recordatorio_push_enviado` tinyint(1) DEFAULT '0',
  `sincronizado_calendar` tinyint(1) DEFAULT '0',
  `event_id_calendar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meet_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Para integración con Google Meet',
  `origen` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Web, App, Telefónico, Presencial',
  `cancelado_por` int DEFAULT NULL COMMENT 'ID del usuario que canceló la cita',
  `motivo_cancelacion` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cancelado_por` (`cancelado_por`),
  KEY `idx_citas_fecha` (`fecha_hora_inicio`),
  KEY `idx_citas_cliente` (`cliente_id`),
  KEY `idx_citas_empleado` (`empleado_id`),
  KEY `idx_citas_estado` (`estado_id`),
  CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`),
  CONSTRAINT `citas_ibfk_3` FOREIGN KEY (`estado_id`) REFERENCES `estados_citas` (`id`),
  CONSTRAINT `citas_ibfk_4` FOREIGN KEY (`cancelado_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `chk_fecha_hora` CHECK ((`fecha_hora_inicio` < `fecha_hora_fin`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('Masculino','Femenino','No binario','Prefiero no decir') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notas_preferencias` text COLLATE utf8mb4_unicode_ci,
  `ultima_visita` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuraciones`
--

DROP TABLE IF EXISTS `configuraciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuraciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave` (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `configuraciones_google`
--

DROP TABLE IF EXISTS `configuraciones_google`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuraciones_google` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `correos_enviados`
--

DROP TABLE IF EXISTS `correos_enviados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `correos_enviados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `destinatario` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asunto` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci,
  `plantilla_id` int DEFAULT NULL,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'enviado, fallido, programado',
  `mensaje_error` text COLLATE utf8mb4_unicode_ci,
  `fecha_envio` datetime DEFAULT NULL,
  `cita_id` int DEFAULT NULL COMMENT 'Si el correo está relacionado con una cita',
  `usuario_id` int DEFAULT NULL COMMENT 'Si el correo está relacionado con un usuario',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `plantilla_id` (`plantilla_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_correos_cita` (`cita_id`),
  CONSTRAINT `correos_enviados_ibfk_1` FOREIGN KEY (`plantilla_id`) REFERENCES `plantillas_correo` (`id`),
  CONSTRAINT `correos_enviados_ibfk_2` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `correos_enviados_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `correos_programados`
--

DROP TABLE IF EXISTS `correos_programados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `correos_programados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plantilla_id` int NOT NULL,
  `destinatario` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asunto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `variables_datos` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON con variables para la plantilla',
  `fecha_programada` datetime NOT NULL,
  `enviado` tinyint(1) DEFAULT '0',
  `correo_enviado_id` int DEFAULT NULL,
  `intentos` int DEFAULT '0',
  `maximo_intentos` int DEFAULT '3',
  `cita_id` int DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `plantilla_id` (`plantilla_id`),
  KEY `correo_enviado_id` (`correo_enviado_id`),
  KEY `cita_id` (`cita_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_correos_prog_fecha` (`fecha_programada`,`enviado`),
  CONSTRAINT `correos_programados_ibfk_1` FOREIGN KEY (`plantilla_id`) REFERENCES `plantillas_correo` (`id`),
  CONSTRAINT `correos_programados_ibfk_2` FOREIGN KEY (`correo_enviado_id`) REFERENCES `correos_enviados` (`id`),
  CONSTRAINT `correos_programados_ibfk_3` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `correos_programados_ibfk_4` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detalle_venta_producto`
--

DROP TABLE IF EXISTS `detalle_venta_producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_venta_producto` (
  `venta_id` int NOT NULL,
  `producto_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`venta_id`,`producto_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `detalle_venta_producto_ibfk_1` FOREIGN KEY (`venta_id`) REFERENCES `ventas_productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_venta_producto_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `empleado_especialidad`
--

DROP TABLE IF EXISTS `empleado_especialidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleado_especialidad` (
  `empleado_id` int NOT NULL,
  `especialidad_id` int NOT NULL,
  `nivel` enum('Principiante','Intermedio','Avanzado','Experto') COLLATE utf8mb4_unicode_ci DEFAULT 'Intermedio',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`empleado_id`,`especialidad_id`),
  KEY `especialidad_id` (`especialidad_id`),
  CONSTRAINT `empleado_especialidad_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE,
  CONSTRAINT `empleado_especialidad_ibfk_2` FOREIGN KEY (`especialidad_id`) REFERENCES `especialidades` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `empleado_servicio`
--

DROP TABLE IF EXISTS `empleado_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleado_servicio` (
  `empleado_id` int NOT NULL,
  `servicio_id` int NOT NULL,
  `puede_realizar` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`empleado_id`,`servicio_id`),
  KEY `servicio_id` (`servicio_id`),
  CONSTRAINT `empleado_servicio_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE,
  CONSTRAINT `empleado_servicio_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `empleados`
--

DROP TABLE IF EXISTS `empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empleados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `titulo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `biografia` text COLLATE utf8mb4_unicode_ci,
  `fecha_contratacion` date NOT NULL,
  `numero_seguro_social` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salario_base` decimal(10,2) DEFAULT NULL,
  `comision_porcentaje` decimal(5,2) DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`),
  KEY `idx_empleados_activo` (`activo`),
  CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `especialidades`
--

DROP TABLE IF EXISTS `especialidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `especialidades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `estados_citas`
--

DROP TABLE IF EXISTS `estados_citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estados_citas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Código de color hexadecimal para UI',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `estados_pago`
--

DROP TABLE IF EXISTS `estados_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estados_pago` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `eventos_google_calendar`
--

DROP TABLE IF EXISTS `eventos_google_calendar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eventos_google_calendar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cita_id` int DEFAULT NULL,
  `calendario_id` int NOT NULL,
  `event_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ID del evento en Google Calendar',
  `evento_creado` tinyint(1) DEFAULT '0',
  `evento_modificado` tinyint(1) DEFAULT '0',
  `evento_eliminado` tinyint(1) DEFAULT '0',
  `ultima_sincronizacion` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cita_id` (`cita_id`),
  KEY `calendario_id` (`calendario_id`),
  KEY `idx_eventos_google_event_id` (`event_id`),
  CONSTRAINT `eventos_google_calendar_ibfk_1` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `eventos_google_calendar_ibfk_2` FOREIGN KEY (`calendario_id`) REFERENCES `calendarios_google` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fichas_clientes`
--

DROP TABLE IF EXISTS `fichas_clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fichas_clientes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `tipo_cabello` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_actual` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alergias` text COLLATE utf8mb4_unicode_ci,
  `condiciones_medicas` text COLLATE utf8mb4_unicode_ci,
  `productos_usados` text COLLATE utf8mb4_unicode_ci,
  `notas_tecnicas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `fichas_clientes_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `galeria_categoria`
--

DROP TABLE IF EXISTS `galeria_categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `galeria_categoria` (
  `galeria_id` int NOT NULL,
  `categoria_id` int NOT NULL,
  PRIMARY KEY (`galeria_id`,`categoria_id`),
  KEY `categoria_id` (`categoria_id`),
  CONSTRAINT `galeria_categoria_ibfk_1` FOREIGN KEY (`galeria_id`) REFERENCES `galerias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `galeria_categoria_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_galeria` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `galeria_multimedia`
--

DROP TABLE IF EXISTS `galeria_multimedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `galeria_multimedia` (
  `galeria_id` int NOT NULL,
  `multimedia_id` int NOT NULL,
  `orden` int DEFAULT '0',
  `es_antes` tinyint(1) DEFAULT '0' COMMENT 'Para comparativas antes/después',
  `es_despues` tinyint(1) DEFAULT '0' COMMENT 'Para comparativas antes/después',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`galeria_id`,`multimedia_id`),
  KEY `multimedia_id` (`multimedia_id`),
  CONSTRAINT `galeria_multimedia_ibfk_1` FOREIGN KEY (`galeria_id`) REFERENCES `galerias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `galeria_multimedia_ibfk_2` FOREIGN KEY (`multimedia_id`) REFERENCES `multimedia` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `galerias`
--

DROP TABLE IF EXISTS `galerias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `galerias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tipo de galería (cortes, coloración, etc.)',
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL amigable',
  `imagen_portada` int DEFAULT NULL COMMENT 'ID de la imagen principal',
  `empleado_id` int DEFAULT NULL COMMENT 'Si la galería pertenece a un empleado específico',
  `servicio_id` int DEFAULT NULL COMMENT 'Si la galería está relacionada con un servicio específico',
  `activo` tinyint(1) DEFAULT '1',
  `destacado` tinyint(1) DEFAULT '0',
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `imagen_portada` (`imagen_portada`),
  KEY `empleado_id` (`empleado_id`),
  KEY `servicio_id` (`servicio_id`),
  KEY `idx_galeria_activo` (`activo`,`destacado`),
  CONSTRAINT `galerias_ibfk_1` FOREIGN KEY (`imagen_portada`) REFERENCES `multimedia` (`id`),
  CONSTRAINT `galerias_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL,
  CONSTRAINT `galerias_ibfk_3` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historial_servicios_cliente`
--

DROP TABLE IF EXISTS `historial_servicios_cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_servicios_cliente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `servicio_id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `fecha` datetime NOT NULL,
  `detalles` text COLLATE utf8mb4_unicode_ci,
  `resultado` text COLLATE utf8mb4_unicode_ci,
  `productos_usados` text COLLATE utf8mb4_unicode_ci,
  `fotos_antes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fotos_despues` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `servicio_id` (`servicio_id`),
  KEY `empleado_id` (`empleado_id`),
  CONSTRAINT `historial_servicios_cliente_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `historial_servicios_cliente_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`),
  CONSTRAINT `historial_servicios_cliente_ibfk_3` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `horarios_empleados`
--

DROP TABLE IF EXISTS `horarios_empleados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `horarios_empleados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empleado_id` int NOT NULL,
  `dia_semana` tinyint NOT NULL COMMENT '1=Lunes, 2=Martes, ..., 7=Domingo',
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `es_descanso` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_horarios_empleado_dia` (`empleado_id`,`dia_semana`),
  CONSTRAINT `horarios_empleados_ibfk_1` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_horas` CHECK ((`hora_inicio` < `hora_fin`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int DEFAULT NULL,
  `accion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabla_afectada` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registro_id` int DEFAULT NULL,
  `detalles` text COLLATE utf8mb4_unicode_ci,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `metodos_pago`
--

DROP TABLE IF EXISTS `metodos_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metodos_pago` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `multimedia`
--

DROP TABLE IF EXISTS `multimedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `multimedia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ruta al archivo',
  `tipo_archivo` enum('imagen','video') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tamaño_archivo` int DEFAULT NULL COMMENT 'Tamaño en bytes',
  `formato` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Extensión del archivo (jpg, png, mp4, etc.)',
  `ancho` int DEFAULT NULL COMMENT 'Ancho en píxeles',
  `alto` int DEFAULT NULL COMMENT 'Alto en píxeles',
  `duracion` int DEFAULT NULL COMMENT 'Duración en segundos para videos',
  `palabras_clave` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tags separados por comas',
  `destacado` tinyint(1) DEFAULT '0',
  `fecha_creacion` date DEFAULT NULL,
  `autor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `derechos` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_multimedia_tipo` (`tipo_id`),
  KEY `idx_multimedia_formato` (`formato`),
  KEY `idx_multimedia_destacado` (`destacado`),
  CONSTRAINT `multimedia_ibfk_1` FOREIGN KEY (`tipo_id`) REFERENCES `tipos_multimedia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `leida` tinyint(1) DEFAULT '0',
  `fecha_lectura` timestamp NULL DEFAULT NULL,
  `enlace` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notificaciones_push`
--

DROP TABLE IF EXISTS `notificaciones_push`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones_push` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `token_dispositivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Token FCM para notificaciones',
  `plataforma` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'android, ios, web',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `notificaciones_push_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notificaciones_push_enviadas`
--

DROP TABLE IF EXISTS `notificaciones_push_enviadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones_push_enviadas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `notificacion_push_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `datos` text COLLATE utf8mb4_unicode_ci COMMENT 'JSON con datos adicionales',
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'enviado, fallido',
  `mensaje_error` text COLLATE utf8mb4_unicode_ci,
  `cita_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notificacion_push_id` (`notificacion_push_id`),
  KEY `cita_id` (`cita_id`),
  CONSTRAINT `notificaciones_push_enviadas_ibfk_1` FOREIGN KEY (`notificacion_push_id`) REFERENCES `notificaciones_push` (`id`),
  CONSTRAINT `notificaciones_push_enviadas_ibfk_2` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cita_id` int NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `impuesto` decimal(10,2) DEFAULT '0.00',
  `propina` decimal(10,2) DEFAULT '0.00',
  `metodo_pago_id` int NOT NULL,
  `estado_pago_id` int NOT NULL,
  `referencia_pago` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Código de autorización o referencia',
  `factura_emitida` tinyint(1) DEFAULT '0',
  `fecha_pago` timestamp NULL DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cita_id` (`cita_id`),
  KEY `metodo_pago_id` (`metodo_pago_id`),
  KEY `estado_pago_id` (`estado_pago_id`),
  KEY `idx_pagos_fecha` (`fecha_pago`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`),
  CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`metodo_pago_id`) REFERENCES `metodos_pago` (`id`),
  CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`estado_pago_id`) REFERENCES `estados_pago` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plantillas_correo`
--

DROP TABLE IF EXISTS `plantillas_correo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantillas_correo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asunto` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido_html` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido_texto` text COLLATE utf8mb4_unicode_ci COMMENT 'Versión en texto plano para clientes que no admiten HTML',
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'confirmacion_cita, recordatorio, cancelacion, bienvenida, etc.',
  `activo` tinyint(1) DEFAULT '1',
  `variables` text COLLATE utf8mb4_unicode_ci COMMENT 'Lista de variables disponibles separadas por coma',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoria_id` int DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `marca` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `precio_compra` decimal(10,2) NOT NULL,
  `precio_venta` decimal(10,2) NOT NULL,
  `stock` int DEFAULT '0',
  `stock_minimo` int DEFAULT '5',
  `codigo_barras` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  KEY `idx_productos_activo` (`activo`),
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promocion_producto`
--

DROP TABLE IF EXISTS `promocion_producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promocion_producto` (
  `promocion_id` int NOT NULL,
  `producto_id` int NOT NULL,
  PRIMARY KEY (`promocion_id`,`producto_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `promocion_producto_ibfk_1` FOREIGN KEY (`promocion_id`) REFERENCES `promociones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `promocion_producto_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promocion_servicio`
--

DROP TABLE IF EXISTS `promocion_servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promocion_servicio` (
  `promocion_id` int NOT NULL,
  `servicio_id` int NOT NULL,
  PRIMARY KEY (`promocion_id`,`servicio_id`),
  KEY `servicio_id` (`servicio_id`),
  CONSTRAINT `promocion_servicio_ibfk_1` FOREIGN KEY (`promocion_id`) REFERENCES `promociones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `promocion_servicio_ibfk_2` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promociones`
--

DROP TABLE IF EXISTS `promociones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promociones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `codigo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('Porcentaje','Monto Fijo','Servicio Gratis') COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `limite_usos` int DEFAULT NULL,
  `usos_actuales` int DEFAULT '0',
  `activo` tinyint(1) DEFAULT '1',
  `aplicable_a` enum('Todos','Servicios Específicos','Productos Específicos') COLLATE utf8mb4_unicode_ci DEFAULT 'Todos',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  CONSTRAINT `chk_fechas_promo` CHECK ((`fecha_inicio` <= `fecha_fin`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `resenas`
--

DROP TABLE IF EXISTS `resenas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `resenas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `cita_id` int DEFAULT NULL,
  `calificacion` tinyint NOT NULL,
  `comentario` text COLLATE utf8mb4_unicode_ci,
  `publico` tinyint(1) DEFAULT '1',
  `fecha_resena` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `respuesta` text COLLATE utf8mb4_unicode_ci,
  `fecha_respuesta` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `empleado_id` (`empleado_id`),
  KEY `cita_id` (`cita_id`),
  CONSTRAINT `resenas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `resenas_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`),
  CONSTRAINT `resenas_ibfk_3` FOREIGN KEY (`cita_id`) REFERENCES `citas` (`id`),
  CONSTRAINT `resenas_chk_1` CHECK ((`calificacion` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `servicios`
--

DROP TABLE IF EXISTS `servicios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoria_id` int DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `duracion` int NOT NULL COMMENT 'Duración en minutos',
  `precio` decimal(10,2) NOT NULL,
  `imagen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1UL) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `categoria_id` (`categoria_id`),
  KEY `idx_servicios_activo` (`activo`),
  CONSTRAINT `servicios_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias_servicios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipos_multimedia`
--

DROP TABLE IF EXISTS `tipos_multimedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_multimedia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firebase_uid` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_perfil` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol_id` int NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  `notificacion_correo` tinyint(1) DEFAULT '1',
  `notificacion_push` tinyint(1) DEFAULT '0',
  `notificacion_sms` tinyint(1) DEFAULT '0',
  `recordatorio_horas_antes` int DEFAULT '24',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `firebase_uid` (`firebase_uid`),
  UNIQUE KEY `email` (`email`),
  KEY `rol_id` (`rol_id`),
  KEY `idx_usuarios_email` (`email`),
  KEY `idx_usuarios_firebase_uid` (`firebase_uid`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_carruseles_activos`
--

DROP TABLE IF EXISTS `v_carruseles_activos`;
/*!50001 DROP VIEW IF EXISTS `v_carruseles_activos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_carruseles_activos` AS SELECT 
 1 AS `carrusel_id`,
 1 AS `carrusel_nombre`,
 1 AS `carrusel_descripcion`,
 1 AS `velocidad_transicion`,
 1 AS `tipo_transicion`,
 1 AS `total_elementos`,
 1 AS `elementos`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_citas_calendar`
--

DROP TABLE IF EXISTS `v_citas_calendar`;
/*!50001 DROP VIEW IF EXISTS `v_citas_calendar`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_citas_calendar` AS SELECT 
 1 AS `cita_id`,
 1 AS `fecha_hora_inicio`,
 1 AS `fecha_hora_fin`,
 1 AS `cliente`,
 1 AS `empleado`,
 1 AS `sincronizado_calendar`,
 1 AS `event_id_calendar`,
 1 AS `meet_link`,
 1 AS `estado_cita`,
 1 AS `servicios`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_citas_hoy`
--

DROP TABLE IF EXISTS `v_citas_hoy`;
/*!50001 DROP VIEW IF EXISTS `v_citas_hoy`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_citas_hoy` AS SELECT 
 1 AS `id`,
 1 AS `fecha_hora_inicio`,
 1 AS `fecha_hora_fin`,
 1 AS `notas`,
 1 AS `nombre_cliente`,
 1 AS `telefono_cliente`,
 1 AS `nombre_empleado`,
 1 AS `estado_cita`,
 1 AS `servicios`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_disponibilidad_empleados`
--

DROP TABLE IF EXISTS `v_disponibilidad_empleados`;
/*!50001 DROP VIEW IF EXISTS `v_disponibilidad_empleados`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_disponibilidad_empleados` AS SELECT 
 1 AS `empleado_id`,
 1 AS `nombre_empleado`,
 1 AS `dia_semana`,
 1 AS `hora_inicio`,
 1 AS `hora_fin`,
 1 AS `estado`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_estadisticas_correos`
--

DROP TABLE IF EXISTS `v_estadisticas_correos`;
/*!50001 DROP VIEW IF EXISTS `v_estadisticas_correos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_estadisticas_correos` AS SELECT 
 1 AS `fecha`,
 1 AS `plantilla_id`,
 1 AS `total_enviados`,
 1 AS `enviados_exitosos`,
 1 AS `enviados_fallidos`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_multimedia_por_tipo`
--

DROP TABLE IF EXISTS `v_multimedia_por_tipo`;
/*!50001 DROP VIEW IF EXISTS `v_multimedia_por_tipo`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_multimedia_por_tipo` AS SELECT 
 1 AS `tipo`,
 1 AS `total_archivos`,
 1 AS `total_imagenes`,
 1 AS `total_videos`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_ventas_diarias`
--

DROP TABLE IF EXISTS `v_ventas_diarias`;
/*!50001 DROP VIEW IF EXISTS `v_ventas_diarias`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_ventas_diarias` AS SELECT 
 1 AS `fecha`,
 1 AS `total_ventas`,
 1 AS `monto_total`,
 1 AS `impuesto_total`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `ventas_productos`
--

DROP TABLE IF EXISTS `ventas_productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas_productos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int DEFAULT NULL COMMENT 'Puede ser nulo si es cliente no registrado',
  `empleado_id` int NOT NULL COMMENT 'Empleado que realizó la venta',
  `fecha_venta` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `total` decimal(10,2) NOT NULL,
  `impuesto` decimal(10,2) DEFAULT '0.00',
  `metodo_pago_id` int NOT NULL,
  `estado_pago_id` int NOT NULL,
  `referencia_pago` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `empleado_id` (`empleado_id`),
  KEY `metodo_pago_id` (`metodo_pago_id`),
  KEY `estado_pago_id` (`estado_pago_id`),
  CONSTRAINT `ventas_productos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  CONSTRAINT `ventas_productos_ibfk_2` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`),
  CONSTRAINT `ventas_productos_ibfk_3` FOREIGN KEY (`metodo_pago_id`) REFERENCES `metodos_pago` (`id`),
  CONSTRAINT `ventas_productos_ibfk_4` FOREIGN KEY (`estado_pago_id`) REFERENCES `estados_pago` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `v_carruseles_activos`
--

/*!50001 DROP VIEW IF EXISTS `v_carruseles_activos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_carruseles_activos` AS select `c`.`id` AS `carrusel_id`,`c`.`nombre` AS `carrusel_nombre`,`c`.`descripcion` AS `carrusel_descripcion`,`c`.`velocidad_transicion` AS `velocidad_transicion`,`c`.`tipo_transicion` AS `tipo_transicion`,count(`cm`.`multimedia_id`) AS `total_elementos`,group_concat(distinct `m`.`titulo` separator ', ') AS `elementos` from ((`carruseles` `c` left join `carrusel_multimedia` `cm` on((`c`.`id` = `cm`.`carrusel_id`))) left join `multimedia` `m` on((`cm`.`multimedia_id` = `m`.`id`))) where ((`c`.`activo` = 1) and ((`cm`.`activo` = 1) or (`cm`.`activo` is null))) group by `c`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_citas_calendar`
--

/*!50001 DROP VIEW IF EXISTS `v_citas_calendar`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_citas_calendar` AS select `c`.`id` AS `cita_id`,`c`.`fecha_hora_inicio` AS `fecha_hora_inicio`,`c`.`fecha_hora_fin` AS `fecha_hora_fin`,concat(`u_cliente`.`nombre`,' ',`u_cliente`.`apellido`) AS `cliente`,concat(`u_empleado`.`nombre`,' ',`u_empleado`.`apellido`) AS `empleado`,`c`.`sincronizado_calendar` AS `sincronizado_calendar`,`c`.`event_id_calendar` AS `event_id_calendar`,`c`.`meet_link` AS `meet_link`,`ec`.`nombre` AS `estado_cita`,group_concat(`s`.`nombre` separator ', ') AS `servicios` from (((((((`citas` `c` join `clientes` `cl` on((`c`.`cliente_id` = `cl`.`id`))) join `usuarios` `u_cliente` on((`cl`.`usuario_id` = `u_cliente`.`id`))) join `empleados` `e` on((`c`.`empleado_id` = `e`.`id`))) join `usuarios` `u_empleado` on((`e`.`usuario_id` = `u_empleado`.`id`))) join `estados_citas` `ec` on((`c`.`estado_id` = `ec`.`id`))) join `cita_servicio` `cs` on((`c`.`id` = `cs`.`cita_id`))) join `servicios` `s` on((`cs`.`servicio_id` = `s`.`id`))) group by `c`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_citas_hoy`
--

/*!50001 DROP VIEW IF EXISTS `v_citas_hoy`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_citas_hoy` AS select `c`.`id` AS `id`,`c`.`fecha_hora_inicio` AS `fecha_hora_inicio`,`c`.`fecha_hora_fin` AS `fecha_hora_fin`,`c`.`notas` AS `notas`,concat(`u_cliente`.`nombre`,' ',`u_cliente`.`apellido`) AS `nombre_cliente`,`u_cliente`.`telefono` AS `telefono_cliente`,concat(`u_empleado`.`nombre`,' ',`u_empleado`.`apellido`) AS `nombre_empleado`,`ec`.`nombre` AS `estado_cita`,group_concat(`s`.`nombre` separator ', ') AS `servicios` from (((((((`citas` `c` join `clientes` `cl` on((`c`.`cliente_id` = `cl`.`id`))) join `usuarios` `u_cliente` on((`cl`.`usuario_id` = `u_cliente`.`id`))) join `empleados` `e` on((`c`.`empleado_id` = `e`.`id`))) join `usuarios` `u_empleado` on((`e`.`usuario_id` = `u_empleado`.`id`))) join `estados_citas` `ec` on((`c`.`estado_id` = `ec`.`id`))) join `cita_servicio` `cs` on((`c`.`id` = `cs`.`cita_id`))) join `servicios` `s` on((`cs`.`servicio_id` = `s`.`id`))) where (cast(`c`.`fecha_hora_inicio` as date) = curdate()) group by `c`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_disponibilidad_empleados`
--

/*!50001 DROP VIEW IF EXISTS `v_disponibilidad_empleados`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_disponibilidad_empleados` AS select `e`.`id` AS `empleado_id`,concat(`u`.`nombre`,' ',`u`.`apellido`) AS `nombre_empleado`,`he`.`dia_semana` AS `dia_semana`,`he`.`hora_inicio` AS `hora_inicio`,`he`.`hora_fin` AS `hora_fin`,(case when (`he`.`es_descanso` = 1) then 'Descanso' else 'Disponible' end) AS `estado` from ((`empleados` `e` join `usuarios` `u` on((`e`.`usuario_id` = `u`.`id`))) join `horarios_empleados` `he` on((`e`.`id` = `he`.`empleado_id`))) where (`e`.`activo` = 1) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_estadisticas_correos`
--

/*!50001 DROP VIEW IF EXISTS `v_estadisticas_correos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_estadisticas_correos` AS select cast(`correos_enviados`.`fecha_envio` as date) AS `fecha`,`correos_enviados`.`plantilla_id` AS `plantilla_id`,count(0) AS `total_enviados`,sum((case when (`correos_enviados`.`estado` = 'enviado') then 1 else 0 end)) AS `enviados_exitosos`,sum((case when (`correos_enviados`.`estado` = 'fallido') then 1 else 0 end)) AS `enviados_fallidos` from `correos_enviados` where (`correos_enviados`.`fecha_envio` is not null) group by cast(`correos_enviados`.`fecha_envio` as date),`correos_enviados`.`plantilla_id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_multimedia_por_tipo`
--

/*!50001 DROP VIEW IF EXISTS `v_multimedia_por_tipo`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_multimedia_por_tipo` AS select `tm`.`nombre` AS `tipo`,count(`m`.`id`) AS `total_archivos`,sum((case when (`m`.`tipo_archivo` = 'imagen') then 1 else 0 end)) AS `total_imagenes`,sum((case when (`m`.`tipo_archivo` = 'video') then 1 else 0 end)) AS `total_videos` from (`multimedia` `m` join `tipos_multimedia` `tm` on((`m`.`tipo_id` = `tm`.`id`))) where (`m`.`activo` = 1) group by `tm`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_ventas_diarias`
--

/*!50001 DROP VIEW IF EXISTS `v_ventas_diarias`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_ventas_diarias` AS select cast(`vp`.`fecha_venta` as date) AS `fecha`,count(`vp`.`id`) AS `total_ventas`,sum(`vp`.`total`) AS `monto_total`,sum(`vp`.`impuesto`) AS `impuesto_total` from `ventas_productos` `vp` group by cast(`vp`.`fecha_venta` as date) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-20 20:45:50
