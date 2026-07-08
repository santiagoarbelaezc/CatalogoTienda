<?php

declare(strict_types=1);

namespace App\Models;

final class Imagen extends BaseModel
{
    public function findByProducto(int $productoId): array
    {
        return $this->fetchAll(
            'SELECT * FROM imagenes WHERE id_producto = ? ORDER BY es_principal DESC, orden ASC',
            [$productoId]
        );
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM imagenes WHERE id = ?', [$id]);
    }

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): int
    {
        // Si se marca como principal, quitar el flag de las demás del mismo producto
        if (!empty($data['es_principal'])) {
            $this->execute(
                'UPDATE imagenes SET es_principal = 0 WHERE id_producto = ?',
                [(int) $data['id_producto']]
            );
        }

        return $this->insert(
            'INSERT INTO imagenes (id_producto, id_variante, cloudinary_public_id, url, es_principal, orden)
             VALUES (?, ?, ?, ?, ?, ?)',
            [
                (int) $data['id_producto'],
                isset($data['id_variante']) ? (int) $data['id_variante'] : null,
                $data['cloudinary_public_id'],
                $data['url'],
                !empty($data['es_principal']) ? 1 : 0,
                (int) ($data['orden'] ?? 0),
            ]
        );
    }

    public function setPrincipal(int $id, int $productoId): bool
    {
        $this->execute(
            'UPDATE imagenes SET es_principal = 0 WHERE id_producto = ?',
            [$productoId]
        );

        return $this->execute(
            'UPDATE imagenes SET es_principal = 1 WHERE id = ?',
            [$id]
        ) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM imagenes WHERE id = ?', [$id]) > 0;
    }

    public function existsById(int $id): bool
    {
        return $this->count('SELECT COUNT(*) FROM imagenes WHERE id = ?', [$id]) > 0;
    }
}
