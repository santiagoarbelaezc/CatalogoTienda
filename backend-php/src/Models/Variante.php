<?php

declare(strict_types=1);

namespace App\Models;

final class Variante extends BaseModel
{
    public function findByProducto(int $productoId): array
    {
        return $this->fetchAll(
            'SELECT v.*, co.nombre AS color_nombre, co.hex AS color_hex,
                    ta.nombre AS talla_nombre, ta.orden AS talla_orden
             FROM variantes v
             LEFT JOIN colores co ON co.id = v.id_color
             LEFT JOIN tallas  ta ON ta.id = v.id_talla
             WHERE v.id_producto = ?
             ORDER BY ta.orden ASC, co.nombre ASC',
            [$productoId]
        );
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne(
            'SELECT v.*, co.nombre AS color_nombre, co.hex AS color_hex,
                    ta.nombre AS talla_nombre, ta.orden AS talla_orden
             FROM variantes v
             LEFT JOIN colores co ON co.id = v.id_color
             LEFT JOIN tallas  ta ON ta.id = v.id_talla
             WHERE v.id = ?',
            [$id]
        );
    }

    public function findBySku(string $sku): ?array
    {
        return $this->fetchOne('SELECT * FROM variantes WHERE sku = ?', [$sku]);
    }

    /** @param array<string, mixed> $data */
    public function create(array $data): int
    {
        return $this->insert(
            'INSERT INTO variantes (id_producto, id_color, id_talla, sku, precio, stock)
             VALUES (?, ?, ?, ?, ?, ?)',
            [
                (int) $data['id_producto'],
                $data['id_color'] !== null ? (int) $data['id_color'] : null,
                $data['id_talla'] !== null ? (int) $data['id_talla'] : null,
                strtoupper(trim($data['sku'])),
                (float) $data['precio'],
                (int) ($data['stock'] ?? 0),
            ]
        );
    }

    /** @param array<string, mixed> $data */
    public function update(int $id, array $data): bool
    {
        return $this->execute(
            'UPDATE variantes SET id_color = ?, id_talla = ?, sku = ?, precio = ?, stock = ?
             WHERE id = ?',
            [
                $data['id_color'] !== null ? (int) $data['id_color'] : null,
                $data['id_talla'] !== null ? (int) $data['id_talla'] : null,
                strtoupper(trim($data['sku'])),
                (float) $data['precio'],
                (int) $data['stock'],
                $id,
            ]
        ) > 0;
    }

    public function updateStock(int $id, int $delta): bool
    {
        return $this->execute(
            'UPDATE variantes SET stock = GREATEST(0, stock + ?) WHERE id = ?',
            [$delta, $id]
        ) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM variantes WHERE id = ?', [$id]) > 0;
    }

    public function existsById(int $id): bool
    {
        return $this->count('SELECT COUNT(*) FROM variantes WHERE id = ?', [$id]) > 0;
    }

    public function skuExists(string $sku, ?int $excludeId = null): bool
    {
        $sql      = 'SELECT COUNT(*) FROM variantes WHERE sku = ?';
        $bindings = [strtoupper(trim($sku))];

        if ($excludeId !== null) {
            $sql      .= ' AND id != ?';
            $bindings[] = $excludeId;
        }

        return $this->count($sql, $bindings) > 0;
    }

    public function getLowStock(int $threshold = 5): array
    {
        return $this->fetchAll(
            'SELECT v.*, p.nombre AS producto_nombre,
                    co.nombre AS color_nombre, ta.nombre AS talla_nombre
             FROM variantes v
             INNER JOIN productos p  ON p.id  = v.id_producto
             LEFT  JOIN colores  co ON co.id  = v.id_color
             LEFT  JOIN tallas   ta ON ta.id  = v.id_talla
             WHERE v.stock < ? AND p.activo = 1
             ORDER BY v.stock ASC',
            [$threshold]
        );
    }
}
