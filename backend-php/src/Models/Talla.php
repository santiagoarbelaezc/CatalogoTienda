<?php

declare(strict_types=1);

namespace App\Models;

final class Talla extends BaseModel
{
    public function findAll(): array
    {
        return $this->fetchAll('SELECT * FROM tallas ORDER BY orden ASC, nombre ASC');
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM tallas WHERE id = ?', [$id]);
    }

    public function create(string $nombre, int $orden = 0): int
    {
        return $this->insert(
            'INSERT INTO tallas (nombre, orden) VALUES (?, ?)',
            [$nombre, $orden]
        );
    }

    public function update(int $id, string $nombre, int $orden): bool
    {
        return $this->execute(
            'UPDATE tallas SET nombre = ?, orden = ? WHERE id = ?',
            [$nombre, $orden, $id]
        ) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM tallas WHERE id = ?', [$id]) > 0;
    }

    public function existsById(int $id): bool
    {
        return $this->count('SELECT COUNT(*) FROM tallas WHERE id = ?', [$id]) > 0;
    }
}
