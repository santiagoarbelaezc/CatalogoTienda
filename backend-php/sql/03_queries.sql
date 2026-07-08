-- ============================================================
-- CATÁLOGO TIENDA ÍNTIMA — Queries de ejemplo
-- Ejecutar DESPUÉS de 02_seed.sql
-- ============================================================

-- ------------------------------------------------------------
-- Q1: Listar productos por categoría con stock disponible
--     (Buscar todos los productos en "Chaquetas" con stock > 0)
-- ------------------------------------------------------------
SELECT
    p.id,
    p.nombre,
    p.precio_base,
    p.genero,
    m.nombre        AS marca,
    c.nombre        AS categoria,
    SUM(v.stock)    AS stock_total
FROM productos p
INNER JOIN categorias c ON c.id = p.id_categoria
INNER JOIN marcas     m ON m.id = p.id_marca
INNER JOIN variantes  v ON v.id_producto = p.id
WHERE p.activo = 1
  AND p.id_categoria = 13  -- Chaquetas
GROUP BY p.id, p.nombre, p.precio_base, p.genero, m.nombre, c.nombre
HAVING stock_total > 0
ORDER BY p.nombre;

-- ------------------------------------------------------------
-- Q2: Buscar productos por rango de precio base
--     (Entre $100,000 y $400,000 COP)
-- ------------------------------------------------------------
SELECT
    p.id,
    p.nombre,
    p.precio_base,
    m.nombre AS marca,
    c.nombre AS categoria
FROM productos p
INNER JOIN marcas     m ON m.id = p.id_marca
INNER JOIN categorias c ON c.id = p.id_categoria
WHERE p.activo = 1
  AND p.precio_base BETWEEN 100000 AND 400000
ORDER BY p.precio_base ASC;

-- ------------------------------------------------------------
-- Q3: Variantes con stock bajo (< 5 unidades)
--     Con SKU, producto, color, talla y stock actual
-- ------------------------------------------------------------
SELECT
    v.sku,
    p.nombre        AS producto,
    co.nombre       AS color,
    t.nombre        AS talla,
    v.stock,
    v.precio
FROM variantes v
INNER JOIN productos p ON p.id = v.id_producto
INNER JOIN colores   co ON co.id = v.id_color
INNER JOIN tallas    t  ON t.id  = v.id_talla
WHERE p.activo = 1
  AND v.stock < 5
ORDER BY v.stock ASC, p.nombre ASC;

-- ------------------------------------------------------------
-- Q4: Productos filtrados por marca (Urban Wear = id 2)
--     con conteo de variantes y stock total
-- ------------------------------------------------------------
SELECT
    p.id,
    p.nombre,
    p.precio_base,
    p.genero,
    c.nombre            AS categoria,
    COUNT(v.id)         AS total_variantes,
    SUM(v.stock)        AS stock_total,
    MIN(v.precio)       AS precio_min,
    MAX(v.precio)       AS precio_max
FROM productos p
INNER JOIN marcas     m ON m.id = p.id_marca
INNER JOIN categorias c ON c.id = p.id_categoria
LEFT  JOIN variantes  v ON v.id_producto = p.id
WHERE p.activo = 1
  AND p.id_marca = 2  -- Urban Wear
GROUP BY p.id, p.nombre, p.precio_base, p.genero, c.nombre
ORDER BY p.nombre;

-- ------------------------------------------------------------
-- Q5: Variantes disponibles por talla Y color de un producto
--     (Producto 1 = Camiseta Pima, todas las variantes en stock)
-- ------------------------------------------------------------
SELECT
    v.sku,
    co.nombre   AS color,
    co.hex      AS color_hex,
    t.nombre    AS talla,
    v.precio,
    v.stock,
    CASE WHEN v.stock > 0 THEN 'Disponible' ELSE 'Agotado' END AS disponibilidad
FROM variantes v
INNER JOIN colores co ON co.id = v.id_color
INNER JOIN tallas  t  ON t.id  = v.id_talla
WHERE v.id_producto = 1   -- Camiseta Pima Essential
ORDER BY t.orden ASC, co.nombre ASC;
