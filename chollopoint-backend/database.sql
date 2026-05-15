-- ============================================================
--  CholloPoint — Esquema de base de datos MySQL
--  Ejecuta este archivo una sola vez para crear las tablas
-- ============================================================

CREATE DATABASE IF NOT EXISTS chollopoint CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chollopoint;

-- ── Usuarios ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100)        NOT NULL,
    alias         VARCHAR(50)         DEFAULT NULL,
    email         VARCHAR(191)        NOT NULL UNIQUE,
    password_hash VARCHAR(255)        NOT NULL,
    avatar        CHAR(1)             NOT NULL DEFAULT 'U',
    puntos        INT UNSIGNED        NOT NULL DEFAULT 0,
    bio           TEXT                DEFAULT NULL,
    ciudad        VARCHAR(100)        DEFAULT NULL,
    provincia     VARCHAR(100)        DEFAULT NULL,
    telefono      VARCHAR(20)         DEFAULT NULL,
    fecha_nac     DATE                DEFAULT NULL,
    color_avatar  TINYINT UNSIGNED    NOT NULL DEFAULT 0,
    fecha_registro DATETIME           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- ── Chollos (deals) ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chollos (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo          VARCHAR(255)        NOT NULL,
    descripcion     TEXT                DEFAULT NULL,
    precio_original DECIMAL(10,2)       NOT NULL,
    precio_oferta   DECIMAL(10,2)       NOT NULL,
    descuento       VARCHAR(10)         DEFAULT NULL,
    tienda          VARCHAR(150)        DEFAULT NULL,
    enlace          VARCHAR(2048)       DEFAULT NULL,
    imagen          VARCHAR(2048)       DEFAULT NULL,
    categoria       VARCHAR(80)         DEFAULT NULL,
    ciudad          VARCHAR(100)        DEFAULT NULL,
    comunidad       VARCHAR(100)        DEFAULT NULL,
    usuario_id      INT UNSIGNED        NOT NULL,
    publicado_por   VARCHAR(100)        NOT NULL,
    votos_positivos INT UNSIGNED        NOT NULL DEFAULT 0,
    votos_negativos INT UNSIGNED        NOT NULL DEFAULT 0,
    -- ── Ubicación exacta (opcional) ─────────────────────────────────────────
    -- Se rellena cuando el usuario introduce la dirección al publicar el chollo.
    -- Si es NULL el chollo no aparece en el mapa con marcador exacto.
    latitud         DECIMAL(10,8)       DEFAULT NULL,
    longitud        DECIMAL(11,8)       DEFAULT NULL,
    direccion_exacta TEXT               DEFAULT NULL,
    -- ────────────────────────────────────────────────────────────────────────
    creado_en       DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en       DATETIME            NOT NULL,          -- creado_en + 24h
    activo          TINYINT(1)          NOT NULL DEFAULT 1,
    INDEX idx_usuario  (usuario_id),
    INDEX idx_categoria (categoria),
    INDEX idx_ciudad   (ciudad),
    INDEX idx_expira   (expira_en),
    -- Índice para filtrar rápido los chollos con ubicación exacta
    INDEX idx_coords   (latitud, longitud),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Comentarios ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comentarios (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chollo_id   INT UNSIGNED    NOT NULL,
    usuario_id  INT UNSIGNED    NOT NULL,
    texto       TEXT            NOT NULL,
    votos       INT             NOT NULL DEFAULT 0,
    creado_en   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chollo (chollo_id),
    FOREIGN KEY (chollo_id)  REFERENCES chollos(id)  ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Votos en chollos ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votos_chollos (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chollo_id   INT UNSIGNED    NOT NULL,
    usuario_id  INT UNSIGNED    NOT NULL,
    tipo        ENUM('positivo','negativo') NOT NULL,
    creado_en   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_voto (chollo_id, usuario_id),
    FOREIGN KEY (chollo_id)  REFERENCES chollos(id)  ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Votos en comentarios ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votos_comentarios (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    comentario_id  INT UNSIGNED    NOT NULL,
    usuario_id     INT UNSIGNED    NOT NULL,
    tipo           ENUM('positivo','negativo') NOT NULL DEFAULT 'positivo',
    creado_en      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_voto_com (comentario_id, usuario_id),
    FOREIGN KEY (comentario_id) REFERENCES comentarios(id)  ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Favoritos ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favoritos (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNSIGNED    NOT NULL,
    chollo_id   INT UNSIGNED    NOT NULL,
    creado_en   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_fav (usuario_id, chollo_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (chollo_id)  REFERENCES chollos(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Chollos estáticos de ejemplo ──────────────────────────────────────────────
INSERT IGNORE INTO usuarios (id, nombre, email, password_hash, avatar, puntos)
VALUES
    (1, 'Carlos García', 'carlos@ejemplo.com',
     '$2y$12$examplehashforcarlos000000000000000000000000000000000000',
     'C', 340),
    (2, 'Ana Martínez', 'ana@ejemplo.com',
     '$2y$12$examplehashforana0000000000000000000000000000000000000000',
     'A', 175);

INSERT IGNORE INTO chollos
    (id, titulo, descripcion, precio_original, precio_oferta, descuento,
     tienda, enlace, imagen, categoria, ciudad, comunidad,
     usuario_id, publicado_por, votos_positivos, votos_negativos,
     creado_en, expira_en)
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


-- ============================================================
--  MIGRACIÓN: Si ya tienes la tabla creada sin estas columnas,
--  ejecuta solo este bloque (no el CREATE TABLE completo de arriba).
-- ============================================================
-- ALTER TABLE chollos
--     ADD COLUMN latitud          DECIMAL(10,8) DEFAULT NULL AFTER comunidad,
--     ADD COLUMN longitud         DECIMAL(11,8) DEFAULT NULL AFTER latitud,
--     ADD COLUMN direccion_exacta TEXT          DEFAULT NULL AFTER longitud,
--     ADD INDEX  idx_coords (latitud, longitud);