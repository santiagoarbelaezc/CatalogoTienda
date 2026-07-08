<?php

declare(strict_types=1);

namespace App\Models;

/**
 * Repositorio de Productos — el modelo más complejo.
 *
 * Soporta filtros dinámicos, paginación y carga eager de relaciones
 * (categoría, marca, tela, imágenes, variantes con color y talla).
 */
final class Producto extends BaseModel
{
    private const BASE_SELECT = <<<SQL
        SELECT
            p.id,
            p.nombre,
            p.descripcion,
            p.precio_base,
            p.genero,
            p.temporada,
            p.activo,
            p.creado_en,
            p.actualizado_en,
            -- Categoría
            c.id         AS cat_id,
            c.nombre     AS cat_nombre,
            c.id_padre   AS cat_id_padre,
            -- Marca
            m.id         AS marca_id,
            m.nombre     AS marca_nombre,
            -- Tela
            t.id         AS tela_id,
            t.nombre     AS tela_nombre,
            t.composicion AS tela_composicion
        FROM productos p
        LEFT JOIN categorias c ON c.id = p.id_categoria
        LEFT JOIN marcas     m ON m.id = p.id_marca
        LEFT JOIN telas      t ON t.id = p.id_tela
    SQL;

    /**
     * Lista de productos con filtros dinámicos y paginación.
     *
     * @param array<string, mixed> $filters
     * @return array{items: array<int, array<string, mixed>>, total: int}
     */
    public function findAll(array $filters = [], int $limit = 20, int $offset = 0): array
    {
        [$where, $bindings] = $this->buildWhereClause($filters);

        $orderBy = $this->buildOrderBy($filters['sort'] ?? '');

        $sql = self::BASE_SELECT . " WHERE {$where} {$orderBy} LIMIT ? OFFSET ?";
        $allBindings = array_merge($bindings, [$limit, $offset]);

        $rows = $this->fetchAll($sql, $allBindings);

        $countSql = "SELECT COUNT(DISTINCT p.id) FROM productos p
                     LEFT JOIN categorias c ON c.id = p.id_categoria
                     LEFT JOIN marcas     m ON m.id = p.id_marca
                     LEFT JOIN telas      t ON t.id = p.id_tela
                     WHERE {$where}";
        $total = $this->count($countSql, $bindings);

        $items = array_map(function (array $row): array {
            $item = $this->mapRow($row);
            $id = (int) $row['id'];
            $item['variantes'] = $this->loadVariantes($id);
            $item['imagenes']  = $this->loadImagenes($id);
            return $item;
        }, $rows);

        return [
            'items' => $items,
            'total' => $total,
        ];
    }

    /**
     * Detalle de un producto con variantes + imágenes cargadas.
     *
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array
    {
        $sql = self::BASE_SELECT . ' WHERE p.id = ?';
        $row = $this->fetchOne($sql, [$id]);

        if ($row === null) {
            return null;
        }

        $product = $this->mapRow($row);
        $product['variantes'] = $this->loadVariantes($id);
        $product['imagenes']  = $this->loadImagenes($id);
        $product['proveedores'] = $this->loadProveedores($id);

        return $product;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): int
    {
        return $this->insert(
            'INSERT INTO productos
             (nombre, descripcion, precio_base, genero, temporada, activo, id_categoria, id_marca, id_tela)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $data['nombre'],
                $data['descripcion'] ?? null,
                $data['precio_base'],
                $data['genero']      ?? 'Unisex',
                $data['temporada']   ?? null,
                isset($data['activo']) ? (int) $data['activo'] : 1,
                $data['id_categoria'] ?? null,
                $data['id_marca']     ?? null,
                $data['id_tela']      ?? null,
            ]
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): bool
    {
        return $this->execute(
            'UPDATE productos
             SET nombre = ?, descripcion = ?, precio_base = ?, genero = ?,
                 temporada = ?, activo = ?, id_categoria = ?, id_marca = ?, id_tela = ?
             WHERE id = ?',
            [
                $data['nombre'],
                $data['descripcion'] ?? null,
                $data['precio_base'],
                $data['genero']      ?? 'Unisex',
                $data['temporada']   ?? null,
                isset($data['activo']) ? (int) $data['activo'] : 1,
                $data['id_categoria'] ?? null,
                $data['id_marca']     ?? null,
                $data['id_tela']      ?? null,
                $id,
            ]
        ) > 0;
    }

    /** Soft delete */
    public function softDelete(int $id): bool
    {
        return $this->execute(
            'UPDATE productos SET activo = 0 WHERE id = ?',
            [$id]
        ) > 0;
    }

    /** Hard delete (para uso desde admin consciente) */
    public function hardDelete(int $id): bool
    {
        return $this->execute('DELETE FROM productos WHERE id = ?', [$id]) > 0;
    }

    public function existsById(int $id): bool
    {
        return $this->count('SELECT COUNT(*) FROM productos WHERE id = ?', [$id]) > 0;
    }

    // ── Loaders de relaciones ─────────────────────────────────────────

    /** @return array<int, array<string, mixed>> */
    private function loadVariantes(int $productoId): array
    {
        $rows = $this->fetchAll(
            'SELECT v.id, v.sku, v.precio, v.stock, v.actualizado_en,
                    co.id AS color_id, co.nombre AS color_nombre, co.hex AS color_hex,
                    ta.id AS talla_id, ta.nombre AS talla_nombre, ta.orden AS talla_orden
             FROM variantes v
             LEFT JOIN colores co ON co.id = v.id_color
             LEFT JOIN tallas  ta ON ta.id = v.id_talla
             WHERE v.id_producto = ?
             ORDER BY ta.orden ASC, co.nombre ASC',
            [$productoId]
        );

        return array_map(static function (array $r): array {
            return [
                'id'    => (int) $r['id'],
                'sku'   => $r['sku'],
                'precio'=> (float) $r['precio'],
                'stock' => (int) $r['stock'],
                'actualizado_en' => $r['actualizado_en'],
                'color' => [
                    'id'     => (int) $r['color_id'],
                    'nombre' => $r['color_nombre'],
                    'hex'    => $r['color_hex'],
                ],
                'talla' => [
                    'id'     => (int) $r['talla_id'],
                    'nombre' => $r['talla_nombre'],
                    'orden'  => (int) $r['talla_orden'],
                ],
            ];
        }, $rows);
    }

    /** @return array<int, array<string, mixed>> */
    private function loadImagenes(int $productoId): array
    {
        $rows = $this->fetchAll(
            'SELECT id, id_variante, cloudinary_public_id, url, es_principal, orden
             FROM imagenes
             WHERE id_producto = ?
             ORDER BY es_principal DESC, orden ASC',
            [$productoId]
        );

        return array_map(static fn(array $r) => [
            'id'                   => (int) $r['id'],
            'id_variante'          => $r['id_variante'] ? (int) $r['id_variante'] : null,
            'cloudinary_public_id' => $r['cloudinary_public_id'],
            'url'                  => $r['url'],
            'es_principal'         => (bool) $r['es_principal'],
            'orden'                => (int) $r['orden'],
        ], $rows);
    }

    /** @return array<int, array<string, mixed>> */
    private function loadProveedores(int $productoId): array
    {
        return $this->fetchAll(
            'SELECT pr.id, pr.nombre, pr.contacto, pr.email, pr.telefono
             FROM proveedores pr
             INNER JOIN producto_proveedor pp ON pp.id_proveedor = pr.id
             WHERE pp.id_producto = ?
             ORDER BY pr.nombre ASC',
            [$productoId]
        );
    }

    // ── Builders ──────────────────────────────────────────────────────

    /**
     * Construye WHERE dinámico sin SQL injection.
     *
     * @param array<string, mixed> $filters
     * @return array{0: string, 1: array<int, mixed>}
     */
    private function buildWhereClause(array $filters): array
    {
        $conditions = ['1 = 1'];
        $bindings   = [];

        // Solo activos por defecto, a menos que se pida incluir inactivos
        if (!isset($filters['incluir_inactivos']) || !$filters['incluir_inactivos']) {
            $conditions[] = 'p.activo = 1';
        }

        if (!empty($filters['categoria'])) {
            $conditions[] = 'p.id_categoria = ?';
            $bindings[]   = (int) $filters['categoria'];
        }

        if (!empty($filters['marca'])) {
            $conditions[] = 'p.id_marca = ?';
            $bindings[]   = (int) $filters['marca'];
        }

        if (!empty($filters['tela'])) {
            $conditions[] = 'p.id_tela = ?';
            $bindings[]   = (int) $filters['tela'];
        }

        if (!empty($filters['genero'])) {
            $conditions[] = 'p.genero = ?';
            $bindings[]   = $filters['genero'];
        }

        if (!empty($filters['temporada'])) {
            $conditions[] = 'p.temporada = ?';
            $bindings[]   = $filters['temporada'];
        }

        if (isset($filters['min_precio']) && is_numeric($filters['min_precio'])) {
            $conditions[] = 'p.precio_base >= ?';
            $bindings[]   = (float) $filters['min_precio'];
        }

        if (isset($filters['max_precio']) && is_numeric($filters['max_precio'])) {
            $conditions[] = 'p.precio_base <= ?';
            $bindings[]   = (float) $filters['max_precio'];
        }

        if (!empty($filters['q'])) {
            $conditions[] = '(p.nombre LIKE ? OR p.descripcion LIKE ?)';
            $term         = '%' . $filters['q'] . '%';
            $bindings[]   = $term;
            $bindings[]   = $term;
        }

        return [implode(' AND ', $conditions), $bindings];
    }

    private function buildOrderBy(string $sort): string
    {
        return match ($sort) {
            'precio_asc'  => 'ORDER BY p.precio_base ASC',
            'precio_desc' => 'ORDER BY p.precio_base DESC',
            'nombre_desc' => 'ORDER BY p.nombre DESC',
            'recientes'   => 'ORDER BY p.creado_en DESC',
            default       => 'ORDER BY p.nombre ASC',
        };
    }

    /**
     * Mapea una fila plana de BD al formato JSON anidado.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function mapRow(array $row): array
    {
        return [
            'id'            => (int) $row['id'],
            'nombre'        => $row['nombre'],
            'descripcion'   => $row['descripcion'],
            'precio_base'   => (float) $row['precio_base'],
            'genero'        => $row['genero'],
            'temporada'     => $row['temporada'],
            'activo'        => (bool) $row['activo'],
            'creado_en'     => $row['creado_en'],
            'actualizado_en'=> $row['actualizado_en'],
            'categoria'     => [
                'id'       => $row['cat_id'] !== null ? (int) $row['cat_id'] : null,
                'nombre'   => $row['cat_nombre'],
                'id_padre' => $row['cat_id_padre'] !== null ? (int) $row['cat_id_padre'] : null,
            ],
            'marca' => [
                'id'     => $row['marca_id'] !== null ? (int) $row['marca_id'] : null,
                'nombre' => $row['marca_nombre'],
            ],
            'tela' => [
                'id'          => $row['tela_id'] !== null ? (int) $row['tela_id'] : null,
                'nombre'      => $row['tela_nombre'],
                'composicion' => $row['tela_composicion'],
            ],
        ];
    }
}
