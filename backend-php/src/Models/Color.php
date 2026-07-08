<?php

declare(strict_types=1);

namespace App\Models;

final class Color extends BaseModel
{
    public function findAll(): array
    {
        return $this->fetchAll('SELECT * FROM colores ORDER BY nombre ASC');
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM colores WHERE id = ?', [$id]);
    }

    public function create(string $nombre, string $hex): int
    {
        return $this->insert(
            'INSERT INTO colores (nombre, hex) VALUES (?, ?)',
            [$nombre, strtoupper($hex)]
        );
    }

    public function update(int $id, string $nombre, string $hex): bool
    {
        return $this->execute(
            'UPDATE colores SET nombre = ?, hex = ? WHERE id = ?',
            [$nombre, strtoupper($hex), $id]
        ) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM colores WHERE id = ?', [$id]) > 0;
    }

    public function existsById(int $id): bool
    {
        return $this->count('SELECT COUNT(*) FROM colores WHERE id = ?', [$id]) > 0;
    }
}
