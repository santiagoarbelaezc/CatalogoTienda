<?php

declare(strict_types=1);

namespace App\Models;

final class Marca extends BaseModel
{
    /** @return array<int, array<string, mixed>> */
    public function findAll(): array
    {
        return $this->fetchAll('SELECT * FROM marcas ORDER BY nombre ASC');
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM marcas WHERE id = ?', [$id]);
    }

    public function create(string $nombre): int
    {
        return $this->insert('INSERT INTO marcas (nombre) VALUES (?)', [$nombre]);
    }

    public function update(int $id, string $nombre): bool
    {
        return $this->execute('UPDATE marcas SET nombre = ? WHERE id = ?', [$nombre, $id]) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM marcas WHERE id = ?', [$id]) > 0;
    }

    public function existsById(int $id): bool
    {
        return $this->count('SELECT COUNT(*) FROM marcas WHERE id = ?', [$id]) > 0;
    }
}
