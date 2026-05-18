


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table chollos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `chollos`;

CREATE TABLE `chollos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text,
  `precio_original` decimal(10,2) NOT NULL,
  `precio_oferta` decimal(10,2) NOT NULL,
  `descuento` varchar(10) DEFAULT NULL,
  `tienda` varchar(150) DEFAULT NULL,
  `enlace` varchar(2048) DEFAULT NULL,
  `imagen` varchar(2048) DEFAULT NULL,
  `categoria` varchar(80) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `comunidad` varchar(100) DEFAULT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `direccion_exacta` text,
  `usuario_id` int(10) unsigned NOT NULL,
  `publicado_por` varchar(100) NOT NULL,
  `votos_positivos` int(10) unsigned NOT NULL DEFAULT '0',
  `votos_negativos` int(10) unsigned NOT NULL DEFAULT '0',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expira_en` datetime NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_ciudad` (`ciudad`),
  KEY `idx_expira` (`expira_en`),
  KEY `idx_coords` (`latitud`,`longitud`),
  CONSTRAINT `chollos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4;

LOCK TABLES `chollos` WRITE;
/*!40000 ALTER TABLE `chollos` DISABLE KEYS */;

INSERT INTO `chollos` (`id`, `titulo`, `descripcion`, `precio_original`, `precio_oferta`, `descuento`, `tienda`, `enlace`, `imagen`, `categoria`, `ciudad`, `comunidad`, `latitud`, `longitud`, `direccion_exacta`, `usuario_id`, `publicado_por`, `votos_positivos`, `votos_negativos`, `creado_en`, `expira_en`, `activo`) VALUES
	(3, 'Sony WH-1000XM5 Auriculares Noise Cancelling', 'Auriculares inalámbricos con cancelación de ruido líder en su clase, 30h de batería y sonido Hi-Res. Precio histórico mínimo.', 379.00, 189.00, '-50%', 'Amazon', 'https://www.amazon.es/dp/B09XS7JWHH', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600', 'Alimentación', 'Alicante', 'Alicante', 37.32601050, -5.85881860, NULL, 3, 'Anónimo', 2, 0, '2026-05-16 14:46:35', '2026-05-17 14:46:35', 1),
	(4, 'Zapatillas Nike Air Max 270 Talla 42', 'Zapatillas deportivas Nike Air Max 270 en color negro/blanco. Talla 42. Stock limitado en tienda física de Sevilla.', 150.00, 74.99, '-50%', 'Nike Store Sevilla', 'https://www.nike.com/es', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'Deportes', 'Sevilla', 'Sevilla', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(5, 'Smart TV Samsung 55\" 4K QLED', 'Televisor Samsung QLED 55 pulgadas con resolución 4K, HDR10+ y sistema operativo Tizen. Envío gratis a toda España.', 899.00, 449.00, '-50%', 'MediaMarkt', 'https://www.mediamarkt.es', 'https://images.unsplash.com/photo-1593359677879-a4bb92f4534a?w=600', 'Electrónica', 'Barcelona', 'Cataluña', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(6, 'Freidora de Aire Cosori 5.5L', 'Freidora sin aceite Cosori XXL de 5.5 litros, 1700W y 11 programas preestablecidos. Ideal para familias grandes.', 119.99, 59.99, '-50%', 'Amazon', 'https://www.amazon.es', 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=600', 'Hogar', 'Madrid', 'Madrid', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(7, 'Menú Degustación Restaurante El Faro', 'Menú degustación de 8 platos con maridaje incluido en el restaurante El Faro de Cádiz. Precio por persona.', 85.00, 49.00, '-42%', 'El Faro Cádiz', 'https://www.elfarodecadiz.com', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', 'Alimentación', 'Cádiz', 'Andalucía', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(8, 'Vuelo Madrid-Canarias ida y vuelta', 'Vuelo directo Madrid Barajas a Tenerife Sur ida y vuelta para 1 persona. Incluye maleta de mano. Fechas de junio.', 220.00, 89.00, '-60%', 'Vueling', 'https://www.vueling.com', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600', 'Viajes', 'Madrid', 'Madrid', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(9, 'PlayStation 5 + 2 Juegos Bundle', 'Consola PS5 edición estándar con lector de discos + God of War Ragnarök + FIFA 24. Bundle exclusivo online.', 649.00, 499.00, '-23%', 'El Corte Inglés', 'https://www.elcorteingles.es', 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600', 'Electrónica', 'Valencia', 'Valencia', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(10, 'Chaqueta Zara Hombre Temporada', 'Chaqueta de punto grueso Zara para hombre en color camel. Tallas S a XL disponibles. Fin de temporada.', 59.95, 19.99, '-67%', 'Zara', 'https://www.zara.com/es', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', 'Moda', 'Zaragoza', 'Aragón', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(11, 'Robot Aspirador Roomba i3+', 'Roomba i3+ con vaciado automático, navegación inteligente y compatible con Alexa y Google Home. Reacondicionado garantía 1 año.', 499.00, 229.00, '-54%', 'iRobot Oficial', 'https://www.irobot.es', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Hogar', 'Bilbao', 'País Vasco', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(12, 'Pack Cervezas Artesanales Galicia', 'Pack de 12 cervezas artesanales de diferentes estilos de la cervecería gallega Estrella Galicia edición especial.', 28.00, 16.50, '-41%', 'Bodeboca', 'https://www.bodeboca.com', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600', 'Alimentación', 'Santiago de Compostela', 'Galicia', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(13, 'Bicicleta Eléctrica Orbea Gain', 'Bicicleta eléctrica Orbea Gain M30 con motor Shimano Steps 250W, batería 360Wh y autonomía de 100km.', 2800.00, 1890.00, '-33%', 'Orbea', 'https://www.orbea.com/es-es', 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600', 'Deportes', 'Vitoria', 'País Vasco', NULL, NULL, NULL, 3, 'fernando', 0, 0, '2026-05-16 16:22:36', '2026-05-17 16:22:36', 1),
	(14, 'Zapatillas Nike Air Max 270 Talla 42', 'Zapatillas deportivas Nike Air Max 270 en color negro/blanco. Talla 42. Stock limitado en tienda física de Sevilla.', 150.00, 74.99, '-50%', 'Nike Store Sevilla', 'https://www.nike.com/es', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'Deportes', 'Sevilla', 'Andalucía', 37.38263800, -5.99626300, 'Calle Tetuan, Sevilla, Andalucía, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(15, 'Smart TV Samsung 55\" 4K QLED', 'Televisor Samsung QLED 55 pulgadas con resolución 4K, HDR10+ y sistema operativo Tizen. Envío gratis a toda España.', 899.00, 449.00, '-50%', 'MediaMarkt', 'https://www.mediamarkt.es', 'https://images.unsplash.com/photo-1593359677879-a4bb92f4534a?w=600', 'Electrónica', 'Barcelona', 'Cataluña', 41.38507900, 2.17340100, 'Avinguda Diagonal, Barcelona, Cataluña, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(16, 'Freidora de Aire Cosori 5.5L', 'Freidora sin aceite Cosori XXL de 5.5 litros, 1700W y 11 programas preestablecidos. Ideal para familias grandes.', 119.99, 59.99, '-50%', 'Amazon', 'https://www.amazon.es', 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=600', 'Hogar', 'Madrid', 'Madrid', 40.41650000, -3.70256000, 'Gran Vía, Madrid, Comunidad de Madrid, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(17, 'Menú Degustación Restaurante El Faro', 'Menú degustación de 8 platos con maridaje incluido en el restaurante El Faro de Cádiz. Precio por persona.', 85.00, 49.00, '-42%', 'El Faro Cádiz', 'https://www.elfarodecadiz.com', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', 'Alimentación', 'Cádiz', 'Andalucía', 36.52965000, -6.29241600, 'Calle San Félix 15, Cádiz, Andalucía, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(18, 'Vuelo Madrid-Canarias ida y vuelta', 'Vuelo directo Madrid Barajas a Tenerife Sur ida y vuelta para 1 persona. Incluye maleta de mano. Fechas de junio.', 220.00, 89.00, '-60%', 'Vueling', 'https://www.vueling.com', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600', 'Viajes', 'Madrid', 'Madrid', 40.47193700, -3.56264100, 'Aeropuerto Adolfo Suárez Madrid-Barajas, Madrid, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(19, 'PlayStation 5 + 2 Juegos Bundle', 'Consola PS5 edición estándar con lector de discos + God of War Ragnarök + FIFA 24. Bundle exclusivo online.', 649.00, 499.00, '-23%', 'El Corte Inglés', 'https://www.elcorteingles.es', 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=600', 'Electrónica', 'Valencia', 'Valencia', 39.46990600, -0.37628800, 'Calle Colón, Valencia, Comunitat Valenciana, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(20, 'Chaqueta Zara Hombre Temporada', 'Chaqueta de punto grueso Zara para hombre en color camel. Tallas S a XL disponibles. Fin de temporada.', 59.95, 19.99, '-67%', 'Zara', 'https://www.zara.com/es', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', 'Moda', 'Zaragoza', 'Aragón', 41.65186400, -0.88763100, 'Paseo de la Independencia, Zaragoza, Aragón, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(21, 'Robot Aspirador Roomba i3+', 'Roomba i3+ con vaciado automático, navegación inteligente y compatible con Alexa y Google Home. Reacondicionado garantía 1 año.', 499.00, 229.00, '-54%', 'iRobot Oficial', 'https://www.irobot.es', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', 'Hogar', 'Bilbao', 'País Vasco', 43.26303400, -2.93497700, 'Gran Vía de Don Diego López de Haro, Bilbao, País Vasco, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(22, 'Pack Cervezas Artesanales Galicia', 'Pack de 12 cervezas artesanales de diferentes estilos de la cervecería gallega Estrella Galicia edición especial.', 28.00, 16.50, '-41%', 'Bodeboca', 'https://www.bodeboca.com', 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600', 'Alimentación', 'Santiago de Compostela', 'Galicia', 42.87883800, -8.54402700, 'Rúa do Vilar, Santiago de Compostela, Galicia, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(23, 'Bicicleta Eléctrica Orbea Gain', 'Bicicleta eléctrica Orbea Gain M30 con motor Shimano Steps 250W, batería 360Wh y autonomía de 100km.', 2800.00, 1890.00, '-33%', 'Orbea', 'https://www.orbea.com/es-es', 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600', 'Deportes', 'Vitoria', 'País Vasco', 42.84973800, -2.67226800, 'Calle Dato, Vitoria-Gasteiz, País Vasco, España', 3, 'fernando', 0, 0, '2026-05-16 16:28:00', '2026-05-17 16:28:00', 1),
	(24, 'dsfsdf', '', 10.00, 5.00, '-50%', 'ddsfdsf', '', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600', 'Hogar', 'Alicante', 'Alicante', 37.32601050, -5.85881860, NULL, 4, 'Anónimo', 0, 0, '2026-05-18 08:19:41', '2026-05-19 08:19:41', 1);

/*!40000 ALTER TABLE `chollos` ENABLE KEYS */;
UNLOCK TABLES;



# Dump of table comentarios
# ------------------------------------------------------------

DROP TABLE IF EXISTS `comentarios`;

CREATE TABLE `comentarios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `chollo_id` int(10) unsigned NOT NULL,
  `usuario_id` int(10) unsigned NOT NULL,
  `texto` text NOT NULL,
  `votos` int(11) NOT NULL DEFAULT '0',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `votos_positivos` int(11) NOT NULL DEFAULT '0',
  `votos_negativos` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_chollo` (`chollo_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`chollo_id`) REFERENCES `chollos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

LOCK TABLES `comentarios` WRITE;
/*!40000 ALTER TABLE `comentarios` DISABLE KEYS */;

INSERT INTO `comentarios` (`id`, `chollo_id`, `usuario_id`, `texto`, `votos`, `creado_en`, `votos_positivos`, `votos_negativos`) VALUES
	(1, 3, 3, 'que guapo', 0, '2026-05-16 14:47:10', 2, 0);

/*!40000 ALTER TABLE `comentarios` ENABLE KEYS */;
UNLOCK TABLES;



# Dump of table favoritos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `favoritos`;

CREATE TABLE `favoritos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` int(10) unsigned NOT NULL,
  `chollo_id` int(10) unsigned NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fav` (`usuario_id`,`chollo_id`),
  KEY `chollo_id` (`chollo_id`),
  CONSTRAINT `favoritos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favoritos_ibfk_2` FOREIGN KEY (`chollo_id`) REFERENCES `chollos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;





# Dump of table usuarios
# ------------------------------------------------------------

DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `alias` varchar(50) DEFAULT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `avatar` char(1) NOT NULL DEFAULT 'U',
  `puntos` int(10) unsigned NOT NULL DEFAULT '0',
  `bio` text,
  `ciudad` varchar(100) DEFAULT NULL,
  `provincia` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_nac` date DEFAULT NULL,
  `color_avatar` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `rol` varchar(20) NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;

INSERT INTO `usuarios` (`id`, `nombre`, `alias`, `email`, `password_hash`, `avatar`, `puntos`, `bio`, `ciudad`, `provincia`, `telefono`, `fecha_nac`, `color_avatar`, `fecha_registro`, `updated_at`, `rol`) VALUES
	(3, 'fernando', 'dfsdf', 'f@gmail.com', '$2y$10$VlX2/jbhRxjUz/zPaJ.h4u0ZzpXqNhD/PtrB9Z8Go0VEFDspkUAQ.', 'F', 6, 'sdfsdf', 'ALCALÁ DE GUADAÍRA', 'Sevilla', '+34675217729', '2026-05-05', 0, '2026-05-16 14:44:37', '2026-05-18 07:56:11', 'admin'),
	(4, 'jose', NULL, 'j@ejemplo.com', '$2y$10$NVKtoR1KoKQp4eDKZjfq..5fZ/lR1ZH8ZNiJ5fl8oDKVpW998Inhq', 'J', 0, NULL, NULL, NULL, NULL, NULL, 0, '2026-05-18 08:18:06', '2026-05-18 08:18:06', 'user');

/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;



# Dump of table votos_chollos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `votos_chollos`;

CREATE TABLE `votos_chollos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `chollo_id` int(10) unsigned NOT NULL,
  `usuario_id` int(10) unsigned NOT NULL,
  `tipo` enum('positivo','negativo') NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_voto` (`chollo_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `votos_chollos_ibfk_1` FOREIGN KEY (`chollo_id`) REFERENCES `chollos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `votos_chollos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

LOCK TABLES `votos_chollos` WRITE;
/*!40000 ALTER TABLE `votos_chollos` DISABLE KEYS */;

INSERT INTO `votos_chollos` (`id`, `chollo_id`, `usuario_id`, `tipo`, `creado_en`) VALUES
	(1, 3, 3, 'positivo', '2026-05-16 14:47:15');

/*!40000 ALTER TABLE `votos_chollos` ENABLE KEYS */;
UNLOCK TABLES;



# Dump of table votos_comentarios
# ------------------------------------------------------------

DROP TABLE IF EXISTS `votos_comentarios`;

CREATE TABLE `votos_comentarios` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `comentario_id` int(10) unsigned NOT NULL,
  `usuario_id` int(10) unsigned NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipo` enum('positivo','negativo') NOT NULL DEFAULT 'positivo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_voto_com` (`comentario_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `votos_comentarios_ibfk_1` FOREIGN KEY (`comentario_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `votos_comentarios_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;

LOCK TABLES `votos_comentarios` WRITE;
/*!40000 ALTER TABLE `votos_comentarios` DISABLE KEYS */;

INSERT INTO `votos_comentarios` (`id`, `comentario_id`, `usuario_id`, `creado_en`, `tipo`) VALUES
	(1, 1, 3, '2026-05-16 14:47:22', 'positivo');

/*!40000 ALTER TABLE `votos_comentarios` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;


