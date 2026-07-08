-- ============================================================
-- CATÁLOGO TIENDA ÍNTIMA — Schema MySQL 8.0+
-- Motor: InnoDB | Charset: utf8mb4_unicode_ci
-- Ejecutar en orden: 01_schema → 02_seed → 03_queries
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. categorias  (auto-referencial para subcategorías)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
    id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    nombre     VARCHAR(100)     NOT NULL,
    id_padre   INT UNSIGNED     NULL DEFAULT NULL COMMENT 'NULL = categoría raíz',
    creado_en  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_cat_padre FOREIGN KEY (id_padre)
        REFERENCES categorias (id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_cat_padre (id_padre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Árbol de categorías y subcategorías';

-- ------------------------------------------------------------
-- 2. marcas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS marcas (
    id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    nombre     VARCHAR(100)     NOT NULL,
    creado_en  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_marca_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Marcas de prendas';

-- ------------------------------------------------------------
-- 3. telas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telas (
    id           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre       VARCHAR(100)    NOT NULL,
    composicion  VARCHAR(255)    NOT NULL COMMENT 'Ej: 100% Algodón Pima Peruano',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tipos de tela con composición de materiales';

-- ------------------------------------------------------------
-- 4. colores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colores (
    id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre  VARCHAR(100)    NOT NULL,
    hex     CHAR(7)         NOT NULL COMMENT 'Formato #RRGGBB',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Paleta de colores disponibles';

-- ------------------------------------------------------------
-- 5. tallas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tallas (
    id      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre  VARCHAR(20)     NOT NULL,
    orden   TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Orden de presentación en UI',
    PRIMARY KEY (id),
    UNIQUE KEY uq_talla_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tallas disponibles (S, M, L, XL, etc.)';

-- ------------------------------------------------------------
-- 6. productos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(200)        NOT NULL,
    descripcion     TEXT                NULL,
    precio_base     DECIMAL(12, 2)      NOT NULL DEFAULT 0.00,
    genero          ENUM('Hombre','Mujer','Unisex') NOT NULL DEFAULT 'Unisex',
    temporada       VARCHAR(60)         NULL     COMMENT 'Ej: Primavera-Verano',
    activo          TINYINT(1)          NOT NULL DEFAULT 1,
    id_categoria    INT UNSIGNED        NULL,
    id_marca        INT UNSIGNED        NULL,
    id_tela         INT UNSIGNED        NULL,
    creado_en       TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                 ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_prod_categoria FOREIGN KEY (id_categoria)
        REFERENCES categorias (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_prod_marca FOREIGN KEY (id_marca)
        REFERENCES marcas (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_prod_tela FOREIGN KEY (id_tela)
        REFERENCES telas (id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_prod_categoria  (id_categoria),
    INDEX idx_prod_marca      (id_marca),
    INDEX idx_prod_tela       (id_tela),
    INDEX idx_prod_activo     (activo),
    INDEX idx_prod_genero     (genero),
    INDEX idx_prod_precio     (precio_base),
    FULLTEXT INDEX ft_prod_nombre (nombre, descripcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo maestro de productos';

-- ------------------------------------------------------------
-- 7. variantes  (producto + color + talla → sku único)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS variantes (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_producto     INT UNSIGNED    NOT NULL,
    id_color        INT UNSIGNED    NULL,
    id_talla        INT UNSIGNED    NULL,
    sku             VARCHAR(100)    NOT NULL,
    precio          DECIMAL(12, 2)  NOT NULL,
    stock           INT             NOT NULL DEFAULT 0 CHECK (stock >= 0),
    actualizado_en  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sku (sku),
    UNIQUE KEY uq_variante_combinacion (id_producto, id_color, id_talla),
    CONSTRAINT fk_var_producto FOREIGN KEY (id_producto)
        REFERENCES productos (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_var_color FOREIGN KEY (id_color)
        REFERENCES colores (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_var_talla FOREIGN KEY (id_talla)
        REFERENCES tallas (id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_var_producto (id_producto),
    INDEX idx_var_precio   (precio),
    INDEX idx_var_stock    (stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Variantes de producto: combinación única de color + talla con su propio SKU, precio y stock';

-- ------------------------------------------------------------
-- 8. imagenes  (Cloudinary)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imagenes (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_producto             INT UNSIGNED    NOT NULL,
    id_variante             INT UNSIGNED    NULL DEFAULT NULL,
    cloudinary_public_id    VARCHAR(255)    NOT NULL COMMENT 'ID en Cloudinary para gestión de borrado',
    url                     VARCHAR(500)    NOT NULL COMMENT 'URL optimizada de Cloudinary',
    es_principal            TINYINT(1)      NOT NULL DEFAULT 0,
    orden                   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_img_producto FOREIGN KEY (id_producto)
        REFERENCES productos (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_img_variante FOREIGN KEY (id_variante)
        REFERENCES variantes (id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_img_producto           (id_producto),
    INDEX idx_img_variante           (id_variante),
    INDEX idx_img_cloudinary_pub_id  (cloudinary_public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Imágenes almacenadas en Cloudinary, vinculadas a producto y/o variante';

-- ------------------------------------------------------------
-- 9. proveedores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(150)    NOT NULL,
    contacto    VARCHAR(150)    NULL,
    email       VARCHAR(150)    NULL,
    telefono    VARCHAR(30)     NULL,
    creado_en   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_prov_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Proveedores de productos';

-- ------------------------------------------------------------
-- 10. producto_proveedor  (N:M)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS producto_proveedor (
    id_producto     INT UNSIGNED    NOT NULL,
    id_proveedor    INT UNSIGNED    NOT NULL,
    PRIMARY KEY (id_producto, id_proveedor),
    CONSTRAINT fk_pp_producto FOREIGN KEY (id_producto)
        REFERENCES productos (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_pp_proveedor FOREIGN KEY (id_proveedor)
        REFERENCES proveedores (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Relación N:M entre productos y proveedores';

-- ------------------------------------------------------------
-- 11. admin_usuarios  (para autenticación JWT del panel)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_usuarios (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    email           VARCHAR(150)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL COMMENT 'bcrypt hash',
    nombre          VARCHAR(100)    NULL,
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios administradores del panel de gestión';

SET FOREIGN_KEY_CHECKS = 1;
