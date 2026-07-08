<?php

declare(strict_types=1);

namespace App\Models;

final class Tela extends BaseModel
{
    public function findAll(): array
    {
        return $this->fetchAll('SELECT * FROM telas ORDER BY nombre ASC');
    }

    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM telas WHERE id = ?', [$id]);
    }

    public function create(string $nombre, string $composicion): int
    {
        return $this->insert(
            'INSERT INTO telas (nombre, composicion) VALUES (?, ?)',
            [$nombre, $composicion]
        );
    }

    public function update(int $id, string $nombre, string $composicion): bool
    {
        return $this->execute(
            'UPDATE telas SET nombre = ?, composicion = ? WHERE id = ?',
            [$nombre, $composicion, $id]
        ) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM telas WHERE id = ?', [$id]) > 0;
    }

    public function existsById(int $id): bool
    {
        return $this->count('SELECT COUNT(*) FROM telas WHERE id = ?', [$id]) > 0;
    }
}
