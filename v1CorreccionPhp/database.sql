

CREATE DATABASE IF NOT EXISTS chollopoint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chollopoint;


CREATE TABLE IF NOT EXISTS `usuarios` (
    `id`              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    `nombre`          VARCHAR(100)      NOT NULL,
    `alias`           VARCHAR(50)       DEFAULT NULL,
    `email`           VARCHAR(191)      NOT NULL,
    `password_hash`   VARCHAR(255)      NOT NULL,               
    `avatar`          CHAR(1)           NOT NULL DEFAULT 'U',    
    `puntos`          INT UNSIGNED      NOT NULL DEFAULT '0',
    `bio`             TEXT              DEFAULT NULL,
    `ciudad`          VARCHAR(100)      DEFAULT NULL,
    `provincia`       VARCHAR(100)      DEFAULT NULL,
    `telefono`        VARCHAR(20)       DEFAULT NULL,
    `fecha_nac`       DATE              DEFAULT NULL,
    `color_avatar`    TINYINT UNSIGNED  NOT NULL DEFAULT '0',   
    `fecha_registro`  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `email` (`email`),
    KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `chollos` (
    `id`               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    `titulo`           VARCHAR(255)   NOT NULL,
    `descripcion`      TEXT           DEFAULT NULL,
    `precio_original`  DECIMAL(10,2)  NOT NULL,
    `precio_oferta`    DECIMAL(10,2)  NOT NULL,
    `descuento`        VARCHAR(10)    DEFAULT NULL,              
    `tienda`           VARCHAR(150)   DEFAULT NULL,
    `enlace`           VARCHAR(2048)  DEFAULT NULL,
    `imagen`           VARCHAR(2048)  DEFAULT NULL,
    `categoria`        VARCHAR(80)    DEFAULT NULL,
    `ciudad`           VARCHAR(100)   DEFAULT NULL,
    `comunidad`        VARCHAR(100)   DEFAULT NULL,
    `latitud`          DECIMAL(10,8)  DEFAULT NULL,
    `longitud`         DECIMAL(11,8)  DEFAULT NULL,
    `direccion_exacta` TEXT           DEFAULT NULL,
    `usuario_id`       INT UNSIGNED   NOT NULL,
    `publicado_por`    VARCHAR(100)   NOT NULL,
    `votos_positivos`  INT UNSIGNED   NOT NULL DEFAULT '0',
    `votos_negativos`  INT UNSIGNED   NOT NULL DEFAULT '0',
    `creado_en`        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expira_en`        DATETIME       NOT NULL,                  
    `activo`           TINYINT(1)     NOT NULL DEFAULT '1',
    PRIMARY KEY (`id`),
    KEY `idx_usuario`   (`usuario_id`),
    KEY `idx_categoria` (`categoria`),
    KEY `idx_ciudad`    (`ciudad`),
    KEY `idx_expira`    (`expira_en`),
    KEY `idx_coords`    (`latitud`, `longitud`)                  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `comentarios` (
    `id`               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `chollo_id`        INT UNSIGNED  NOT NULL,
    `usuario_id`       INT UNSIGNED  NOT NULL,
    `texto`            TEXT          NOT NULL,
    `votos`            INT           NOT NULL DEFAULT '0',       
    `creado_en`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `votos_positivos`  INT           NOT NULL DEFAULT '0',      
    `votos_negativos`  INT           NOT NULL DEFAULT '0',       
    PRIMARY KEY (`id`),
    KEY `idx_chollo`  (`chollo_id`),
    KEY `usuario_id`  (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `favoritos` (
    `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `usuario_id`  INT UNSIGNED  NOT NULL,
    `chollo_id`   INT UNSIGNED  NOT NULL,
    `creado_en`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_fav` (`usuario_id`, `chollo_id`),
    KEY `chollo_id` (`chollo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `votos_chollos` (
    `id`          INT UNSIGNED                  NOT NULL AUTO_INCREMENT,
    `chollo_id`   INT UNSIGNED                  NOT NULL,
    `usuario_id`  INT UNSIGNED                  NOT NULL,
    `tipo`        ENUM('positivo','negativo')   NOT NULL,
    `creado_en`   DATETIME                      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_voto` (`chollo_id`, `usuario_id`),
    KEY `usuario_id` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `votos_comentarios` (
    `id`             INT UNSIGNED                  NOT NULL AUTO_INCREMENT,
    `comentario_id`  INT UNSIGNED                  NOT NULL,
    `usuario_id`     INT UNSIGNED                  NOT NULL,
    `creado_en`      DATETIME                      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `tipo`           ENUM('positivo','negativo')   NOT NULL DEFAULT 'positivo',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_voto_com` (`comentario_id`, `usuario_id`),
    KEY `usuario_id` (`usuario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE `chollos`
    ADD CONSTRAINT `chollos_ibfk_1`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

ALTER TABLE `comentarios`
    ADD CONSTRAINT `comentarios_ibfk_1`
    FOREIGN KEY (`chollo_id`)  REFERENCES `chollos`  (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `comentarios_ibfk_2`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

ALTER TABLE `favoritos`
    ADD CONSTRAINT `favoritos_ibfk_1`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `favoritos_ibfk_2`
    FOREIGN KEY (`chollo_id`)  REFERENCES `chollos`  (`id`) ON DELETE CASCADE;

ALTER TABLE `votos_chollos`
    ADD CONSTRAINT `votos_chollos_ibfk_1`
    FOREIGN KEY (`chollo_id`)  REFERENCES `chollos`  (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `votos_chollos_ibfk_2`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

ALTER TABLE `votos_comentarios`
    ADD CONSTRAINT `votos_comentarios_ibfk_1`
    FOREIGN KEY (`comentario_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `votos_comentarios_ibfk_2`
    FOREIGN KEY (`usuario_id`)    REFERENCES `usuarios`    (`id`) ON DELETE CASCADE;


INSERT IGNORE INTO `usuarios`
    (`id`, `nombre`, `email`, `password_hash`, `avatar`, `puntos`)
VALUES
    (1, 'Carlos García', 'carlos@ejemplo.com',
     '$2y$12$examplehashforcarlos000000000000000000000000000000000000',
     'C', 340),
    (2, 'Ana Martínez', 'ana@ejemplo.com',
     '$2y$12$examplehashforana0000000000000000000000000000000000000000',
     'A', 175);

INSERT IGNORE INTO `chollos`
    (`id`, `titulo`, `descripcion`, `precio_original`, `precio_oferta`, `descuento`,
     `tienda`, `enlace`, `imagen`, `categoria`, `ciudad`, `comunidad`,
     `usuario_id`, `publicado_por`, `votos_positivos`, `votos_negativos`,
     `creado_en`, `expira_en`)
VALUES
    (1,
     'Menú Pizza Mediana + Entrante + Bebida',
     'Válido en todos los locales hasta fin de mes',
     18.95, 9.95, '-47%',
     'PizzaPlace', 'https://www.pizzaplace.com',
     'https://images.unsplash.com/photo-1601924638867-3ec2f9b5b0b0?q=80&w=1000',
     'Alimentación', 'Madrid', 'Madrid',
     1, 'Carlos García', 10, 2,
     NOW(), DATE_ADD(NOW(), INTERVAL 9999 DAY)),

    (2,
     'PlayStation 5 + 2 Juegos',
     'PS5 con lector + Spider-Man 2 + FIFA 24',
     649.99, 499.99, '-23%',
     'GameStore', 'https://www.gamestore.com',
     'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=1000',
     'Electrónica', 'Barcelona', 'Cataluña',
     2, 'Ana Martínez', 50, 7,
     NOW(), DATE_ADD(NOW(), INTERVAL 9999 DAY));

