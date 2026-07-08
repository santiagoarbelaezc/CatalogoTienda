-- ============================================================
-- CATÁLOGO TIENDA ÍNTIMA — Seed Data
-- Ejecutar DESPUÉS de 01_schema.sql
-- Incluye: 3 categorías padre + 7 subcategorías, 3 marcas,
--          5 telas, 6 colores, 4 tallas, 5 productos con
--          variantes reales, 2 proveedores, 1 admin usuario
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Categorías (árbol: 3 raíz → 7 hijos)
-- ------------------------------------------------------------
INSERT IGNORE INTO categorias (id, nombre, id_padre) VALUES
-- Raíz
(1, 'Superior',    NULL),
(2, 'Inferior',    NULL),
(3, 'Accesorios',  NULL),
-- Hijos de Superior
(11, 'Camisas',    1),
(12, 'Camisetas',  1),
(13, 'Chaquetas',  1),
-- Hijos de Inferior
(21, 'Pantalones', 2),
(22, 'Bermudas',   2),
-- Hijos de Accesorios
(31, 'Gorros',     3);

-- ------------------------------------------------------------
-- Marcas
-- ------------------------------------------------------------
INSERT IGNORE INTO marcas (id, nombre) VALUES
(1, 'Atelier Premium'),
(2, 'Urban Wear'),
(3, 'EcoThreads');

-- ------------------------------------------------------------
-- Telas
-- ------------------------------------------------------------
INSERT IGNORE INTO telas (id, nombre, composicion) VALUES
(1, 'Algodón Pima',     '100% Algodón Pima Peruano'),
(2, 'Denim Selvedge',   '98% Algodón, 2% Elastano'),
(3, 'Lino Orgánico',    '100% Lino Italiano'),
(4, 'Lana Merino',      '100% Lana Merino de Nueva Zelanda'),
(5, 'Cuero Nappa',      '15% Forro Poliéster, 85% Cuero Vacuno');

-- ------------------------------------------------------------
-- Colores
-- ------------------------------------------------------------
INSERT IGNORE INTO colores (id, nombre, hex) VALUES
(1, 'Negro Absoluto',   '#0B0B0C'),
(2, 'Blanco Crudo',     '#F5F5F0'),
(3, 'Azul Navy',        '#1C2E4A'),
(4, 'Verde Oliva',      '#4B5320'),
(5, 'Gris Melange',     '#8E9196'),
(6, 'Camel',            '#C19A6B');

-- ------------------------------------------------------------
-- Tallas (con orden para UI)
-- ------------------------------------------------------------
INSERT IGNORE INTO tallas (id, nombre, orden) VALUES
(1, 'S',  1),
(2, 'M',  2),
(3, 'L',  3),
(4, 'XL', 4);

-- ------------------------------------------------------------
-- Productos
-- ------------------------------------------------------------
INSERT IGNORE INTO productos (id, nombre, descripcion, precio_base, genero, temporada, activo, id_categoria, id_marca, id_tela) VALUES
(1,
 'Camiseta Pima Essential',
 'Camiseta de corte clásico confeccionada en algodón Pima peruano de tacto ultrasuave. Su tejido de alta densidad ofrece una caída perfecta y resistencia superior al desgaste y los lavados.',
 89000.00, 'Unisex', 'Primavera-Verano', 1, 12, 2, 1),

(2,
 'Chaqueta de Cuero Nappa Biker',
 'Diseño icónico elaborado en cuero nappa premium. Cremalleras metálicas YKK de alta resistencia y forro interior satinado. Corte entallado con detalles acolchados en hombros.',
 450000.00, 'Hombre', 'Otoño-Invierno', 1, 13, 1, 5),

(3,
 'Jeans Selvedge Slim Fit',
 'Jeans en denim selvedge de alta calidad con toque de elasticidad. Color añil profundo que desarrolla un desgaste único con el uso prolongado. Acabados artesanales a mano.',
 189000.00, 'Hombre', 'Otoño-Invierno', 1, 21, 2, 2),

(4,
 'Camisa Lino Orgánico Resort',
 'Camisa ligera y transpirable en lino orgánico de alta calidad. Perfecta para climas cálidos y ocasiones casuales elegantes. Cuello campana retro y botones de coco natural.',
 149000.00, 'Unisex', 'Primavera-Verano', 1, 11, 3, 3),

(5,
 'Abrigo Overcoat de Lana Merino',
 'Abrigo largo estructurado tejido en pura lana merino italiana. Prenda atemporal para el frío extremo, con solapas de muesca clásica, bolsillos de doble vivo y forro completo.',
 380000.00, 'Mujer', 'Otoño-Invierno', 1, 13, 1, 4);

-- ------------------------------------------------------------
-- Variantes
-- ------------------------------------------------------------
INSERT IGNORE INTO variantes (id, id_producto, id_color, id_talla, sku, precio, stock) VALUES
-- Producto 1 — Camiseta Pima (Negro + Blanco en S, M, L)
(1,  1, 1, 1, 'TS-PIM-BLK-S',  89000.00, 15),
(2,  1, 1, 2, 'TS-PIM-BLK-M',  89000.00, 25),
(3,  1, 1, 3, 'TS-PIM-BLK-L',  89000.00, 8),
(4,  1, 2, 1, 'TS-PIM-WHT-S',  89000.00, 12),
(5,  1, 2, 2, 'TS-PIM-WHT-M',  89000.00, 0),
(6,  1, 2, 3, 'TS-PIM-WHT-L',  95000.00, 10),

-- Producto 2 — Chaqueta Cuero Nappa (Negro + Camel en M, L, XL)
(7,  2, 1, 2, 'JK-NAP-BLK-M',  450000.00, 5),
(8,  2, 1, 3, 'JK-NAP-BLK-L',  450000.00, 3),
(9,  2, 1, 4, 'JK-NAP-BLK-XL', 470000.00, 2),
(10, 2, 6, 2, 'JK-NAP-CAM-M',  460000.00, 4),

-- Producto 3 — Jeans Selvedge (Azul Navy S, M, L)
(11, 3, 3, 1, 'JN-SLV-NAV-S',  189000.00, 10),
(12, 3, 3, 2, 'JN-SLV-NAV-M',  189000.00, 15),
(13, 3, 3, 3, 'JN-SLV-NAV-L',  189000.00, 20),

-- Producto 4 — Camisa Lino (Blanco + Oliva en S, M, L)
(14, 4, 2, 1, 'SH-LIN-WHT-S',  149000.00, 8),
(15, 4, 2, 2, 'SH-LIN-WHT-M',  149000.00, 14),
(16, 4, 2, 3, 'SH-LIN-WHT-L',  149000.00, 9),
(17, 4, 4, 2, 'SH-LIN-OLV-M',  159000.00, 6),

-- Producto 5 — Abrigo Merino (Camel + Negro en S, M)
(18, 5, 6, 1, 'CO-MER-CAM-S',  380000.00, 4),
(19, 5, 6, 2, 'CO-MER-CAM-M',  380000.00, 6),
(20, 5, 1, 2, 'CO-MER-BLK-M',  380000.00, 3);

-- ------------------------------------------------------------
-- Proveedores
-- ------------------------------------------------------------
INSERT IGNORE INTO proveedores (id, nombre, contacto, email, telefono) VALUES
(1, 'Textiles Colombia SAS',  'Carlos Restrepo',    'carlos@textilescol.com',  '+57 300 123 4567'),
(2, 'Importadora Andina Ltda','María Fernanda Ruiz', 'mfruiz@impandina.com',   '+57 315 987 6543');

-- ------------------------------------------------------------
-- Relaciones producto ↔ proveedor
-- ------------------------------------------------------------
INSERT IGNORE INTO producto_proveedor (id_producto, id_proveedor) VALUES
(1, 1), (2, 2), (3, 1), (4, 1), (5, 2);

-- ------------------------------------------------------------
-- Usuario administrador por defecto
-- Password: Admin2024! (bcrypt hash generado con cost=12)
-- CAMBIAR INMEDIATAMENTE después del primer deploy
-- ------------------------------------------------------------
INSERT IGNORE INTO admin_usuarios (email, password_hash, nombre) VALUES
('admin1@tiendaintima.com',
 '$2y$12$noL5vrMh5g6SUn76erKP0.2JmiLqr9DEcZRkTN8xeWya0oNWeofpq',
 'Admin Tienda Íntima');

SET FOREIGN_KEY_CHECKS = 1;
