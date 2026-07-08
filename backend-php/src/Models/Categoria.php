<?php

declare(strict_types=1);

namespace App\Models;

/**
 * Repositorio de Categorías.
 * Incluye soporte completo para árbol auto-referencial.
 */
final class Categoria extends BaseModel
{
    /** @return array<int, array<string, mixed>> */
    public function findAll(): array
    {
        return $this->fetchAll('SELECT * FROM categorias ORDER BY id_padre IS NOT NULL, nombre ASC');
    }

    /**
     * Retorna el árbol completo con subcategorías anidadas.
     *
     * @return array<int, array<string, mixed>>
     */
    public function findTree(): array
    {
        $all    = $this->findAll();
        $byId   = [];
        $roots  = [];

        foreach ($all as $cat) {
            $cat['subcategorias'] = [];
            $byId[$cat['id']] = $cat;
        }

        foreach ($byId as $id => &$cat) {
            if ($cat['id_padre'] === null) {
                $roots[] = &$cat;
            } else {
                $byId[$cat['id_padre']]['subcategorias'][] = &$cat;
            }
        }
        unset($cat);

        return $roots;
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        return $this->fetchOne('SELECT * FROM categorias WHERE id = ?', [$id]);
    }

    public function create(string $nombre, ?int $idPadre): int
    {
        return $this->insert(
            'INSERT INTO categorias (nombre, id_padre) VALUES (?, ?)',
            [$nombre, $idPadre]
        );
    }

    public function update(int $id, string $nombre, ?int $idPadre): bool
    {
        return $this->execute(
            'UPDATE categorias SET nombre = ?, id_padre = ? WHERE id = ?',
            [$nombre, $idPadre, $id]
        ) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->execute('DELETE FROM categorias WHERE id = ?', [$id]) > 0;
    }

    public function existsById(int $id): bool
    {
        return $this->count('SELECT COUNT(*) FROM categorias WHERE id = ?', [$id]) > 0;
    }
}
